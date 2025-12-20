<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "../supabase";
import { useEditorMode } from "../composables/useEditorMode";
import MainLayout from "../components/MainLayout.vue";

const { isEditor } = useEditorMode();

const selectedYear = ref(2025);
const yearOptions = [
  { value: 2026, label: "2026 年 (第 7-12 期)" },
  { value: 2025, label: "2025 年 (第 1-6 期)" },
];

const groupedIssues = ref([]);
const loading = ref(true);

// 🛠️ 輔助工具：更強的 ID 解析 (支援 "1-07" 也可以支援純數字 "07")
const extractOrderFromId = (idStr) => {
  if (!idStr) return 0;
  // 嘗試抓取橫線後面的數字
  const match = idStr.match(/-(\d+)/);
  if (match) return parseInt(match[1]);
  // 如果沒有橫線，嘗試直接轉數字
  const num = parseInt(idStr);
  return isNaN(num) ? 0 : num;
};

const formatDisplayId = (num) => (num ? num.toString().padStart(2, "0") : "");

const fetchAndGroupArticles = async () => {
  loading.value = true;

  // 1. 查詢 issues 表格，並聯集查詢底下的 articles
  let query = supabase
    .from("issues")
    .select(
      `
      *,
      content:articles (
        id, category, title, subtitle, author, author_display, section, is_published
      )
    `
    )
    .order("id", { ascending: false });

  if (!isEditor.value) {
    query = query.eq("is_published", true);
  }

  const { data: issuesData, error } = await query;

  if (error) {
    console.error("載入失敗:", error);
    loading.value = false;
    return;
  }

  // 2. 資料整理邏輯
  groupedIssues.value = issuesData.map((issue) => {
    // 網址自動補全
    const storageBase = "https://pottupypvdzamztdhsah.supabase.co/storage/v1/object/public/images";
    const defaultCover = `${storageBase}/covers/cover-${issue.id}.png`;
    const defaultPdf = `${storageBase}/magazines/Vol.${issue.id}.pdf`;

    issue.cover_img =
      issue.cover_img && issue.cover_img.startsWith("http") ? issue.cover_img : defaultCover;
    issue.pdf_link =
      issue.pdf_link && issue.pdf_link.startsWith("http") ? issue.pdf_link : defaultPdf;

    if (issue.content && issue.content.length > 0) {
      if (!isEditor.value) {
        issue.content = issue.content.filter((a) => a.is_published);
      }

      issue.content.forEach((art) => {
        art.routeId = art.id;
        art._sortOrder = extractOrderFromId(art.id);
        art.display_id = formatDisplayId(art._sortOrder);
        art.color = getCategoryColor(art.category);
        art.type = "article";
        if (art.author_display) art.author = art.author_display;
      });

      // 🔥 1. 確保排序絕對正確
      issue.content.sort((a, b) => a._sortOrder - b._sortOrder);

      // 🔥 2.【去重複標題邏輯 - 加強版】
      let lastSection = null;
      issue.content.forEach((art) => {
        // 使用 trim() 去除前後空白，避免 "主題廣場" 和 "主題廣場 " 被當成不同
        const currentSection = art.section ? art.section.trim() : null;

        if (currentSection) {
          if (currentSection === lastSection) {
            // 跟上一篇一樣 -> 隱藏
            art.showSectionHeader = false;
          } else {
            // 是新的區塊 -> 顯示
            art.showSectionHeader = true;
            lastSection = currentSection;
          }
        } else {
          art.showSectionHeader = false;
        }
      });

      // 插入結尾項目
      let maxId = 0;
      if (issue.content.length > 0) {
        maxId = issue.content[issue.content.length - 1]._sortOrder;
      }

      issue.content.push({
        display_id: formatDisplayId(maxId + 1),
        title: "投稿資訊／下期主題",
        type: "text-only",
        is_footer_start: true,
      });

      issue.content.push({
        display_id: formatDisplayId(maxId + 2),
        title: "編輯資訊／線上資訊",
        type: "text-only",
      });
    } else {
      issue.content = [];
    }

    issue.isDraft = !issue.is_published;
    return issue;
  });

  if (groupedIssues.value.length > 0) {
    const latestIssue = groupedIssues.value[0];
    const latestYear = 2025 + Math.floor((latestIssue.id - 1) / 6);
    if (yearOptions.some((opt) => opt.value === latestYear)) {
      selectedYear.value = latestYear;
    }
  }

  loading.value = false;
};

const getCategoryColor = (category) => {
  const map = {
    專題文章: "#8b0000",
    評論與回應: "#ff8000",
    人物專訪: "#f0e137",
    生命故事: "#46b175",
    時事感想: "#4682b4",
    文藝創作: "#27408b",
    公告與剪影: "#6a5acd",
    封面故事: "#7d6c29",
    光影時刻: "#7d6c29",
    實驗園地: "#db7093",
  };
  return map[category] || "#999";
};

const filteredIssues = computed(() => {
  return groupedIssues.value.filter((i) => {
    const issueYear = 2025 + Math.floor((i.id - 1) / 6);
    return issueYear === selectedYear.value;
  });
});

onMounted(() => {
  document.title = "文章列表 - 無境界者雜誌";
  fetchAndGroupArticles();

  const route = useRoute();
  if (route.hash) {
    setTimeout(() => {
      const target = document.querySelector(route.hash);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    }, 1500);
  }
});
</script>

<template>
  <MainLayout>
    <div class="article-list-page">
      <h1 class="page-main-title">
        <span class="emoji">📚</span>文章列表<span class="emoji">📚</span>
      </h1>

      <div class="main-divider"></div>

      <div class="year-selector-wrapper">
        <label for="year-select">選擇年份：</label>
        <div class="custom-select">
          <select id="year-select" v-model="selectedYear">
            <option v-for="item in yearOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
          <span class="arrow">▼</span>
        </div>
      </div>

      <div v-if="loading" style="text-align: center; padding: 50px">
        <h2>載入中 . . . 🕊️</h2>
      </div>

      <div v-else-if="filteredIssues.length === 0" class="no-data">
        <p>尚無 {{ selectedYear }} 年的雜誌資料，敬請期待。🥺</p>
      </div>

      <div v-else v-for="(issue, index) in filteredIssues" :key="issue.id" class="magazine-item">
        <br />
        <h2 :id="`issue-${issue.id}`">
          <span>　　</span>第 {{ issue.id }} 期《{{ issue.title }}》
          <span class="issue-date">／{{ issue.date }}</span>
          <span v-if="issue.isDraft" class="draft-badge"> (草稿) </span>
        </h2>

        <div class="content-wrapper">
          <div class="left-section">
            <ul>
              <li v-for="(item, itemIndex) in issue.content" :key="itemIndex">
                <div v-if="item.section && item.showSectionHeader">
                  <br />
                  <div class="title-box">
                    <h3 class="theme-title">{{ item.section }}</h3>
                  </div>
                </div>

                <div v-if="item.is_footer_start">
                  <br />
                  <div class="title-box"></div>
                </div>

                <p>
                  <span v-if="item.display_id" style="font-weight: bold; margin-right: 0.5em">
                    {{ item.display_id }}
                  </span>

                  <span
                    v-if="item.category"
                    class="article-type"
                    :style="{ color: item.color, marginRight: '0.5em', fontSize: '0.8em' }"
                  >
                    {{ item.category }}
                  </span>

                  <router-link v-if="item.type !== 'text-only'" :to="`/articles/${item.routeId}`">
                    {{ item.title }}
                    <span v-if="item.subtitle">──{{ item.subtitle }}</span>
                  </router-link>

                  <span v-else>
                    {{ item.title }}
                  </span>

                  <span v-if="item.author" class="author">｜{{ item.author }}</span>
                </p>
              </li>
            </ul>
          </div>

          <div class="right-section">
            <a :href="issue.pdf_link" target="_blank" title="點擊封面下載PDF檔">
              <img :src="issue.cover_img" :alt="`第${issue.id}期封面`" class="magazine-cover" />
            </a>
            <p class="cover-description">點擊封面下載PDF檔</p>
          </div>
        </div>

        <br /><br />
        <div v-if="index !== filteredIssues.length - 1" class="issue-divider"></div>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped>
@import "@/assets/base.css";

h2 {
  text-align: left;
  color: #444;
  margin-top: 1rem;
  margin-bottom: 1rem;
  font-size: 2rem;
  font-weight: bold;
}
.issue-date {
  color: #ff8000;
  font-size: 20px;
  font-weight: bold;
}
.draft-badge {
  font-size: 0.9rem;
  color: #999;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 10px;
  vertical-align: middle;
  font-weight: normal;
}

.content-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}
.left-section {
  flex: 1;
  margin-left: 1.5rem;
}
.right-section {
  text-align: center;
  margin-top: 2rem;
  flex-shrink: 0;
}
ul {
  padding: 0;
  margin: 0;
  list-style: none;
}
li {
  list-style: none;
  position: relative;
  margin-left: 2rem;
  padding-left: 0.5em;
  margin-bottom: 0.5rem;
  line-height: 1.8;
  font-size: 1.2rem;
  font-family: serif;
}
.article-type {
  font-weight: bold;
  padding-right: 0.5rem;
}
.left-section a {
  color: #007bff;
  text-decoration: none;
  transition: color 0.3s ease;
}

.left-section li p {
  margin: 0;
  padding-left: 2rem;
  text-indent: -2rem;
}
.left-section a:hover {
  color: #0056b3;
  text-decoration: underline;
}
.author {
  color: #333;
  font-size: 1.2rem;
}
.magazine-cover {
  width: 350px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  margin-top: -2em;
}
.magazine-cover:hover {
  transform: scale(1.05);
}
.cover-description {
  font-size: 1rem;
  margin-top: 0.5rem;
  color: #666;
  font-family: serif;
}
.issue-divider {
  width: 100%;
  height: 2px;
  background-color: rgba(0, 0, 0, 0.75);
  border-radius: 2px;
  margin: 20px auto;
}

.title-box {
  text-align: center;
  margin: 1rem 0;
  position: relative;
  min-height: 1px;
}

.title-box::before {
  content: "";
  position: absolute;
  top: -10px;
  left: 0rem;
  width: 100%;
  height: 2px;
  background-color: rgba(0, 0, 0, 0.2);
  transform: none;
  margin-top: 0.2em;
}

.title-box h3 {
  text-align: center !important;
  display: inline-block;
  padding: 0 1rem;
  margin-top: 0.2em;
  font-weight: bold;
  position: relative;
  color: #444;
}

@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
  }
  .right-section {
    order: 1;
    margin: 0 auto 2rem auto;
    width: 100%;
  }
  .magazine-cover {
    width: 80%;
    max-width: 300px;
    margin-top: 0;
  }
  .left-section {
    order: 2;
    width: 100%;
    margin-right: 1.5rem;
    margin-left: 0rem;
  }
  li {
    margin-left: 0.5rem;
    font-size: 1rem;
  }
  h2 {
    font-size: 1.5rem;
    text-align: center;
  }
  h2 span:first-child {
    display: none;
  }
  .issue-date {
    display: block;
    font-size: 1rem;
    margin-top: 5px;
  }
  .title-box h3 {
    font-size: 1.3rem;
  }
  .title-box::before {
    width: 100%;
    height: 1px;
  }
  .author {
    font-size: 1rem;
  }
}
</style>
