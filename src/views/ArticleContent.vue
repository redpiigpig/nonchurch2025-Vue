<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { marked } from "marked";
import markedFootnote from "marked-footnote";
import { supabase } from "../supabase";
import MainLayout from "../components/MainLayout.vue";
import { defineAsyncComponent } from "vue";
import { useLanguage } from "../composables/useLanguage";
import { useEditorMode } from "../composables/useEditorMode";

marked.use(markedFootnote({ prefixId: "footnote-" }));

const route = useRoute();
const { currentLang } = useLanguage();
const { isEditor } = useEditorMode();
const article = ref(null);
const loading = ref(true);

const issueImages = ref([]);

// ⭐ 網站名稱多國語言字典 (用於 document.title)
const siteNames = {
  "zh-TW": "無境界者雜誌",
  "zh-HK": "無境界者雜誌",
  "zh-CN": "无境界者杂志",
  en: "Faith Without Boundary",
  ja: "無境界者雑誌",
  ko: "무경계자 매거진",
};

const contentTrans = {
  "zh-TW": {
    prev: "閱讀上一篇文章",
    next: "閱讀下一篇文章",
    backToToc: "回到本期雜誌目錄",
    issuePrefix: "第",
    issueSuffix: "期：",
    browserTrans: "", // 繁體中文不顯示
  },
  "zh-HK": {
    prev: "閱讀上一篇文章",
    next: "閱讀下一篇文章",
    backToToc: "返去今期雜誌目錄",
    issuePrefix: "第",
    issueSuffix: "期：",
    browserTrans: "本文內容係用台灣繁體寫嘅，如果你偏好用粵語閱讀，可以使用瀏覽器翻譯功能。",
  },
  "zh-CN": {
    prev: "阅读上一篇文章",
    next: "阅读下一篇文章",
    backToToc: "回到本期杂志目录",
    issuePrefix: "第",
    issueSuffix: "期：",
    browserTrans: "原文为繁体中文，建议使用浏览器的翻译功能以获得最佳阅读體驗。",
  },
  en: {
    prev: "Previous Article",
    next: "Next Article",
    backToToc: "Back to Table of Contents",
    issuePrefix: "Vol.",
    issueSuffix: ": ",
    browserTrans:
      "The original text is in Traditional Chinese. Please use your browser's translation feature to read.",
  },
  ja: {
    prev: "前の記事を読む",
    next: "次の記事を読む",
    backToToc: "目次に戻る",
    issuePrefix: "第",
    issueSuffix: "号：",
    browserTrans: "原文は繁体字中国語です。ブラウザの翻訳機能を利用してご覧ください。",
  },
  ko: {
    prev: "이전 기사 읽기",
    next: "다음 기사 읽기",
    backToToc: "목차로 돌아가기",
    issuePrefix: "제",
    issueSuffix: "호: ",
    browserTrans: "원문은 번체 중국어입니다. 브라우저의 번역 기능을 사용하여 읽어주시기 바랍니다.",
  },
};
const t = computed(() => contentTrans[currentLang.value] || contentTrans["zh-TW"]);

const handleNavClick = () => {
  const currentState = window.history.state || {};
  window.history.replaceState({ ...currentState, forceTop: true }, "");
};

const getArticleOrder = (idStr) => {
  if (!idStr) return 0;
  const match = idStr.match(/-(\d+)/);
  return match ? parseInt(match[1]) : parseInt(idStr) || 0;
};

const fetchArticleData = async (articleId) => {
  try {
    const { data: currentArt, error } = await supabase
      .from("articles")
      .select("*, issues(id, title, translations)")
      .eq("id", articleId)
      .single();
    if (error) throw error;
    let query = supabase
      .from("articles")
      .select("id, title, translations")
      .eq("issue", currentArt.issue);
    if (!isEditor.value) query = query.eq("is_published", true);
    const { data: issueArticles, error: issueErr } = await query;
    let prev = null,
      next = null;
    if (!issueErr && issueArticles) {
      issueArticles.sort((a, b) => getArticleOrder(a.id) - getArticleOrder(b.id));
      const currentIndex = issueArticles.findIndex((a) => a.id === articleId);
      if (currentIndex > 0) prev = issueArticles[currentIndex - 1];
      if (currentIndex !== -1 && currentIndex < issueArticles.length - 1)
        next = issueArticles[currentIndex + 1];
    }
    return {
      ...currentArt,
      authorTitle: currentArt.author_title,
      issueTitle: currentArt.issue_title,
      dynamicPrev: prev,
      dynamicNext: next,
      footnotes: currentArt.footnotes || [],
      media_data: currentArt.media_data || {},
    };
  } catch (error) {
    console.error(`載入文章 ${articleId} 失敗:`, error.message);
    return null;
  }
};

const fetchIssueImages = async (issueNumber) => {
  if (!issueNumber) return;
  const path = `articles/issue-${issueNumber}`;
  const { data, error } = await supabase.storage
    .from("images")
    .list(path, { limit: 1000, offset: 0, sortBy: { column: "name", order: "asc" } });
  if (!error && data) issueImages.value = data;
};

const displayArticle = computed(() => {
  if (!article.value) return null;
  const langKey = currentLang.value === "default" ? "zh_TW" : currentLang.value.replace("-", "_");
  const tArt = article.value.translations?.[langKey] || {};
  const tIss = article.value.issues?.translations?.[langKey] || {};

  let displayPrev = null;
  if (article.value.dynamicPrev) {
    const pTrans = article.value.dynamicPrev.translations?.[langKey] || {};
    displayPrev = {
      id: article.value.dynamicPrev.id,
      title: pTrans.title || article.value.dynamicPrev.title,
    };
  }

  let displayNext = null;
  if (article.value.dynamicNext) {
    const nTrans = article.value.dynamicNext.translations?.[langKey] || {};
    displayNext = {
      id: article.value.dynamicNext.id,
      title: nTrans.title || article.value.dynamicNext.title,
    };
  }

  return {
    ...article.value,
    title: tArt.title || article.value.title,
    subtitle: tArt.subtitle || article.value.subtitle,
    author: tArt.author_display || tArt.author || article.value.author,
    authorTitle: tArt.author_title || article.value.authorTitle,
    keyword: tArt.keyword || article.value.keyword,
    remark: tArt.remark || article.value.remark,
    issueTitle: tIss.title || article.value.issueTitle,
    displayPrev,
    displayNext,
  };
});

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
    光影時刻: "光影時刻",
    實驗園地: "實驗園地",
  },
  "zh-HK": {
    專題文章: "專題文章",
    評論與回應: "評論與回應",
    人物專訪: "人物專訪",
    生命故事: "生命故事",
    時事感想: "時事感想",
    文藝創作: "文藝創作",
    公告與剪影: "公告與剪影",
    封面故事: "封面故事",
    光影時刻: "光影時刻",
    實驗園地: "實驗園地",
  },
  "zh-CN": {
    專題文章: "专题文章",
    評論與回應: "评论与回应",
    人物專訪: "人物专访",
    生命故事: "生命故事",
    時事感想: "时事感想",
    文藝創作: "文艺创作",
    公告與剪影: "公告与剪影",
    封面故事: "封面故事",
    光影時刻: "光影时刻",
    實驗園地: "实验园地",
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
    光影時刻: "Moments",
    實驗園地: "Experimental",
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
    光影時刻: "光影の時",
    實驗園地: "実験的創作",
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
    光影時刻: "포토 스토리",
    實驗園地: "실험적 창작",
  },
};

const translatedCategory = computed(() => {
  if (!displayArticle.value) return "";
  const lang = currentLang.value === "default" ? "zh-TW" : currentLang.value;
  return (
    categoryTranslations[lang]?.[displayArticle.value.category] || displayArticle.value.category
  );
});

const showTranslationHint = computed(() => {
  return currentLang.value !== "zh-TW" && currentLang.value !== "default";
});

const updateMetaTags = (seoData, currentArticle) => {
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
  addMeta("author", currentArticle.author);
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
  [displayArticle, currentLang],
  ([newArt, newLang]) => {
    if (newArt) {
      const numberMatch = newArt.id.match(/^(\d+-\d+)/);
      const numPrefix = numberMatch ? numberMatch[1] + " " : "";
      const activeLang = newLang === "default" ? "zh-TW" : newLang;
      const siteName = siteNames[activeLang] || siteNames["zh-TW"];
      document.title = `${numPrefix}${newArt.title} - ${siteName}`;
    }
  },
  { immediate: true },
);

watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      loading.value = true;
      const fetchedArticle = await fetchArticleData(newId);
      if (fetchedArticle) {
        article.value = fetchedArticle;
        if (article.value.issue) await fetchIssueImages(article.value.issue);
        updateMetaTags(article.value.seo, article.value);
      }
      loading.value = false;
    }
  },
);

const specialComponentsMap = {
  "7-6 In 是 Siáng？（他們是誰？）": defineAsyncComponent(
    () => import("../components/feature_articles/Article7_6.vue"),
  ),
};
const currentSpecialComponent = computed(() => {
  if (!article.value || article.value.type !== "special") return null;
  const matchKey = Object.keys(specialComponentsMap).find((key) => article.value.id.includes(key));
  return matchKey ? specialComponentsMap[matchKey] : null;
});

onMounted(async () => {
  loading.value = true;
  if (route.name === "article-preview") {
    const localData = localStorage.getItem("preview_article");
    if (localData) {
      article.value = JSON.parse(localData);
      if (article.value.issue) await fetchIssueImages(article.value.issue);
      document.title = `[預覽] ${article.value.title}`;
      loading.value = false;
      return;
    }
  }

  const articleId = route.params.id;
  const fetchedArticle = await fetchArticleData(articleId);

  if (fetchedArticle) {
    article.value = fetchedArticle;
    if (article.value.issue) await fetchIssueImages(article.value.issue);
    updateMetaTags(article.value.seo, article.value);
  }
  loading.value = false;
});

const formatTextWithFootnote = (text) => {
  if (!text) return "";
  return text.replace(/\[\^(\d+)\]/g, (match, id) => {
    return `<sup class="footnote-ref"><a href="#footnote-${id}" id="footnote-ref-${id}">${id}</a></sup>`;
  });
};

const htmlContent = computed(() => {
  if (!article.value || !article.value.content) return "";
  let fullText = article.value.content;
  fullText = fullText.replace(/\[\^(\d+)\]/g, (match, id) => {
    return `<sup class="footnote-ref"><a href="#footnote-${id}" id="footnote-ref-${id}">${id}</a></sup>`;
  });

  let parsedHtml = marked.parse(fullText, { gfm: true, breaks: true });
  parsedHtml = parsedHtml.replace(/src="([^"]+)"/g, (match, srcValue) => {
    if (srcValue.startsWith("http") || srcValue.startsWith("data:") || srcValue.startsWith("//"))
      return match;
    if (!issueImages.value || issueImages.value.length === 0) return match;
    const matchedFile = issueImages.value.find((file) => {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
      return file.name === srcValue || nameWithoutExt === srcValue;
    });
    if (matchedFile) {
      const fullPath = `articles/issue-${article.value.issue}/${matchedFile.name}`;
      const { data } = supabase.storage.from("images").getPublicUrl(fullPath);
      return `src="${data.publicUrl}"`;
    }
    return match;
  });
  return parsedHtml;
});

const footnotesHtml = computed(() => {
  if (!article.value || !article.value.footnotes || article.value.footnotes.length === 0) return "";
  const listItems = article.value.footnotes
    .map((note) => {
      return `<li id="footnote-${note.id}"><p>${note.text}<a href="#footnote-ref-${note.id}" class="footnote-backref">↩</a></p></li>`;
    })
    .join("");
  return `<div class="footnotes"><hr /><ol>${listItems}</ol></div>`;
});

const keywordContent = computed(() => {
  if (!displayArticle.value || !displayArticle.value.keyword) return "";
  return marked.parse(displayArticle.value.keyword);
});

const categoryColor = computed(() => {
  if (!displayArticle.value || !displayArticle.value.category) return "#ff8000";
  const colorMap = {
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
  return colorMap[displayArticle.value.category] || "#ff8000";
});

const issueLinkParams = computed(() => {
  if (!displayArticle.value || !displayArticle.value.issue) return {};
  const year = 2025 + Math.floor((displayArticle.value.issue - 1) / 6);
  return { path: "/articles", query: { year: year }, hash: `#issue-${displayArticle.value.issue}` };
});
</script>

<template>
  <MainLayout>
    <div v-if="loading" class="loading-state">
      正在載入文章內容 🕊️<span class="loading-dots"></span>
    </div>

    <div v-else-if="!displayArticle" class="not-found">
      <h2>找不到這篇文章😖</h2>
      <RouterLink to="/articles" class="back-link">回文章列表</RouterLink>
    </div>

    <div v-else>
      <div class="title-header">
        <div
          v-if="displayArticle.category"
          class="featured-box"
          :style="{ backgroundColor: categoryColor }"
        >
          {{ translatedCategory }}
        </div>
        <h1 class="main-title" v-html="formatTextWithFootnote(displayArticle.title)"></h1>
        <h1
          v-if="displayArticle.subtitle"
          class="sub-title"
          v-html="'──' + formatTextWithFootnote(displayArticle.subtitle)"
        ></h1>

        <div v-if="showTranslationHint" class="translation-hint">💡 {{ t.browserTrans }}</div>
      </div>

      <div class="divider-thick"></div>
      <div class="divider-gap"></div>
      <div class="divider-thin"></div>

      <div class="author-info">
        <p class="author-name">
          <span v-html="formatTextWithFootnote(displayArticle.author)"></span>
          <span
            class="author-title"
            v-html="formatTextWithFootnote(displayArticle.authorTitle)"
          ></span>
          <span
            v-if="displayArticle.remark"
            class="author-remark"
            v-html="formatTextWithFootnote(displayArticle.remark)"
          ></span>
        </p>
      </div>

      <div v-if="displayArticle.type === 'special' && currentSpecialComponent">
        <div v-if="displayArticle.keyword" class="keyword-section" v-html="keywordContent"></div>
        <div v-if="htmlContent" class="audiobook-intro">
          <div class="markdown-body" v-html="htmlContent"></div>
        </div>
        <component :is="currentSpecialComponent" :article="displayArticle" />
        <div v-if="footnotesHtml" class="markdown-body" v-html="footnotesHtml"></div>
      </div>

      <article v-else class="article-content">
        <div v-if="displayArticle.keyword" class="keyword-section" v-html="keywordContent"></div>
        <br />
        <div class="markdown-body" v-html="htmlContent"></div>
        <div v-if="footnotesHtml" class="markdown-body" v-html="footnotesHtml"></div>
      </article>

      <div class="article-navigation">
        <div class="nav-item">
          <template v-if="displayArticle.displayPrev">
            <strong>{{ t.prev }}</strong>
            <RouterLink :to="`/articles/${displayArticle.displayPrev.id}`" @click="handleNavClick">
              {{ displayArticle.displayPrev.title }}
            </RouterLink>
          </template>
        </div>

        <div class="nav-item">
          <strong>{{ t.backToToc }}</strong>
          <RouterLink :to="issueLinkParams" @click="handleNavClick">
            {{ t.issuePrefix }}{{ displayArticle.issue }}{{ t.issueSuffix
            }}{{ displayArticle.issueTitle }}
          </RouterLink>
        </div>

        <div class="nav-item">
          <template v-if="displayArticle.displayNext">
            <strong>{{ t.next }}</strong>
            <RouterLink :to="`/articles/${displayArticle.displayNext.id}`" @click="handleNavClick">
              {{ displayArticle.displayNext.title }}
            </RouterLink>
          </template>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped>
.audiobook-intro {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 2px dashed #ccc;
}
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
:deep(.footnotes) {
  margin-top: 60px;
  padding-top: 20px;
  border-top: 2px solid #444;
  font-size: 1rem;
  color: #666;
}
:deep(.footnotes h2),
:deep(.footnotes hr) {
  display: none;
}
:deep(.footnotes ol) {
  padding-left: 0;
  margin-left: -1rem;
  list-style: none;
  counter-reset: footnote-counter;
}
:deep(.footnotes li) {
  display: flex;
  align-items: baseline;
  position: relative;
  margin-bottom: 0px;
  padding-left: 0;
  counter-increment: footnote-counter;
  line-height: 1.6;
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
:deep(.footnotes li p) {
  margin: 0;
  text-indent: 0 !important;
  flex-grow: 1;
  padding-left: 10px;
  font-family: "Times New Roman", serif;
  color: #444;
  text-align: justify;
  min-width: 0;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  word-break: break-word;
}
:deep(.footnotes .footnote-backref) {
  text-decoration: none;
  border: none;
  color: #007bff;
  margin-left: 5px;
  font-family: sans-serif;
}
:deep(.footnotes .footnote-backref:hover) {
  color: #0056b3;
}
@media (max-width: 768px) {
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

.translation-hint {
  background-color: #f8f9fa;
  border-left: 4px solid #ffc107;
  padding: 10px 15px;
  margin: 10px 2rem;
  font-size: 0.95rem;
  color: #666;
  border-radius: 4px;
}
</style>
