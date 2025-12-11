<script setup>
import { RouterView } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import AppFooter from "./components/AppFooter.vue";
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
/* 這是全站的基礎設定 */
body {
  margin: 0;
  padding: 0;
  font-family: "Times New Roman", serif;
  background-color: #f4f4f4;
}

.site-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* 讓網頁高度至少填滿螢幕 */
}

.main-content {
  flex: 1; /* 讓中間這塊自動長高，把 Footer 推到底部 */
  width: 100%;
  max-width: 1200px; /* 限制內容最大寬度 */
  margin: 0 auto; /* 讓內容置中 */
  padding: 20px;
  box-sizing: border-box;
}
</style>
