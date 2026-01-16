<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { marked } from "marked";
import markedFootnote from "marked-footnote";
import { supabase } from "../supabase";
import MainLayout from "../components/MainLayout.vue";
import AudioBookPlayer from "../components/feature_articles/AudioBookPlayer.vue";

marked.use(markedFootnote({ prefixId: "footnote-" }));

const route = useRoute();
const article = ref(null);
const loading = ref(true);

const issueImages = ref([]);

// 處理底部導航點擊
const handleNavClick = () => {
  const currentState = window.history.state || {};
  window.history.replaceState({ ...currentState, forceTop: true }, "");
};

const fetchArticleData = async (articleId) => {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select("*") // ⭐ 這裡會自動抓取 type 和 media_data 欄位
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
      // 確保 media_data 存在，防止報錯
      media_data: data.media_data || {},
    };
  } catch (error) {
    console.error(`載入文章 ${articleId} 失敗:`, error.message);
    return null;
  }
};

const fetchIssueImages = async (issueNumber) => {
  if (!issueNumber) return;
  const path = `articles/issue-${issueNumber}`;
  const { data, error } = await supabase.storage.from("images").list(path, {
    limit: 1000,
    offset: 0,
    sortBy: { column: "name", order: "asc" },
  });

  if (!error && data) {
    issueImages.value = data;
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
  () => route.params.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      loading.value = true;
      const fetchedArticle = await fetchArticleData(newId);
      if (fetchedArticle) {
        article.value = fetchedArticle;
        if (article.value.issue) {
          await fetchIssueImages(article.value.issue);
        }
        updateMetaTags(article.value.seo, article.value);
        const number = article.value.id.replace(article.value.title, "");
        document.title = `${number} ${article.value.title} - 無境界者雜誌`;
      }
      loading.value = false;
    }
  }
);

onMounted(async () => {
  loading.value = true;
  if (route.name === "article-preview") {
    const localData = localStorage.getItem("preview_article");
    if (localData) {
      article.value = JSON.parse(localData);
      if (article.value.issue) {
        await fetchIssueImages(article.value.issue);
      }
      document.title = `[預覽] ${article.value.title}`;
      loading.value = false;
      return;
    }
  }

  const articleId = route.params.id;
  const fetchPromise = fetchArticleData(articleId);
  const fetchedArticle = await fetchPromise;

  if (fetchedArticle) {
    article.value = fetchedArticle;
    if (article.value.issue) {
      await fetchIssueImages(article.value.issue);
    }
    updateMetaTags(article.value.seo, article.value);
    const number = article.value.id.replace(article.value.title, "");
    document.title = `${number} ${article.value.title} - 無境界者雜誌`;
  } else {
    document.title = "找不到文章 - 無境界者雜誌";
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
    if (srcValue.startsWith("http") || srcValue.startsWith("data:") || srcValue.startsWith("//")) {
      return match;
    }
    if (!issueImages.value || issueImages.value.length === 0) {
      return match;
    }
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

  if (article.value.footnotes && article.value.footnotes.length > 0) {
    const listItems = article.value.footnotes
      .map((note) => {
        return `<li id="footnote-${note.id}">
          <p>
            ${note.text}
            <a href="#footnote-ref-${note.id}" class="footnote-backref">↩</a>
          </p>
        </li>`;
      })
      .join("");

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
    封面故事: "#7d6c29",
    光影時刻: "#7d6c29",
    實驗園地: "#db7093",
    // 可以為有聲書增加一個特別色
    有聲繪本: "#e91e63",
  };
  return colorMap[article.value.category] || "#ff8000";
});

const issueLinkParams = computed(() => {
  if (!article.value || !article.value.issue) return {};
  const year = 2025 + Math.floor((article.value.issue - 1) / 6);
  return {
    path: "/articles",
    query: { year: year },
    hash: `#issue-${article.value.issue}`,
  };
});
</script>

<template>
  <MainLayout>
    <div v-if="loading" class="loading-state">
      正在載入文章內容 🕊️<span class="loading-dots"></span>
    </div>

    <div v-else-if="!article" class="not-found">
      <h2>找不到這篇文章😖</h2>
      <RouterLink to="/articles" class="back-link">回文章列表</RouterLink>
    </div>

    <div v-else>
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
          v-html="'──' + formatTextWithFootnote(article.subtitle)"
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

      <div v-if="article.type === 'audiobook'">
        <AudioBookPlayer :article="article" />

        <div v-if="htmlContent" class="audiobook-supplement">
          <div class="markdown-body" v-html="htmlContent"></div>
        </div>
      </div>

      <article v-else class="article-content">
        <div v-if="article.keyword" class="keyword-section" v-html="keywordContent"></div>
        <br />
        <div class="markdown-body" v-html="htmlContent"></div>
      </article>

      <div class="article-navigation">
        <div class="nav-item">
          <template v-if="article.prev">
            <strong>閱讀上一篇文章</strong>
            <RouterLink
              v-if="article.prev.id"
              :to="`/articles/${article.prev.id}`"
              @click="handleNavClick"
            >
              {{ article.prev.title }}
            </RouterLink>
            <span v-else>{{ article.prev.title }}</span>
          </template>
        </div>

        <div class="nav-item">
          <strong>回到本期雜誌目錄</strong>
          <RouterLink :to="issueLinkParams" @click="handleNavClick">
            第{{ article.issue }}期：{{ article.issueTitle }}
          </RouterLink>
        </div>

        <div class="nav-item">
          <template v-if="article.next">
            <strong>閱讀下一篇文章</strong>
            <RouterLink
              v-if="article.next.id"
              :to="`/articles/${article.next.id}`"
              @click="handleNavClick"
            >
              {{ article.next.title }}
            </RouterLink>
            <span v-else>{{ article.next.title }}</span>
          </template>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped>
/* ⭐ 新增樣式：讓有聲書下方的補充文字稍微隔開 */
.audiobook-supplement {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px dashed #ccc;
}

/* --- 以下保持原有樣式 --- */
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
</style>
