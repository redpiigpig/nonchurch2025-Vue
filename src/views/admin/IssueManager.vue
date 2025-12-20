<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../../supabase";

const issuesStatus = ref([]);
const loading = ref(false);

// 1. 掃描目前所有期數的狀態
const fetchIssuesStatus = async () => {
  loading.value = true;
  // 抓出所有文章的期數與發布狀態
  const { data, error } = await supabase
    .from("articles")
    .select("issue, is_published, issue_title")
    .order("issue", { ascending: false });

  if (error) {
    alert("讀取失敗");
    return;
  }

  // 2. 整理數據：按期數分組，統計該期是否已發布
  const map = {};
  data.forEach((row) => {
    if (!map[row.issue]) {
      map[row.issue] = {
        issue: row.issue,
        title: row.issue_title || `第 ${row.issue} 期`,
        totalCount: 0,
        publishedCount: 0,
      };
    }
    map[row.issue].totalCount++;
    if (row.is_published) {
      map[row.issue].publishedCount++;
    }
  });

  // 轉換為陣列
  issuesStatus.value = Object.values(map).sort((a, b) => b.issue - a.issue);
  loading.value = false;
};

// 3. 一鍵發布/下架功能
const togglePublish = async (issueNum, targetStatus) => {
  const actionName = targetStatus ? "發布" : "下架";
  if (!confirm(`確定要「${actionName}」第 ${issueNum} 期所有文章嗎？`)) return;

  loading.value = true;

  // 更新該期所有文章的狀態
  const { error } = await supabase
    .from("articles")
    .update({ is_published: targetStatus })
    .eq("issue", issueNum);

  if (error) {
    alert(`${actionName}失敗：` + error.message);
  } else {
    alert(`第 ${issueNum} 期已${actionName}！`);
    fetchIssuesStatus(); // 重新整理列表
  }
  loading.value = false;
};

onMounted(() => {
  fetchIssuesStatus();
});
</script>

<template>
  <div class="issue-manager">
    <h2>📅 期刊發布中心</h2>
    <p class="desc">
      這裡控制前台是否能看到該期文章。
      <br />您可以在「寫新文章」慢慢累積第 7 期的草稿，等到準備好後，在這裡按「一鍵發布」。
    </p>

    <div v-if="loading" class="loading">處理中...</div>

    <div class="issue-grid">
      <div v-for="item in issuesStatus" :key="item.issue" class="issue-card">
        <div class="card-header">
          <span class="vol">Vol.{{ item.issue }}</span>
          <span
            class="status-badge"
            :class="item.publishedCount === item.totalCount ? 'published' : 'draft'"
          >
            {{ item.publishedCount === item.totalCount ? "已發布" : "草稿 / 部分發布" }}
          </span>
        </div>

        <h3>{{ item.title }}</h3>

        <p class="stats">文章數：{{ item.publishedCount }} / {{ item.totalCount }} (已公開)</p>

        <div class="actions">
          <button
            v-if="item.publishedCount < item.totalCount"
            @click="togglePublish(item.issue, true)"
            class="btn-publish"
          >
            🚀 一鍵發布 (上架)
          </button>

          <button v-else @click="togglePublish(item.issue, false)" class="btn-unpublish">
            🔒 全部轉草稿 (下架)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.issue-manager {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}
.desc {
  color: #666;
  margin-bottom: 30px;
  line-height: 1.6;
}
.issue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.issue-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border: 1px solid #eee;
  display: flex;
  flex-direction: column;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.vol {
  font-weight: bold;
  color: #888;
}
.status-badge {
  font-size: 0.8rem;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: bold;
}
.status-badge.published {
  background: #d4edda;
  color: #155724;
}
.status-badge.draft {
  background: #fff3cd;
  color: #856404;
}
h3 {
  margin: 0 0 10px 0;
  font-size: 1.2rem;
  color: #333;
}
.stats {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 20px;
}
.actions {
  margin-top: auto;
}
.btn-publish {
  width: 100%;
  padding: 10px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: 0.2s;
}
.btn-publish:hover {
  background: #218838;
}

.btn-unpublish {
  width: 100%;
  padding: 10px;
  background: #f8f9fa;
  color: #dc3545;
  border: 1px solid #dc3545;
  border-radius: 5px;
  cursor: pointer;
  transition: 0.2s;
}
.btn-unpublish:hover {
  background: #ffebeb;
}
</style>
