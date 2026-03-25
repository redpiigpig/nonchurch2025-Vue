<script setup>
import { watch } from "vue";
import { RouterView } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import AppFooter from "./components/AppFooter.vue";
import { useEditorMode } from "./composables/useEditorMode";
import { useLanguage } from "./composables/useLanguage";

const { isEditor } = useEditorMode();
const { currentLang } = useLanguage();

function changeFavicon(emoji) {
  const link = document.querySelector("link[rel~='icon']");
  if (!link) return;
  link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`;
}

watch(
  isEditor,
  (newVal) => {
    if (newVal) {
      changeFavicon("🌑");
    } else {
      changeFavicon("🌏");
    }
  },
  { immediate: true },
);

// ⭐ 網站 SEO 多國語言字典
const seoTranslations = {
  "zh-TW": {
    title: "無境界者雜誌 | Faith Without Boundary",
    description:
      "《無境界者》雜誌是一個不以教會為本位的自由信仰論述平台，同時也是一份實驗性的線上刊物，定期於雙數月月底發刊。",
  },
  "zh-HK": {
    title: "無境界者雜誌 | Faith Without Boundary",
    description:
      "《無境界者》雜誌係一個唔以教會為本位嘅自由信仰論述平台，同時亦係一份實驗性質嘅網上刊物，定期喺雙數月月底發刊。",
  },
  "zh-CN": {
    title: "无境界者杂志 | Faith Without Boundary",
    description:
      "《无境界者》杂志是一个不以教会为本位的自由信仰论述平台，同时也是一份实验性的线上刊物，定期于双数月月底发刊。",
  },
  en: {
    title: "Faith Without Boundary Magazine",
    description:
      "'Faith Without Boundary' is a free faith discourse platform independent of church institutions, and an experimental online publication issued bi-monthly at the end of even-numbered months.",
  },
  ja: {
    title: "無境界者雑誌 | Faith Without Boundary",
    description:
      "『無境界者』雑誌は、教会に依存しない自由な信仰論壇のプラットフォームであり、偶数月の月末に定期発行される実験的なオンライン刊行物です。",
  },
  ko: {
    title: "무경계자 매거진 | Faith Without Boundary",
    description:
      "『무경계자』 매거진은 교회 중심주의를 벗어난 자유 신앙 담론 플랫폼이자, 짝수 달 말에 정기적으로 발행되는 실험적 온라인 간행물입니다.",
  },
};

// ⭐ 監聽語言改變，動態修改 HTML 標籤的 lang 屬性與 SEO Meta 標籤
watch(
  currentLang,
  (newLang) => {
    const activeLang = newLang === "default" ? "zh-TW" : newLang;

    // 1. 修改 HTML lang
    const langMap = {
      "zh-TW": "zh-Hant-TW",
      "zh-HK": "zh-Hant-HK",
      "zh-CN": "zh-Hans",
      en: "en",
      ja: "ja",
      ko: "ko",
    };
    document.documentElement.lang = langMap[activeLang] || "zh-Hant";

    // 2. 修改 SEO Meta 標籤
    const seoData = seoTranslations[activeLang] || seoTranslations["zh-TW"];

    const updateMeta = (selector, content) => {
      let el = document.querySelector(selector);
      if (el) el.setAttribute("content", content);
    };

    updateMeta('meta[name="description"]', seoData.description);
    updateMeta('meta[property="og:description"]', seoData.description);
    updateMeta('meta[property="og:title"]', seoData.title);

    // 若目前標題是預設的站名（沒有 " - " 代表不在文章內頁），則一併動態切換標題
    if (!document.title.includes(" - ")) {
      document.title = seoData.title;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="site-wrapper">
    <AppHeader />

    <main class="main-content">
      <RouterView />
    </main>

    <AppFooter />
  </div>
</template>
