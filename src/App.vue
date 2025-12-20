<script setup>
import { watch } from "vue";
import { RouterView } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import AppFooter from "./components/AppFooter.vue";
// 引入邏輯
import { useEditorMode } from "./composables/useEditorMode";

const { isEditor } = useEditorMode();

// Helper: 動態修改 Favicon (讓分頁圖示變成月球或地球)
function changeFavicon(emoji) {
  const link = document.querySelector("link[rel~='icon']");
  if (!link) return;
  link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`;
}

// 監聽模式變化
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
  { immediate: true }
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

<style>
/* ==========================
   來自原本 main.css 的設定 (保持不變)
   ========================== */

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: "Times New Roman", serif;
}

body {
  font-size: 1.2rem;
  background-image: url("/images/system/背景圖片.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-color: #f4f4f4;
  overflow-x: hidden;
}

h1,
h2,
h3,
h4,
p,
ul,
li {
  margin: 0;
  padding: 0;
  list-style: none;
}

h2 {
  text-align: center;
  color: #444;
  margin-bottom: 1rem;
}

h3 {
  margin: 1em 0 -0.5em;
  color: #444;
}

p {
  line-height: 1.8;
  color: #444;
}

section {
  margin-bottom: 2rem;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.site-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
}

.main-content {
  flex: 1;
  width: 100%;
}
</style>
