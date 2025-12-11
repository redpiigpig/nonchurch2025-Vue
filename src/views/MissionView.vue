<script setup>
import { useRoute } from "vue-router";
// 1. 取得目前的網址資訊
const route = useRoute();
</script>

<template>
  <div class="article-container">
    <h1>文章閱讀頁</h1>
    <p>
      正在閱讀的文章 ID 是：<span class="highlight">{{ route.params.id }}</span>
    </p>

    <div class="content-placeholder">(這裡未來會顯示 Markdown 的文章內容)</div>
  </div>
</template>

<style scoped>
.article-container {
  padding: 40px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  max-width: 800px;
  margin: 0 auto;
}

.highlight {
  color: #e60000;
  font-weight: bold;
  background-color: #fff0f0;
  padding: 2px 5px;
  border-radius: 4px;
}

.content-placeholder {
  margin-top: 30px;
  padding: 50px;
  background-color: #f9f9f9;
  text-align: center;
  color: #888;
  border: 2px dashed #ddd;
}
</style>
