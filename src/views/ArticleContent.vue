<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { marked } from "marked";
import markedFootnote from "marked-footnote";
import { supabase } from "../supabase";

// 【修改】設定 prefixId，確保我們手動產生的連結 ID 能對應到 marked 產生的列表
marked.use(markedFootnote({ prefixId: "footnote-" }));

const route = useRoute();
const article = ref(null);
const loading = ref(true);

const fetchArticleData = async (articleId) => {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", articleId)
      .single();

    if (error) throw error;

    return {
      ...data,
      authorTitle: data.author_title,
      issueTitle: data.issue_title,
      prev: data.prev_article,
      next: data.next_article,
      footnotes: data.footnotes || [],
    };
  } catch (error) {
    console.error(`載入文章 ${articleId} 失敗:`, error.message);
    return null;
  }
};

const updateMetaTags = (seoData, article) => {
  if (!seoData) return;
  document.querySelectorAll("meta[data-seo]").forEach((el) => el.remove());

  const addMeta = (name, content, isProperty = false) => {
    if (!content) return;
    const meta = document.createElement("meta");
    meta.setAttribute(isProperty ? "property" : "name", name);
    meta.setAttribute("content", content);
    meta.setAttribute("data-seo", "true");
    document.head.appendChild(meta);
  };

  addMeta("description", seoData.description);
  addMeta("keywords", seoData.keywords);
  addMeta("author", article.author);
  addMeta("robots", seoData.robots);
  addMeta("google-site-verification", seoData.googleVerification);

  const og = seoData.og;
  if (og) {
    addMeta("og:title", og.title, true);
    addMeta("og:description", og.description, true);
    addMeta("og:image", og.image, true);
    addMeta("og:url", og.url, true);
    addMeta("og:type", og.type, true);
    addMeta("og:site_name", og.site_name, true);
    addMeta("og:locale", og.locale, true);
  }
};

watch(
  () => route.params.id, // 監聽 article ID 參數
  async (newId, oldId) => {
    // 確保 ID 存在且確實發生變化
    if (newId && newId !== oldId) {
      loading.value = true;

      // 重新呼叫載入文章函數
      const fetchedArticle = await fetchArticleData(newId);

      if (fetchedArticle) {
        article.value = fetchedArticle;
        updateMetaTags(article.value.seo, article.value);

        // 手動更新網頁標題
        const number = article.value.id.replace(article.value.title, "");
        document.title = `${number} ${article.value.title} - 無境界者雜誌`;
      }
      loading.value = false;
    }
  }
);

onMounted(async () => {
  loading.value = true;

  // 預覽模式檢查
  if (route.name === "article-preview") {
    const localData = localStorage.getItem("preview_article");
    if (localData) {
      article.value = JSON.parse(localData);
      document.title = `[預覽] ${article.value.title}`;
      loading.value = false;
      return;
    }
  }

  const articleId = route.params.id;
  const fetchPromise = fetchArticleData(articleId);
  const delayPromise = new Promise((resolve) => setTimeout(resolve, 2000));

  const [fetchedArticle] = await Promise.all([fetchPromise, delayPromise]);

  if (fetchedArticle) {
    article.value = fetchedArticle;
    updateMetaTags(article.value.seo, article.value);

    const number = article.value.id.replace(article.value.title, "");
    document.title = `${number} ${article.value.title} - 無境界者雜誌`;
  } else {
    document.title = "找不到文章 - 無境界者雜誌";
  }

  loading.value = false;
});

// 【新增】輔助函式：處理標題或備註中的 [^1] 格式
const formatTextWithFootnote = (text) => {
  if (!text) return "";
  // 將 [^數字] 替換為指向底部註釋的 HTML 連結
  return text.replace(/\[\^(\d+)\]/g, (match, id) => {
    return `<sup class="footnote-ref"><a href="#footnote-${id}" id="footnote-ref-${id}">${id}</a></sup>`;
  });
};

const htmlContent = computed(() => {
  if (!article.value || !article.value.content) return "";

  // 1. 取得原始內文
  let fullText = article.value.content;

  // 2. 【關鍵步驟】全域替換：在解析 Markdown 之前，先把內文所有的 [^數字] 轉成 HTML 連結
  // 這樣無論是在 <div class="book-box"> 還是 <table> 裡面，都能正確變身
  fullText = fullText.replace(/\[\^(\d+)\]/g, (match, id) => {
    return `<sup class="footnote-ref"><a href="#footnote-${id}" id="footnote-ref-${id}">${id}</a></sup>`;
  });

  // 3. 解析 Markdown (這時候 marked 看到的是已經變成 <sup...> 的 HTML，會直接保留它)
  let parsedHtml = marked.parse(fullText, {
    gfm: true,
    breaks: true,
  });

  // 4. 【手動生成頁尾】
  // 因為我們繞過了 marked-footnote，所以要自己把資料庫裡的 footnotes 陣列拼成 HTML 列表
  // 這樣能確保 CSS 樣式 (.footnotes ol li) 依然生效
  if (article.value.footnotes && article.value.footnotes.length > 0) {
    const listItems = article.value.footnotes
      .map((note) => {
        // 加上返回箭頭 ↩
        return `<li id="footnote-${note.id}">
          <p>
            ${note.text}
            <a href="#footnote-ref-${note.id}" class="footnote-backref">↩</a>
          </p>
        </li>`;
      })
      .join("");

    // 拼接到文章最後面
    parsedHtml += `
      <div class="footnotes">
        <hr />
        <ol>${listItems}</ol>
      </div>
    `;
  }

  return parsedHtml;
});

const keywordContent = computed(() => {
  if (!article.value || !article.value.keyword) return "";
  return marked.parse(article.value.keyword);
});

const categoryColor = computed(() => {
  if (!article.value || !article.value.category) return "#ff8000";

  const colorMap = {
    專題文章: "#8b0000",
    評論與回應: "#ff8000",
    人物專訪: "#f0e137",
    生命故事: "#46b175",
    時事感想: "#4682b4",
    文藝創作: "#27408b",
    公告與剪影: "#6a5acd",
    主題文章: "#7d6c29",
    光影時刻: "#7d6c29",
    實驗園地: "#db7093",
  };

  return colorMap[article.value.category] || "#ff8000";
});
</script>

<template>
  <div class="article-page">
    <div v-if="loading" class="loading-state">
      正在載入文章內容 🕊️<span class="loading-dots"></span>
    </div>

    <div v-else-if="!article" class="not-found">
      <h2>找不到這篇文章😖</h2>
      <RouterLink to="/articles" class="back-link">回文章列表</RouterLink>
    </div>

    <article v-else class="article-content">
      <div class="title-header">
        <div
          v-if="article.category"
          class="featured-box"
          :style="{ backgroundColor: categoryColor }"
        >
          {{ article.category }}
        </div>

        <h1 class="main-title" v-html="formatTextWithFootnote(article.title)"></h1>
        <h1
          v-if="article.subtitle"
          class="sub-title"
          v-html="formatTextWithFootnote(article.subtitle)"
        ></h1>
      </div>

      <div class="divider-thick"></div>
      <div class="divider-gap"></div>
      <div class="divider-thin"></div>

      <div class="author-info">
        <p class="author-name">
          <span v-html="formatTextWithFootnote(article.author)"></span>

          <span class="author-title" v-html="formatTextWithFootnote(article.authorTitle)"></span>

          <span
            v-if="article.remark"
            class="author-remark"
            v-html="formatTextWithFootnote(article.remark)"
          ></span>
        </p>
      </div>

      <div v-if="article.keyword" class="keyword-section" v-html="keywordContent"></div>
      <br />
      <div class="markdown-body" v-html="htmlContent"></div>

      <div class="article-navigation">
        <div class="nav-item">
          <template v-if="article.prev">
            <strong>閱讀上一篇文章</strong>
            <RouterLink v-if="article.prev.id" :to="`/articles/${article.prev.id}`">
              {{ article.prev.title }}
            </RouterLink>
            <span v-else>{{ article.prev.title }}</span>
          </template>
        </div>

        <div class="nav-item">
          <strong>回到本期雜誌目錄</strong>
          <RouterLink to="/articles">
            第{{ article.issue }}期：{{ article.issueTitle }}
          </RouterLink>
        </div>

        <div class="nav-item">
          <template v-if="article.next">
            <strong>閱讀下一篇文章</strong>
            <RouterLink v-if="article.next.id" :to="`/articles/${article.next.id}`">
              {{ article.next.title }}
            </RouterLink>
            <span v-else>{{ article.next.title }}</span>
          </template>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
/* 1. 頁面大容器 (半透明白底) */
.article-page {
  max-width: 100%;
  margin: 50px auto;
  padding: 50px 60px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  min-height: 600px;
}

/* 2. 標題與標籤區 */
.title-header {
  position: relative;
  margin-bottom: 20px;
}

.featured-box {
  position: absolute;
  right: 0;
  color: white;
  font-weight: bold;
  font-size: 1.6rem;
  border-radius: 4px;
  padding: 5px 15px;
  margin-top: -3rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.main-title {
  font-family: "Times New Roman", serif;
  font-size: 2.5rem;
  font-weight: bold;
  color: #444;
  text-align: left;
  margin-top: 40px;
  line-height: 1.4;
  padding-left: 2rem;
}

.sub-title {
  font-family: "Times New Roman", serif;
  font-size: 2rem;
  font-weight: bold;
  color: #444;
  margin-top: 10px;
  text-align: left;
  padding-left: 6rem;
}

/* 3. 分隔線 */
.divider-thick {
  height: 3px;
  background: #444;
  width: 100%;
}
.divider-gap {
  height: 3px;
}
.divider-thin {
  height: 1px;
  background: #444;
  width: 100%;
  margin-bottom: 20px;
}

/* 4. 作者資訊 */
.author-info {
  text-align: right;
  margin-bottom: 40px;
  font-family: "Times New Roman", serif;
}
.author-name {
  font-size: 1.2rem;
  color: #444;
}
.author-title {
  display: block;
  font-size: 1.2rem;
  color: #444;
  margin-top: 4px;
}
.author-remark {
  display: block;
  font-size: 1.2rem;
  color: #444;
  margin-top: 10px;
}

/* 5. 找不到文章 */
.not-found {
  text-align: center;
  padding: 60px;
  color: #666;
}
.back-link {
  display: inline-block;
  margin-top: 20px;
  color: #007bff;
  text-decoration: none;
  border-bottom: 1px solid transparent;
}
.back-link:hover {
  border-bottom-color: #007bff;
}

/* 6. 文章導航區塊 */
.article-navigation {
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  margin-top: 3rem;
  padding: 20px 0;
  border-top: 1px solid #ddd;
  text-align: center;
  gap: 1.5rem;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 60px;
}

.nav-item strong {
  display: block;
  margin-bottom: 8px;
  color: #444;
  font-size: 1.2rem;
}

.nav-item a {
  text-decoration: none;
  color: #007bff;
  font-size: 1.2rem;
  font-family: "Times New Roman", serif;
  max-width: 20ch;
  word-wrap: break-word;
  text-align: center;
  line-height: 1.4;
}

.nav-item a:hover {
  text-decoration: underline;
  color: #0056b3;
}

/* 7. 載入狀態 */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  font-size: 2.5rem;
  color: #888;
  font-family: "Times New Roman", serif;
  font-weight: bold;
}

.loading-dots::after {
  content: "";
  animation: dots-cycle 2s infinite steps(1);
}

@keyframes dots-cycle {
  0% {
    content: "";
  }
  15% {
    content: ".";
  }
  30% {
    content: "..";
  }
  45% {
    content: "...";
  }
  60% {
    content: "....";
  }
  75% {
    content: ".....";
  }
  90% {
    content: "......";
  }
}

/* 8. 註釋樣式修正 */
:deep(.footnotes) {
  margin-top: 60px;
  padding-top: 20px;
  border-top: 2px solid #444;
  font-size: 1rem;
  color: #666;
}

/* 隱藏 marked 產生的標題與分隔線（如果有） */
:deep(.footnotes h2),
:deep(.footnotes hr) {
  display: none;
}

:deep(.footnotes ol) {
  padding-left: 0;
  margin-left: -1rem; /* 修正偏移 */
  list-style: none;
  counter-reset: footnote-counter;
}

:deep(.footnotes li) {
  /* 【調整】將對齊方式改為 flex，讓文字和數字更容易垂直對齊 */
  display: flex; /* 新增此行 */
  align-items: baseline; /* 調整此行：讓文字的基線對齊 */
  position: relative;
  margin-bottom: 0px; /* 增加一點點間距 */
  padding-left: 0; /* 移除 padding-left，因為 flex 結構不再需要 */
  counter-increment: footnote-counter;
  line-height: 1.6; /* 增加行高讓多行文字易讀 */
}

:deep(.footnotes li::before) {
  content: counter(footnote-counter);
  display: inline-block;
  width: 2em;
  flex-shrink: 0;
  text-align: right;

  color: #007bff;
  font-family: "Times New Roman", serif;
  position: static;
  cursor: pointer;
}

:deep(.footnotes li::before:hover) {
  color: #0056b3;
  font-weight: bold;
  text-decoration: underline;
}

/* 針對 marked 產生的 p 標籤去除 margin，避免跑版 */
:deep(.footnotes li p) {
  margin: 0;
  text-indent: 0 !important;
  flex-grow: 1;
  padding-left: 10px; /* 數字和文字間距 */

  font-family: "Times New Roman", serif;
  color: #444;
  text-align: justify;
}
/* 針對 marked-footnote 產生的返回箭頭 ↩ */
:deep(.footnotes .footnote-backref) {
  text-decoration: none;
  border: none;
  color: #007bff;
  margin-left: 5px;
  font-family: sans-serif; /* 讓符號顯示正常 */
}

:deep(.footnotes .footnote-backref:hover) {
  color: #0056b3;
}

/* RWD */
@media (max-width: 768px) {
  .article-page {
    padding: 20px;
  }
  .featured-box {
    position: relative;
    display: inline-block;
    float: right;
    margin: 0 0 20px auto;
    font-size: 1.2rem;
  }
  .main-title {
    font-size: 2.5rem;
    clear: both;
    padding-left: 0;
  }
  .sub-title {
    font-size: 2rem;
    padding-left: 0;
  }
  .article-navigation {
    flex-direction: column;
    gap: 2rem;
  }
  .nav-item {
    width: 100%;
    border-bottom: 1px solid #eee;
    padding-bottom: 15px;
  }
  .nav-item:last-child {
    border-bottom: none;
  }
  .loading-state {
    text-align: center;
    padding: 60px;
    font-size: 1.5rem;
    color: #444;
  }
}
</style>
