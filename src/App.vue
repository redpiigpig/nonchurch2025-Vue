<script setup>
import { watch } from "vue";
import { RouterView } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import AppFooter from "./components/AppFooter.vue";
import { useEditorMode } from "./composables/useEditorMode";

const { isEditor } = useEditorMode();

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
