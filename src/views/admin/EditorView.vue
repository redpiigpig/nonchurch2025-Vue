<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { marked } from "marked";
import markedFootnote from "marked-footnote";
import { supabase } from "../../supabase";

marked.use(markedFootnote());

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const isEditMode = ref(false);
const showPreview = ref(true);
const textareaRef = ref(null);

const form = ref({
  id: "",
  title: "",
  subtitle: "",
  issue: 5,
  issue_title: "誕神者",
  category: "",
  author: "",
  author_title: "",
  remark: "",
  summary: "",
  content: "",
  keyword: "",
  footnotes: [],
  prev_id: "",
  next_id: "",
});

const seoJson = ref('{\n  "description": "",\n  "keywords": ""\n}');

const categories = [
  { name: "專題文章", color: "#8b0000" },
  { name: "評論與回應", color: "#ff8000" },
  { name: "人物專訪", color: "#f0e137" },
  { name: "生命故事", color: "#46b175" },
  { name: "時事感想", color: "#4682b4" },
  { name: "文藝創作", color: "#27408b" },
  { name: "公告與剪影", color: "#6a5acd" },
  { name: "封面故事", color: "#7d6c29" },
  { name: "光影時刻", color: "#7d6c29" },
  { name: "實驗園地", color: "#db7093" },
];

const currentCategoryColor = computed(() => {
  const cat = categories.find((c) => c.name === form.value.category);
  return cat ? cat.color : "#ccc";
});

const previewContent = computed(() => {
  let content = form.value.content || "";

  if (form.value.footnotes && form.value.footnotes.length > 0) {
    content += "\n\n<div class='footnotes'><ol>";
    form.value.footnotes.forEach((note) => {
      content += `<li>${note.text}</li>`;
    });
    content += "</ol></div>";
  }

  // 自動將單次換行轉為段落
  const formattedContent = content.replace(/([^\n])\n([^\n])/g, "$1\n\n$2");
  return marked.parse(formattedContent, { gfm: true, breaks: true });
});

onMounted(async () => {
  document.title = "編輯者頁面 - 無境界者雜誌";

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    alert("請先登入！");
    router.push("/login");
    return;
  }

  // 1. 如果有 ID，代表是編輯舊文章
  if (route.params.id) {
    isEditMode.value = true;
    loadArticle(route.params.id);
  }
  // 2. 🔥 新增邏輯：如果是新增文章，檢查是否有期數參數
  else if (route.query.issue) {
    form.value.issue = parseInt(route.query.issue);
    // 如果有傳來期數標題，也順便填入
    if (route.query.issueTitle) {
      form.value.issue_title = route.query.issueTitle;
    }
  }
});

const loadArticle = async (id) => {
  loading.value = true;
  const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();
  if (error) {
    alert("讀取失敗");
  } else {
    form.value = { ...data };

    if (data.prev_article) form.value.prev_id = data.prev_article.id;
    if (data.next_article) form.value.next_id = data.next_article.id;

    if (!form.value.footnotes) form.value.footnotes = [];
    if (!form.value.summary) form.value.summary = "";
    if (data.seo) seoJson.value = JSON.stringify(data.seo, null, 2);
  }
  loading.value = false;
};

const resolveNeighbor = async (idInput) => {
  if (!idInput || !idInput.trim()) return null;
  const { data } = await supabase.from("articles").select("title").eq("id", idInput).single();
  if (data) {
    return { id: idInput, title: data.title };
  }
  const titleGuess = idInput.replace(/^\d+-\d+/, "");
  return { id: idInput, title: titleGuess || idInput };
};

const handlePreview = () => {
  const previewData = {
    ...form.value,
    authorTitle: form.value.author_title,
    issueTitle: form.value.issue_title,
    prev: form.value.prev_id ? { id: form.value.prev_id, title: "預覽中..." } : null,
    next: form.value.next_id ? { id: form.value.next_id, title: "預覽中..." } : null,
  };

  localStorage.setItem("preview_article", JSON.stringify(previewData));

  const routeData = router.resolve({ name: "article-preview" });
  window.open(routeData.href, "_blank");
};

const saveArticle = async () => {
  if (!form.value.id || !form.value.title) return alert("ID 和標題必填！");

  loading.value = true;
  try {
    const prevObj = await resolveNeighbor(form.value.prev_id);
    const nextObj = await resolveNeighbor(form.value.next_id);

    const payload = {
      ...form.value,
      prev_article: prevObj,
      next_article: nextObj,
      seo: JSON.parse(seoJson.value),
      updated_at: new Date(),
    };

    delete payload.prev_id;
    delete payload.next_id;

    const { error } = await supabase.from("articles").upsert(payload);

    if (error) throw error;

    alert("儲存成功！🎉");
    router.push(`/articles/${form.value.id}`);
  } catch (err) {
    alert("儲存失敗：" + err.message);
  } finally {
    loading.value = false;
  }
};

const addFootnote = () => {
  const nextId = form.value.footnotes.length + 1;
  form.value.footnotes.push({ id: nextId, text: "" });
};

const removeFootnote = (index) => {
  form.value.footnotes.splice(index, 1);
  form.value.footnotes.forEach((note, idx) => (note.id = idx + 1));
};

const insertOrWrap = async (
  prefix,
  suffix,
  defaultText = "文字",
  togglePrefix = null,
  toggleSuffix = null
) => {
  const textarea = textareaRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const originalText = form.value.content;
  const selectedText = originalText.substring(start, end);

  // 檢查標籤使用 togglePrefix/toggleSuffix，若無則使用 prefix/suffix
  const checkPrefix = togglePrefix || prefix;
  const checkSuffix = toggleSuffix || suffix;

  let newText = "";
  let newSelectionStart = 0;
  let newSelectionEnd = 0;

  // 1. 檢查選取的文字是否已經被標籤包裹 (檢查前後是否匹配)
  const isWrapped =
    originalText.substring(start - checkPrefix.length, start) === checkPrefix &&
    originalText.substring(end, end + checkSuffix.length) === checkSuffix;

  if (isWrapped) {
    // 情況 1: 移除標籤 (Toggle Off)
    newText =
      originalText.substring(0, start - checkPrefix.length) +
      selectedText +
      originalText.substring(end + checkSuffix.length);

    newSelectionStart = start - checkPrefix.length;
    newSelectionEnd = newSelectionStart + selectedText.length;
  } else if (selectedText.length > 0) {
    // 情況 2: 包裹選取的文字 (Wrap)
    newText =
      originalText.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      originalText.substring(end);

    newSelectionStart = start + prefix.length;
    newSelectionEnd = newSelectionStart + selectedText.length;
  } else {
    // 情況 3: 插入預設文字 (Insert Default)
    newText =
      originalText.substring(0, start) +
      prefix +
      defaultText +
      suffix +
      originalText.substring(end);

    newSelectionStart = start + prefix.length;
    newSelectionEnd = newSelectionStart + defaultText.length;
  }

  form.value.content = newText;

  await nextTick();

  textarea.focus({ preventScroll: true });
  textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
};

const insertBlock = async (template) => {
  const textarea = textareaRef.value;
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const originalText = form.value.content;
  const newText = originalText.substring(0, start) + template + originalText.substring(end);
  form.value.content = newText;
  await nextTick();
  textarea.focus({ preventScroll: true });
  textarea.selectionStart = textarea.selectionEnd = start + template.length;
};

// 【修改】tools 陣列：加入「置右」和「小字體」
const tools = [
  { label: "H2 副標", action: () => insertOrWrap("## ", "\n", "輸入標題") },
  { label: "H3 小標", action: () => insertOrWrap("### ", "\n", "輸入標題") },
  { label: "粗體", action: () => insertOrWrap("**", "**", "粗體文字") },
  { label: "斜體", action: () => insertOrWrap("<i>", "</i>", "斜體文字") },
  { label: "標楷體", action: () => insertOrWrap("*", "*", "標楷體文字") },
  { label: "註釋號碼", action: () => insertOrWrap("[^", "]", "1") },
  {
    label: "一般引言",
    action: () =>
      insertOrWrap(
        "<blockquote>\n",
        '\n<div class="rel">── 出處</div>\n</blockquote>\n',
        "引用的內文..."
      ),
  },
  { label: "去除縮排", action: () => insertOrWrap('<p class="no-indent">', "</p>", "無縮排文字") },
  { label: "分隔線", action: () => insertBlock('\n<div class="custom-divider"></div>\n') },

  // --- 新增的功能 ---
  {
    label: "置右",
    action: () => {
      const prefix = '<span style="display: block; text-align: right;">';
      const suffix = "</span>";
      // 由於 text-align: right 是 span 的樣式，所以檢查時只需要 prefix/suffix 即可
      insertOrWrap(prefix, suffix, "請在此輸入置右文字", prefix, suffix);
    },
  },
  {
    label: "小字體",
    action: () => {
      const prefix = '<span style="font-size: 1rem; font-family: serif;">';
      const suffix = "</span>";
      // 由於 font-size/font-family 是 span 的樣式，所以檢查時只需要 prefix/suffix 即可
      insertOrWrap(prefix, suffix, "請在此輸入小字體文字", prefix, suffix);
    },
  },
  // --------------------
];

const components = [
  {
    label: "📚 書籍簡介",
    action: () =>
      insertBlock(
        `<div class="book-box">\n  <div class="book-info">\n    <strong>書籍資訊</strong><br />\n    【書名】...<br />\n    【作者】...<br />\n    【出版】...\n  </div>\n  <div class="book-image">\n    <img src="圖片網址" alt="封面" />\n  </div>\n</div>\n`
      ),
  },
  {
    label: "❝ 書本引言",
    action: () =>
      insertBlock(
        // 【修正 2】移除 "引用的內文..." 和 <div class="book-quote-rel"> 前面的空格
        `<div class="book-quote">\n引用的內文...\n<div class="book-quote-rel"> ──《書名》，頁數 </div>\n</div>\n`
      ),
  },
  {
    label: "🖼️ 主題圖片",
    action: () =>
      insertBlock(`<div class="theme-image">\n  <img src="圖片網址" alt="主題圖片">\n</div>\n`),
  },
  {
    label: "🖼️ 圖片(左)",
    action: () =>
      insertBlock(
        `<figure class="img-left px-300">\n  <img src="圖片網址" alt="描述">\n  <figcaption>圖片說明</figcaption>\n</figure>\n`
      ),
  },
  {
    label: "🖼️ 圖片(中)",
    action: () =>
      insertBlock(
        `<figure class="img-bottom px-600">\n  <img src="圖片網址" alt="描述">\n  <figcaption>圖片說明文字</figcaption>\n</figure>\n`
      ),
  },
  {
    label: "🖼️ 圖片(右)",
    action: () =>
      insertBlock(
        `<figure class="img-right px-300">\n  <img src="圖片網址" alt="描述">\n  <figcaption>圖片說明</figcaption>\n</figure>\n`
      ),
  },
  {
    label: "👤 作者簡介",
    action: () =>
      insertBlock(
        `<div class="author-profile">\n  <img src="圖片網址" alt="作者頭像">\n  <div>\n    <h3>作者名稱</h3>\n    <p>作者簡介內容...</p>\n  </div>\n</div>\n`
      ),
  },
  {
    label: "ℹ️ 資訊卡片",
    action: () =>
      insertBlock(
        `<div class="info-card">\n  <div class="info-card-inner">\n    <img src="Logo網址" alt="Logo">\n    <div>\n      <h3>標題</h3>\n      <div class="info-card-links">\n        <a href="#" target="_blank">連結1</a>\n      </div>\n    </div>\n  </div>\n</div>\n`
      ),
  },
  {
    label: "📜 參考資料",
    action: () => {
      // 1. 彈出提示，詢問要生成幾列
      let numRows = prompt("請輸入參考資料的列數（預設為 2）：", "2");

      // 檢查輸入是否為有效數字，否則默認為 2
      numRows = parseInt(numRows);
      if (isNaN(numRows) || numRows <= 0) {
        numRows = 2;
      }

      let listItems = "";

      // 2. 根據列數生成列表項目
      for (let i = 1; i <= numRows; i++) {
        listItems += `
    <div style="text-indent: -1.5rem; padding-left: 1.5rem; margin-bottom: 1rem; line-height: 1.8;">
      •&nbsp;&nbsp;資料來源${i}...
    </div>`;
      }

      // 3. 組合完整的 HTML 區塊
      const template = `
<div class="reference-box">
  <strong>參考資料</strong>
  <div style="margin-top: 1rem; margin-bottom: 1rem;">${listItems}
  </div>
</div>
`;

      // 4. 插入到編輯器中
      insertBlock(template);
    },
  },
  {
    label: "📊 表格",
    action: () => {
      // 1. 彈出提示，詢問尺寸
      let sizeInput = prompt("請輸入表格尺寸 (欄x列)，例如：3x4。預設為 2x5：", "2x5");

      let cols = 2; // 預設欄數
      let rows = 5; // 預設列數

      if (sizeInput) {
        // 解析輸入，格式應為 C x R
        const parts = sizeInput.toLowerCase().split(/[x\*]/);

        if (parts.length === 2) {
          const c = parseInt(parts[0].trim());
          const r = parseInt(parts[1].trim());

          // 確保是有效的正整數
          if (!isNaN(c) && c > 0) cols = c;
          if (!isNaN(r) && r > 0) rows = r;
        }
      }

      // 2. 動態生成表頭 (thead)
      let tableHeader = "  <thead>\n    <tr>";
      for (let i = 1; i <= cols; i++) {
        tableHeader += `\n      <th>標題${i}</th>`;
      }
      tableHeader += "\n    </tr>\n  </thead>";

      // 3. 動態生成表身 (tbody)
      let tableBody = "  <tbody>";
      for (let r = 1; r <= rows; r++) {
        tableBody += "\n    <tr>";
        for (let c = 1; c <= cols; c++) {
          // 確保內容可編輯，這裡放內容提示
          tableBody += `\n      <td>內容 ${r}-${c}</td>`;
        }
        tableBody += "\n    </tr>";
      }
      tableBody += "\n  </tbody>";

      // 4. 組合完整的 HTML 區塊
      const template = `
<table class="data-table">
${tableHeader}
${tableBody}
</table>\n`;

      // 5. 插入到編輯器中
      insertBlock(template);
    },
  },
];
</script>

<template>
  <div class="editor-layout">
    <header class="editor-header">
      <div class="header-left">
        <button class="btn-back" @click="router.back()">← 返回</button>
        <h2>{{ isEditMode ? "編輯文章" : "撰寫新文章" }}</h2>
      </div>
      <div class="header-right">
        <button class="btn-preview-page" @click="handlePreview">📑 預覽頁面</button>

        <button class="btn-save" @click="saveArticle" :disabled="loading">
          {{ loading ? "處理中..." : "💾 發佈文章" }}
        </button>
      </div>
    </header>

    <div class="editor-content">
      <section class="editor-card collapsed-group">
        <div class="card-title">基本資料設定</div>
        <div class="form-grid">
          <div class="form-group">
            <label>文章 ID</label>
            <input
              v-model="form.id"
              :disabled="isEditMode"
              class="input-field"
              placeholder="例如: 5-14文章標題"
            />
          </div>
          <div class="form-group">
            <label>文章分類</label>
            <div class="select-wrapper">
              <div class="color-dot" :style="{ backgroundColor: currentCategoryColor }"></div>

              <select v-model="form.category" class="input-field select-field">
                <option value="">（無分類）</option>

                <option v-for="cat in categories" :key="cat.name" :value="cat.name">
                  {{ cat.name }}
                </option>
              </select>
            </div>
          </div>
          <div class="form-group full-width">
            <label>主標題</label>
            <input v-model="form.title" class="input-field title-input" />
          </div>
          <div class="form-group full-width">
            <label>副標題</label>
            <input v-model="form.subtitle" class="input-field" />
          </div>
          <div class="form-group" style="width: 70%">
            <label>期數 / 標題</label>
            <div style="display: flex; gap: 10px">
              <input v-model="form.issue" type="number" class="input-field" style="width: 80px" />
              <input v-model="form.issue_title" class="input-field" style="flex: 1" />
            </div>
          </div>
          <div class="form-group" style="width: 130%; margin-left: -30%">
            <label>作者 / 職稱 / 備註</label>
            <div style="display: flex; gap: 10px">
              <input v-model="form.author" class="input-field" style="flex: 0.5" />
              <input v-model="form.author_title" class="input-field" style="flex: 1" />
              <input v-model="form.remark" class="input-field" style="flex: 1" />
            </div>
          </div>

          <div class="form-group full-width">
            <label>關鍵字</label>
            <input v-model="form.keyword" class="input-field" placeholder="**🌿 關鍵字**：..." />
          </div>

          <div class="form-group full-width">
            <label>文章簡介 (Summary)</label>
            <textarea
              v-model="form.summary"
              class="summary-textarea"
              placeholder="請輸入吸引人的文章摘要..."
            ></textarea>
          </div>

          <div class="form-group">
            <label>上一篇文章 ID (Prev)</label>
            <input
              v-model="form.prev_id"
              class="input-field"
              placeholder="輸入 ID 例如: 5-12權力..."
            />
          </div>
          <div class="form-group">
            <label>下一篇文章 ID (Next)</label>
            <input
              v-model="form.next_id"
              class="input-field"
              placeholder="輸入 ID 例如: 5-14未來..."
            />
          </div>
        </div>
      </section>

      <section class="editor-card full-editor-card">
        <div class="card-title-row">
          <span class="card-title-text">文章內文 (Markdown)</span>
          <button class="btn-preview-inline" @click="showPreview = !showPreview">
            {{ showPreview ? "👁️ 關閉預覽" : "👁️ 開啟預覽" }}
          </button>
        </div>

        <div class="toolbar">
          <div class="toolbar-group">
            <button v-for="tool in tools" :key="tool.label" @click="tool.action" class="tool-btn">
              {{ tool.label }}
            </button>
          </div>
          <div class="toolbar-divider"></div>
          <div class="toolbar-group">
            <span class="group-label">插入組件：</span>
            <button
              v-for="comp in components"
              :key="comp.label"
              @click="comp.action"
              class="tool-btn comp-btn"
            >
              {{ comp.label }}
            </button>
          </div>
        </div>

        <div class="editor-split-view" :class="{ 'preview-active': showPreview }">
          <div class="editor-pane">
            <textarea
              ref="textareaRef"
              v-model="form.content"
              class="markdown-textarea main-editor"
              placeholder="預設文章內容會自動縮排兩字..."
            ></textarea>
          </div>
          <div v-if="showPreview" class="preview-pane">
            <div class="preview-header">即時預覽</div>
            <div class="markdown-body" v-html="previewContent"></div>
          </div>
        </div>
      </section>

      <section class="editor-card">
        <div class="card-title">
          註釋管理
          <button @click="addFootnote" class="btn-mini-add">+ 新增</button>
        </div>
        <div class="footnotes-list">
          <div v-for="(note, index) in form.footnotes" :key="index" class="footnote-row">
            <span class="note-badge">{{ note.id }}</span>
            <input v-model="note.text" class="input-field note-input" />
            <button @click="removeFootnote(index)" class="btn-icon-del">✕</button>
          </div>
        </div>
      </section>

      <section class="editor-card collapsed-group">
        <div class="card-title">SEO 設定</div>
        <textarea v-model="seoJson" class="json-textarea"></textarea>
      </section>
    </div>
  </div>
</template>

<style scoped>
@import "@/assets/article.css";

input,
textarea,
select {
  box-sizing: border-box;
  max-width: 100%;
}

.editor-layout {
  background-color: #f4f6f8;
  min-height: 100vh;
  padding-bottom: 60px;
}

.editor-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
  border-bottom: 1px solid #ddd;
  padding: 10px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left h2 {
  font-size: 1.2rem;
  margin: 0;
  color: #333;
  margin-left: 15px;
}

.editor-content {
  max-width: 1400px;
  margin: 20px auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.editor-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 20px;
  border: 1px solid #eaeaea;
}

.card-title {
  font-size: 1.1rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 20px;
  border-left: 4px solid #007bff;
  padding-left: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-left: 4px solid #007bff;
  padding-left: 10px;
}
.card-title-text {
  font-size: 1.1rem;
  font-weight: bold;
  color: #2c3e50;
}
.btn-preview-inline {
  background-color: #f0f7ff;
  color: #007bff;
  border: 1px solid #cce5ff;
  padding: 5px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.btn-preview-inline:hover {
  background-color: #d6eaff;
}

.editor-split-view {
  display: flex;
  height: 700px;
  border: 1px solid #ddd;
  border-top: none;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  overflow: hidden;
}

.editor-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: none;
}

.preview-active .editor-pane {
  border-right: 2px solid #ccc;
}

.main-editor {
  width: 100%;
  height: 100%;
  padding: 20px;
  border: none;
  outline: none;
  resize: none;
  font-family: "Menlo", "Consolas", monospace;
  font-size: 15px;
  line-height: 1.6;
  background-color: #fff;
}

.preview-pane {
  flex: 1;
  background-color: #fff;
  overflow-y: auto;
  padding: 30px;
  position: relative;
}

.preview-header {
  position: absolute;
  top: 0;
  right: 0;
  background: #eee;
  padding: 5px 10px;
  font-size: 0.8rem;
  color: #666;
  border-bottom-left-radius: 5px;
}

.toolbar {
  background: #f8f9fa;
  border-bottom: 1px solid #ddd;
  padding: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}
.toolbar-group {
  display: flex;
  gap: 5px;
  align-items: center;
  flex-wrap: wrap;
}
.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #ccc;
  margin: 0 10px;
}
.group-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: bold;
}
.tool-btn {
  background: white;
  border: 1px solid #ccc;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.tool-btn:hover {
  background: #e2e6ea;
  border-color: #adb5bd;
}
.comp-btn {
  color: #0056b3;
  background: #f0f7ff;
  border-color: #cce5ff;
}
.comp-btn:hover {
  background: #d6eaff;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}
.full-width {
  grid-column: 1 / -1;
}
.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: bold;
  color: #555;
  margin-bottom: 5px;
}
.input-field {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.title-input {
  font-size: 1.1rem;
  font-weight: bold;
}

.select-wrapper {
  position: relative;
}
.select-field {
  padding-left: 35px;
}
.color-dot {
  position: absolute;
  left: 10px;
  top: 10px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
}

.json-textarea {
  width: 100%;
  min-height: 300px;
  padding: 15px;
  background-color: #0f172a;
  color: #e2e8f0;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.9rem;
  border: 1px solid #1e293b;
}

.summary-textarea {
  width: 100%;
  min-height: 100px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
  background-color: #fafafa;
}
.summary-textarea:focus {
  outline: none;
  border-color: #007bff;
  background-color: white;
}

.btn-save {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
}
.btn-save:hover {
  background: #218838;
}
.btn-save:disabled {
  background: #ccc;
}

/* 【新增】預覽按鈕樣式 */
.btn-preview-page {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  margin-right: 15px;
}
.btn-preview-page:hover {
  background: #138496;
}

.btn-back {
  border: 1px solid #ccc;
  background: transparent;
  padding: 5px 15px;
  border-radius: 15px;
  cursor: pointer;
}
.btn-back:hover {
  background: #f0f0f0;
  color: #333;
}
.footnotes-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.footnote-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.note-badge {
  background: #eee;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
}
.btn-mini-add {
  background: #e7f1ff;
  border: none;
  color: #007bff;
  padding: 5px 10px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 0.8rem;
  margin-left: 10px;
}
.btn-icon-del {
  border: none;
  background: none;
  color: #ccc;
  cursor: pointer;
}
.btn-icon-del:hover {
  color: red;
}

@media (max-width: 1024px) {
  .editor-split-view {
    flex-direction: column;
    height: auto;
  }
  .editor-pane {
    height: 500px;
    border-right: none;
    border-bottom: 1px solid #ddd;
  }
  .preview-pane {
    height: 500px;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
