<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "../supabase";
import { useEditorMode } from "../composables/useEditorMode";
import MainLayout from "../components/MainLayout.vue";
import { useLanguage } from "../composables/useLanguage";

const { isEditor } = useEditorMode();
const { currentLang } = useLanguage();
const route = useRoute();
const router = useRouter();

const selectedYear = ref(2025);

// ⭐ 文章列表多國語言字典
const listTranslations = {
  "zh-TW": {
    title: "文章列表",
    selectYear: "選擇年份：",
    opt2026: "2026 年 (第 7-12 期)",
    opt2025: "2025 年 (第 1-6 期)",
    loading: "正在載入文章列表 🕊️",
    noData: (y) => `尚無 ${y} 年的雜誌資料，敬請期待。🥺`,
    issueTitle: (id, t) => `第 ${id} 期《${t}》`,
    draft: "(期數草稿)",
    download: "點擊封面下載PDF檔",
    footer1: "投稿資訊／下期主題",
    footer2: "編輯資訊／線上資訊",
  },
  en: {
    title: "Articles",
    selectYear: "Select Year:",
    opt2026: "2026 (Vol. 7-12)",
    opt2025: "2025 (Vol. 1-6)",
    loading: "Loading Articles🕊️...",
    noData: (y) => `No data for ${y} yet. Stay tuned.🥺`,
    issueTitle: (id, t) => `Vol.${id} 《${t}》`,
    draft: "(Draft)",
    download: "Download PDF",
    footer1: "Submission / Next Issue",
    footer2: "Editorial / Online Info",
  },
  ja: {
    title: "記事一覧",
    selectYear: "年を選択：",
    opt2026: "2026年 (第7-12号)",
    opt2025: "2025年 (第1-6号)",
    loading: "読み込み中🕊️...",
    noData: (y) => `${y}年のデータはまだありません。🥺`,
    issueTitle: (id, t) => `第 ${id} 号《${t}》`,
    draft: "(下書き)",
    download: "PDFをダウンロード",
    footer1: "投稿案内／次号テーマ",
    footer2: "編集情報／オンライン情報",
  },
  ko: {
    title: "기사 목록",
    selectYear: "연도 선택:",
    opt2026: "2026년 (제7-12호)",
    opt2025: "2025년 (제1-6호)",
    loading: "불러오는 중🕊️...",
    noData: (y) => `${y}년 데이터가 아직 없습니다.🥺`,
    issueTitle: (id, t) => `제 ${id} 호《${t}》`,
    draft: "(초안)",
    download: "PDF 다운로드",
    footer1: "투고 안내 / 다음 호 주제",
    footer2: "편집 정보 / 온라인 정보",
  },
};
const t = computed(() => listTranslations[currentLang.value] || listTranslations["zh-TW"]);

const yearOptions = computed(() => [
  { value: 2026, label: t.value.opt2026 },
  { value: 2025, label: t.value.opt2025 },
]);

const categoryTranslations = {
  "zh-TW": {
    專題文章: "專題文章",
    評論與回應: "評論與回應",
    人物專訪: "人物專訪",
    生命故事: "生命故事",
    時事感想: "時事感想",
    文藝創作: "文藝創作",
    公告與剪影: "公告與剪影",
    封面故事: "封面故事",
  },
  en: {
    專題文章: "Feature",
    評論與回應: "Review",
    人物專訪: "Interview",
    生命故事: "Life Story",
    時事感想: "Current Affairs",
    文藝創作: "Literature",
    公告與剪影: "Notice",
    封面故事: "Cover Story",
  },
  ja: {
    專題文章: "特集記事",
    評論與回應: "評論と応答",
    人物專訪: "インタビュー",
    生命故事: "ライフストーリー",
    時事感想: "時事コラム",
    文藝創作: "文芸創作",
    公告與剪影: "お知らせ",
    封面故事: "カバーストーリー",
  },
  ko: {
    專題文章: "특집 기사",
    評論與回應: "평론 및 응답",
    人物專訪: "인터뷰",
    生命故事: "삶의 이야기",
    時事感想: "시사 칼럼",
    文藝創作: "문예 창작",
    公告與剪影: "공지사항",
    封面故事: "커버 스토리",
  },
};
const translateCategory = (cat) =>
  categoryTranslations[currentLang.value]?.[cat] || categoryTranslations["zh-TW"]?.[cat] || cat;

const groupedIssues = ref([]);
const loading = ref(true);

const saveScrollPosition = (selector) => {
  const currentState = window.history.state || {};
  window.history.replaceState({ ...currentState, scrollTo: selector }, "");
};

const extractOrderFromId = (idStr) => {
  if (!idStr) return 0;
  const match = idStr.match(/-(\d+)/);
  if (match) return parseInt(match[1]);
  return parseInt(idStr) || 0;
};
const formatDisplayId = (num) => (num ? num.toString().padStart(2, "0") : "");
const scrollToAnchor = async () => {
  if (route.hash) {
    await nextTick();
    const targetId = route.hash.substring(1);
    const element = document.getElementById(targetId);
    if (element) element.scrollIntoView({ behavior: "auto", block: "center" });
  }
};

const fetchAndGroupArticles = async () => {
  loading.value = true;
  // ⭐ 確保撈取文章的 translations 欄位
  let query = supabase
    .from("issues")
    .select(
      `*, content:articles (id, category, title, subtitle, author, author_display, section, is_published, translations)`,
    )
    .order("id", { ascending: false });
  if (!isEditor.value) query = query.eq("is_published", true);
  const { data: issuesData, error } = await query;
  if (error) {
    loading.value = false;
    return;
  }

  groupedIssues.value = issuesData.map((issue) => {
    issue.cover_img = issue.cover_img?.startsWith("http")
      ? issue.cover_img
      : `https://res.cloudinary.com/nonchurch2025/image/upload/cover-${issue.id}.png`;
    issue.pdf_link = issue.pdf_link?.startsWith("http")
      ? issue.pdf_link
      : `https://res.cloudinary.com/nonchurch2025/image/upload/Vol.${issue.id}.pdf`;
    if (issue.content?.length > 0) {
      if (!isEditor.value) issue.content = issue.content.filter((a) => a.is_published);
      issue.content.forEach((art) => {
        art.routeId = art.id;
        art._sortOrder = extractOrderFromId(art.id);
        art.display_id = formatDisplayId(art._sortOrder);
        art.color = getCategoryColor(art.category);
        art.type = "article";
        if (art.author_display) art.author = art.author_display;
      });
      issue.content.sort((a, b) => a._sortOrder - b._sortOrder);
      let lastSection = null;
      issue.content.forEach((art) => {
        const currentSection = art.section?.trim();
        if (currentSection) {
          art.showSectionHeader = currentSection !== lastSection;
          lastSection = currentSection;
        } else art.showSectionHeader = false;
      });
      let maxId = issue.content.length > 0 ? issue.content[issue.content.length - 1]._sortOrder : 0;
      issue.content.push({
        display_id: formatDisplayId(maxId + 1),
        type: "text-only",
        is_footer_start: true,
      });
      issue.content.push({
        display_id: formatDisplayId(maxId + 2),
        type: "text-only",
      });
    } else {
      issue.content = [];
    }
    issue.isDraft = !issue.is_published;
    return issue;
  });

  const queryYear = parseInt(route.query.year);
  if (yearOptions.value.some((opt) => opt.value === queryYear)) selectedYear.value = queryYear;
  else if (groupedIssues.value.length > 0) {
    const latestYear = 2025 + Math.floor((groupedIssues.value[0].id - 1) / 6);
    if (yearOptions.value.some((opt) => opt.value === latestYear)) selectedYear.value = latestYear;
  }
  loading.value = false;
  scrollToAnchor();
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
  };
  return map[category] || "#999";
};

const filteredIssues = computed(() =>
  groupedIssues.value.filter((i) => 2025 + Math.floor((i.id - 1) / 6) === selectedYear.value),
);

// ⭐ 動態映射當前語系的雜誌與文章資料
const displayIssues = computed(() => {
  const langKey = currentLang.value === "default" ? "zh_TW" : currentLang.value.replace("-", "_");

  return filteredIssues.value.map((issue) => {
    const tIss = issue.translations?.[langKey] || {};

    const mappedContent = issue.content.map((art) => {
      if (art.type === "text-only") {
        return {
          ...art,
          title: art.is_footer_start ? t.value.footer1 : t.value.footer2,
        };
      }
      const tArt = art.translations?.[langKey] || {};
      return {
        ...art,
        title: tArt.title || art.title,
        subtitle: tArt.subtitle || art.subtitle,
        author: tArt.author_display || tArt.author || art.author,
      };
    });

    return {
      ...issue,
      title: tIss.title || issue.title,
      date: tIss.date || issue.date,
      content: mappedContent,
    };
  });
});

watch(selectedYear, (newVal) => router.replace({ query: { ...route.query, year: newVal } }));
watch(isEditor, fetchAndGroupArticles);

onMounted(() => {
  document.title = "文章列表 - 無境界者雜誌";
  fetchAndGroupArticles();
});
</script>

<template>
  <MainLayout>
    <div class="article-list-page">
      <h1 class="page-main-title">
        <span class="emoji">📚</span>{{ t.title }}<span class="emoji">📚</span>
      </h1>
      <div class="main-divider"></div>
      <div class="year-selector-wrapper">
        <label for="year-select">{{ t.selectYear }}</label>
        <div class="custom-select">
          <select id="year-select" v-model="selectedYear">
            <option v-for="item in yearOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
          <span class="arrow">▼</span>
        </div>
      </div>
      <div v-if="loading" class="loading-state">
        {{ t.loading }}<span class="loading-dots"></span>
      </div>
      <div v-else-if="displayIssues.length === 0" class="no-data">
        <p>{{ t.noData(selectedYear) }}</p>
      </div>

      <div v-else v-for="(issue, index) in displayIssues" :key="issue.id" class="magazine-item">
        <br />
        <h2 :id="`issue-${issue.id}`">
          <span>　　</span>{{ t.issueTitle(issue.id, issue.title) }}
          <span class="issue-date">／{{ issue.date }}</span>
          <span v-if="issue.isDraft" class="draft-badge"> {{ t.draft }} </span>
        </h2>
        <div class="content-wrapper">
          <div class="left-section">
            <ul>
              <li v-for="(item, itemIndex) in issue.content" :key="itemIndex">
                <div v-if="item.section && item.showSectionHeader">
                  <br />
                  <div class="title-box">
                    <h3 class="theme-title">{{ translateCategory(item.section) }}</h3>
                  </div>
                </div>
                <div v-if="item.is_footer_start">
                  <br />
                  <div class="title-box"></div>
                </div>
                <p>
                  <span v-if="item.display_id" style="font-weight: bold; margin-right: 0.5em">{{
                    item.display_id
                  }}</span>
                  <span
                    v-if="item.category"
                    class="article-type"
                    :style="{ color: item.color, marginRight: '0.5em', fontSize: '0.8em' }"
                  >
                    {{ translateCategory(item.category) }}
                  </span>
                  <router-link
                    v-if="item.type !== 'text-only'"
                    :to="`/articles/${item.routeId}`"
                    @click="saveScrollPosition(`#issue-${issue.id}`)"
                  >
                    {{ item.title }}<span v-if="item.subtitle">──{{ item.subtitle }}</span>
                    <span
                      v-if="isEditor && !item.is_published"
                      style="color: red; font-size: 0.8em; font-weight: bold; margin-left: 5px"
                      >(草稿)</span
                    >
                  </router-link>
                  <span v-else>{{ item.title }}</span>
                  <span v-if="item.author" class="author">｜{{ item.author }}</span>
                </p>
              </li>
            </ul>
          </div>
          <div class="right-section">
            <a :href="issue.pdf_link" target="_blank" :title="t.download">
              <img :src="issue.cover_img" :alt="`Vol.${issue.id} Cover`" class="magazine-cover" />
            </a>
            <p class="cover-description">{{ t.download }}</p>
          </div>
        </div>
        <br /><br />
        <div v-if="index !== displayIssues.length - 1" class="issue-divider"></div>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped>
@import "@/assets/shared.css";
/* 樣式保持不變 */
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
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  font-size: 2rem;
  color: #888;
  font-family: serif;
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
