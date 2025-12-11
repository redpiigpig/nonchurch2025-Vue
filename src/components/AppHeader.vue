<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

// 【核心邏輯】決定編輯按鈕要連去哪
const editLink = computed(() => {
  if (route.name === "article-detail" && route.params.id) {
    return `/admin/editor/${route.params.id}`;
  }
  return "/admin/editor";
});
</script>

<template>
  <header class="header">
    <nav class="nav">
      <div class="logo">
        <img src="/images/system/封面Logo.png" alt="Logo" class="logo-icon" />
        <img src="/images/system/封面題字.png" alt="無境界者" class="logo-text" />
      </div>
      <div class="menu">
        <RouterLink to="/home">首頁</RouterLink>
        <RouterLink to="/mission">使命宣言</RouterLink>
        <RouterLink to="/articles">文章列表</RouterLink>
        <RouterLink to="/authors">專欄作者</RouterLink>
        <a href="https://forms.gle/aWSBFRfQ74QY13nw8" target="_blank">線上訂閱</a>
        <RouterLink to="/submit">投稿資訊</RouterLink>
      </div>
    </nav>
    <router-link :to="editLink" class="header-edit-btn" title="進入編輯模式"> ✎ </router-link>
  </header>
</template>

<style scoped>
.header {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.95), rgba(129, 199, 132, 0.95));
  height: 80px;
  width: 100%-20px;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1000;
  transition: all 0.3s ease;
  font-size: 20px;
}

.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px;
}

.logo-icon {
  width: 70px;
  height: 70px;
  object-fit: contain;
  margin-right: -20px;
}

.logo-text {
  width: 200px;
  height: 60px;
  object-fit: contain;
}

.menu {
  display: flex;
  gap: 20px;
}

.menu a {
  text-decoration: none;
  color: white;
  padding: 5px 10px;
  transition: all 0.3s ease;
  border-radius: 5px;
}

.menu a:hover {
  color: #1b5e20;
}

.header-edit-btn {
  position: absolute; /* 絕對定位 */
  top: 25%; /* 垂直置中 */
  right: 20px; /* 靠右 20px */
  transform: translateY(-50%); /* 修正垂直置中 */

  /* 外觀設定 */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  text-decoration: none;
  font-size: 1.2rem;

  background-color: rgba(0, 0, 0, 0.6);
  color: white;

  transition: all 0.3s ease;
  z-index: 100;
}

.header-edit-btn:hover {
  background-color: #007bff; /* 滑鼠移過去變藍色 */
  transform: translateY(-50%) scale(1.1); /* 稍微放大 */
}

/* ==========================
   RWD 
========================== */

@media (max-width: 1024px) {
  .menu {
    gap: 10px;
  }
}

@media (max-width: 768px) {
  .header {
    width: 100%;
    height: auto;
    padding: 10px;
    font-size: 16px;
  }

  .nav {
    flex-direction: column;
    align-items: flex-start;
  }

  .menu {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 10px;
    margin-top: 10px;
    -webkit-overflow-scrolling: touch;
    width: 100%;
    padding-bottom: 5px;
  }

  .menu a {
    flex: 0 0 auto;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    white-space: nowrap;
  }

  .header-edit-btn {
    width: 35px;
    height: 35px;
    font-size: 1rem;
    right: 15px;
  }
}
</style>
