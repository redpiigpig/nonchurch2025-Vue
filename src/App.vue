<script setup>
import { watch } from "vue";
import { RouterView } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import AppFooter from "./components/AppFooter.vue";
import { useEditorMode } from "./composables/useEditorMode";
import { useLanguage } from "./composables/useLanguage"; // ⭐ 引入全域語言控制器

const { isEditor } = useEditorMode();
const { currentLang } = useLanguage(); // ⭐ 取得當前語言

function changeFavicon(emoji) {
  const link = document.querySelector("link[rel~='icon']");
  if (!link) return;
  link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`;
}

watch(
  isEditor,
  (newVal) => {
    if (newVal) {
      // 進入後台 (/admin) -> 月亮 🌑
      changeFavicon("🌑");
    } else {
      // 回到前台 -> 地球 🌏
      changeFavicon("🌏");
    }
  },
  { immediate: true },
);

// ⭐ 監聽語言改變，動態修改 HTML 標籤的 lang 屬性
watch(
  currentLang,
  (newLang) => {
    // 將我們的選項代碼轉換成標準的 HTML lang 代碼
    const langMap = {
      default: "zh-Hant",
      "zh-TW": "zh-Hant",
      "zh-CN": "zh-Hans",
      en: "en",
      ja: "ja",
      ko: "ko",
    };
    document.documentElement.lang = langMap[newLang] || "zh-Hant";
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
