<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../../supabase";

const router = useRouter();
const articles = ref([]);
const loading = ref(false);

const fetchArticles = async () => {
  loading.value = true;
  // 關聯查詢：順便把 issues 的 title 抓出來顯示
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, status, updated_at, issues(title, issue_number)")
    .order("updated_at", { ascending: false });

  if (!error) articles.value = data;
  loading.value = false;
};

// 跳轉到編輯頁
const editArticle = (id) => {
  router.push(`/admin/editor/${id}`);
};

// 跳轉到新增頁
const createArticle = () => {
  router.push(`/admin/editor`); // 不帶 ID 就是新增
};

onMounted(fetchArticles);
</script>

<template>
  <div class="manager-container">
    <div class="header-row">
      <h1>文章管理</h1>
      <button @click="createArticle" class="btn-add">＋ 新增文章</button>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>狀態</th>
          <th>標題</th>
          <th>所屬期數</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="article in articles" :key="article.id">
          <td>
            <span :class="['status-dot', article.status]"></span>
            {{ article.status === "published" ? "公開" : "草稿" }}
          </td>
          <td>{{ article.title }}</td>
          <td>
            <span v-if="article.issues"
              >Vol.{{ article.issues.issue_number }} {{ article.issues.title }}</span
            >
            <span v-else class="text-gray">未分類</span>
          </td>
          <td>
            <button @click="editArticle(article.id)">編輯</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* 簡單樣式示意 */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.btn-add {
  background: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
}
.data-table {
  width: 100%;
  background: white;
  border-collapse: collapse;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
th,
td {
  padding: 15px;
  border-bottom: 1px solid #eee;
  text-align: left;
}
.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 5px;
}
.status-dot.published {
  background: #4caf50;
}
.status-dot.draft {
  background: #999;
}
</style>
