<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "../supabase";
import MainLayout from "../components/MainLayout.vue";

const route = useRoute();
const router = useRouter();

const results = ref([]);
const loading = ref(false);
const inputQuery = ref("");
const inputType = ref("title");
const currentKeyword = ref("");
const currentField = ref("title");

const fieldLabels = {
  title: "文章標題",
  author: "作者",
  content: "文章全文",
  keyword: "關鍵字",
};

const handleSearch = () => {
  if (!inputQuery.value.trim()) return;
  router.push({
    name: "search",
    query: {
      q: inputQuery.value,
      type: inputType.value,
    },
  });
};

const fetchResults = async () => {
  const q = route.query.q || "";
  const type = route.query.type || "title";

  inputQuery.value = q;
  inputType.value = type;
  currentKeyword.value = q;
  currentField.value = type;

  if (!q) {
    results.value = [];
    return;
  }

  loading.value = true;
  try {
    const { data, error } = await supabase.rpc("search_articles", {
      search_text: q,
      field: type,
    });

    if (error) throw error;
    results.value = data;
  } catch (err) {
    console.error("搜尋錯誤", err);
  } finally {
    loading.value = false;
  }
};

const highlightFull = (content, searchTerm) => {
  if (!content) return "";
  if (!searchTerm) return content;
  const regex = new RegExp(`(${searchTerm})`, "gi");
  return content.replace(regex, '<span class="highlight-text">$1</span>');
};

const highlightSnippet = (content, searchTerm) => {
  if (!content) return "";
  let plainText = content
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!searchTerm) return plainText.substring(0, 300) + "...";

  const lowerContent = plainText.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();
  const index = lowerContent.indexOf(lowerTerm);

  if (index === -1) return plainText.substring(0, 250) + "...";

  const start = Math.max(0, index - 150);
  const end = Math.min(plainText.length, index + searchTerm.length + 150);
  let snippet = plainText.substring(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < plainText.length) snippet = snippet + "...";

  const regex = new RegExp(`(${searchTerm})`, "gi");
  return snippet.replace(regex, '<span class="highlight-text">$1</span>');
};

watch(() => route.query, fetchResults);
onMounted(() => {
  fetchResults();
});
</script>

<template>
  <MainLayout>
    <div class="search-page-container">
      <div class="search-header-section">
        <div class="search-box">
          <select v-model="inputType" class="search-select">
            <option value="title">搜尋文章標題</option>
            <option value="author">搜尋作者</option>
            <option value="content">搜尋文章全文</option>
            <option value="keyword">搜尋關鍵字</option>
          </select>

          <input
            v-model="inputQuery"
            @keyup.enter="handleSearch"
            type="text"
            placeholder="輸入關鍵字..."
            class="search-input"
          />

          <button @click="handleSearch" class="btn">搜尋</button>
        </div>
      </div>

      <hr class="divider" />

      <div class="result-status">
        <h2 v-if="currentKeyword">
          用 <span class="query-tag">「{{ currentKeyword }}」</span> 搜尋{{
            fieldLabels[currentField]
          }}的結果
          <span class="count-tag">{{ results.length }} 筆</span>
        </h2>
        <h2 v-else>請輸入關鍵字進行搜尋</h2>
      </div>

      <div v-if="loading" class="loading-state">搜尋中🕊️...</div>

      <div v-else-if="results.length === 0 && currentKeyword" class="no-result">
        找不到相關內容，請嘗試其他關鍵字。
      </div>

      <div v-else class="results-list">
        <div
          v-for="article in results"
          :key="article.id"
          class="result-card"
          title="點擊觀看文章全文"
        >
          <router-link :to="`/articles/${article.id}`" class="card-link">
            <div class="meta-info">第{{ article.issue }}期：{{ article.issue_title }}</div>

            <div class="title-row">
              <h3 class="article-title-group">
                <span v-html="highlightFull(article.title, currentKeyword)"></span>
                <span v-if="article.subtitle" class="title-separator"></span>
                <span
                  v-if="article.subtitle"
                  class="article-subtitle"
                  v-html="highlightFull(article.subtitle, currentKeyword)"
                ></span>
              </h3>

              <div class="article-author">
                作者：<span v-html="highlightFull(article.author, currentKeyword)"></span>
              </div>
            </div>

            <div
              class="article-snippet"
              v-html="highlightSnippet(article.content, currentKeyword)"
            ></div>
          </router-link>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<style>
.highlight-text {
  color: #003366;
  font-weight: bold;
  background-color: rgba(255, 255, 0, 0.2);
  padding: 0 1px;
}
</style>

<style scoped>
.search-page-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 0 20px;
}
.search-header-section {
  text-align: center;
  margin-bottom: 20px;
}

/* ... 搜尋框樣式 ... */
.search-box {
  display: inline-flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.search-select,
.search-input,
.btn {
  height: 38px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 1rem;
}
.search-input {
  width: 250px;
  padding: 0 10px;
  font-family: "Times New Roman", serif;
}
.btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0 20px;
  cursor: pointer;
}
.btn:hover {
  background-color: #218838;
}
.divider {
  border: 0;
  height: 1px;
  background: #eee;
  margin: 20px 0;
}
.result-status h2 {
  font-size: 1.2rem;
  color: #555;
  margin-bottom: 20px;
}
.query-tag {
  color: #007bff;
  font-weight: bold;
}
.count-tag {
  margin-left: 10px;
  font-size: 0.9rem;
  background: #eee;
  padding: 2px 8px;
  border-radius: 10px;
  color: #666;
}
.loading-state,
.no-result {
  text-align: center;
  padding: 40px;
  color: #888;
  font-size: 2.5rem;
  font-weight: bold;
}
.result-card {
  background: white;
  margin-bottom: 20px;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #eee;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
  cursor: pointer;
}
.result-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  border-color: #28a745;
}
.card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}
.meta-info {
  font-size: 0.85rem;
  color: #aaa;
  margin-bottom: 5px;
}
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 15px;
  margin-bottom: 5px;
}
.article-title-group {
  font-size: 1.4rem;
  color: #007bff;
  margin: 0;
  font-family: "Times New Roman", serif;
  line-height: 1.4;
  flex-grow: 1;
}
.article-subtitle {
  color: #007bff;
  font-weight: bold;
  font-size: 1.2rem;
}
.title-separator {
  margin: 0 5px;
  color: #ccc;
}
.article-author {
  font-size: 0.95rem;
  color: #555;
  font-family: "Times New Roman", serif;
  white-space: nowrap;
  flex-shrink: 0;
}
.article-snippet {
  font-size: 1rem;
  color: #333;
  line-height: 1.6;
  font-family: "Times New Roman", serif;
  border-left: 3px solid #eee;
  padding-left: 10px;
  margin-top: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
@media (max-width: 768px) {
  .search-input {
    width: 100%;
  }
  .search-select {
    width: 100%;
  }
  .btn {
    width: 100%;
  }
  .title-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  .article-author {
    font-size: 0.9rem;
    color: #888;
  }
}
</style>
