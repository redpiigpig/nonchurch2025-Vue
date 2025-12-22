<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { supabase } from "../../supabase";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute(); // ⭐ 1. 引入 useRoute 來讀取網址參數
const loading = ref(false);

// 資料狀態
const issuesOptions = ref([]);
const allArticles = ref([]);
const selectedIssueId = ref(null);

const initData = async () => {
  loading.value = true;
  try {
    // A. 抓取期數
    const { data: issuesData, error: issuesError } = await supabase
      .from("issues")
      .select("id, title")
      .order("id", { ascending: false });

    if (issuesError) throw issuesError;
    issuesOptions.value = issuesData;

    // ⭐ 2. 智慧預設值邏輯
    // 先看網址上有沒有 ?issue=xx
    const queryIssueId = parseInt(route.query.issue);
    // 檢查這個 ID 是否有效 (真的存在於期數列表中)
    const isValidId = issuesOptions.value.some((i) => i.id === queryIssueId);

    if (isValidId) {
      // 如果網址有參數且有效，就用它 (保持狀態)
      selectedIssueId.value = queryIssueId;
    } else if (issuesOptions.value.length > 0) {
      // 否則預設選最新一期
      selectedIssueId.value = issuesOptions.value[0].id;
    }

    // B. 抓取所有文章
    const { data: articlesData, error: articlesError } = await supabase
      .from("articles")
      .select("id, issue, title, subtitle, author, keyword, summary, seo")
      .order("id", { ascending: true });

    if (articlesError) throw articlesError;

    allArticles.value = articlesData.map((article) => {
      let seoImage = "";
      if (article.seo && typeof article.seo === "object") {
        seoImage = article.seo.image || "";
      }
      return {
        ...article,
        seo_image: seoImage,
        isSaving: false,
      };
    });
  } catch (err) {
    alert("讀取資料失敗：" + err.message);
  } finally {
    loading.value = false;
  }
};

// ⭐ 3. 監聽選擇改變，同步更新網址
// 這樣當你選了第 5 期，網址會變 ...?issue=5，重新整理或返回時就不會跑掉
watch(selectedIssueId, (newVal) => {
  if (newVal) {
    router.replace({ query: { ...route.query, issue: newVal } });
  }
});

const filteredArticles = computed(() => {
  if (!selectedIssueId.value) return [];

  const list = allArticles.value.filter((a) => a.issue === selectedIssueId.value);

  return list.sort((a, b) => {
    const getOrder = (idStr) => {
      const match = idStr.match(/-(\d+)/);
      return match ? parseInt(match[1]) : 999;
    };
    return getOrder(a.id) - getOrder(b.id);
  });
});

const cleanId = (idStr) => {
  if (!idStr) return "";
  const match = idStr.match(/^\d+-\d+/);
  return match ? match[0] : idStr;
};

const saveRow = async (article) => {
  article.isSaving = true;
  try {
    const originalSeo = article.seo || {};
    const updatedSeo = {
      ...originalSeo,
      image: article.seo_image,
    };

    const updates = {
      title: article.title,
      subtitle: article.subtitle,
      author: article.author,
      keyword: article.keyword,
      summary: article.summary,
      seo: updatedSeo,
    };

    const { error } = await supabase.from("articles").update(updates).eq("id", article.id);

    if (error) throw error;
    alert(`ID: ${cleanId(article.id)} 更新成功！✅`);
  } catch (err) {
    alert("儲存失敗：" + err.message);
  } finally {
    article.isSaving = false;
  }
};

const goToEditor = (id) => {
  router.push(`/admin/editor/${id}`);
};

onMounted(() => {
  initData();
});
</script>

<template>
  <div class="articles-manager">
    <div class="header">
      <h2>📚 文章列表管理</h2>
      <p class="desc">
        快速批次修正文章標題、摘要與 SEO 設定。<br />
        點擊 ID 或「✏️」可進入完整編輯器。
      </p>
    </div>

    <div class="toolbar">
      <label for="issue-select">選擇期數：</label>
      <div class="select-wrapper">
        <select id="issue-select" v-model="selectedIssueId">
          <option v-for="issue in issuesOptions" :key="issue.id" :value="issue.id">
            Vol.{{ issue.id }} - {{ issue.title }}
          </option>
        </select>
      </div>
      <span class="count-badge" v-if="selectedIssueId">
        共 {{ filteredArticles.length }} 篇文章
      </span>
    </div>

    <div v-if="loading" class="loading">載入中...</div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th width="80">ID</th>
            <th width="150">主標題</th>
            <th width="150">副標題</th>
            <th width="100">作者</th>
            <th width="120">關鍵字</th>
            <th width="250">文章摘要 (Summary)</th>
            <th width="200">SEO 縮圖連結</th>
            <th width="100">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="article in filteredArticles" :key="article.id">
            <td
              class="text-center read-only-id"
              @click="goToEditor(article.id)"
              title="點擊進入編輯器"
            >
              {{ cleanId(article.id) }}
            </td>

            <td>
              <input type="text" v-model="article.title" class="table-input" />
            </td>
            <td>
              <input type="text" v-model="article.subtitle" class="table-input" />
            </td>
            <td>
              <input type="text" v-model="article.author" class="table-input" />
            </td>
            <td>
              <input type="text" v-model="article.keyword" class="table-input" />
            </td>
            <td>
              <textarea v-model="article.summary" class="table-textarea" rows="2"></textarea>
            </td>
            <td>
              <input
                type="text"
                v-model="article.seo_image"
                class="table-input"
                placeholder="https://..."
              />
              <div v-if="article.seo_image" class="mini-preview">
                <img :src="article.seo_image" alt="preview" />
              </div>
            </td>

            <td class="actions-cell">
              <div class="action-buttons">
                <button
                  class="btn-save"
                  @click="saveRow(article)"
                  :disabled="article.isSaving"
                  title="儲存此列"
                >
                  {{ article.isSaving ? "..." : "💾" }}
                </button>
                <button class="btn-edit" @click="goToEditor(article.id)" title="編輯內文">
                  ✏️
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="filteredArticles.length === 0">
            <td colspan="8" class="empty-state">本期尚無文章，請前往「新增文章」開始撰寫。</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.articles-manager {
  padding: 20px;
  max-width: 100%;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}
.header h2 {
  color: #2c3e50;
  margin-bottom: 5px;
}
.desc {
  color: #666;
  font-size: 0.95rem;
  margin: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #eee;
}

.select-wrapper select {
  padding: 8px 12px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  min-width: 250px;
  cursor: pointer;
  background-color: white;
}

.count-badge {
  background-color: #e9ecef;
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 0.9rem;
  color: #555;
  font-weight: bold;
}

.loading {
  text-align: center;
  font-size: 1.2rem;
  color: #666;
  margin: 40px;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #eee;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  min-width: 1200px;
}

.data-table th,
.data-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #eee;
  vertical-align: top;
  text-align: left;
}

.data-table th {
  background-color: #f1f3f5;
  font-weight: bold;
  color: #495057;
  white-space: nowrap;
  position: sticky;
  top: 0;
}

.text-center {
  text-align: center;
}

.table-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: border 0.2s;
}
.table-input:focus {
  border-color: #3498db;
  outline: none;
}

.table-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  resize: vertical;
  min-height: 60px;
}

.read-only-id {
  font-family: monospace;
  font-size: 1.1rem;
  color: #007bff;
  cursor: pointer;
  font-weight: bold;
}
.read-only-id:hover {
  text-decoration: underline;
  background-color: #f0f7ff;
}

.mini-preview {
  margin-top: 5px;
}
.mini-preview img {
  height: 40px;
  border-radius: 4px;
  border: 1px solid #ddd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.actions-cell {
  vertical-align: middle;
}
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-save,
.btn-edit {
  border: none;
  border-radius: 4px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: transform 0.1s;
}

.btn-save {
  background-color: #28a745;
  color: white;
}
.btn-save:hover {
  background-color: #218838;
}
.btn-save:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-edit {
  background-color: #17a2b8;
  color: white;
}
.btn-edit:hover {
  background-color: #138496;
}

.btn-save:active,
.btn-edit:active {
  transform: scale(0.95);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
  font-style: italic;
}
</style>
