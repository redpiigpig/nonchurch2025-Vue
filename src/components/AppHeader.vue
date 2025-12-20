<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useEditorMode } from "../composables/useEditorMode";

const route = useRoute();
const { isEditor } = useEditorMode();

const getLink = (path) => {
  // 如果目前是「編輯模式」，就要把目標路徑改成後台路徑
  if (isEditMode.value) {
    // 例如：前台是 /home，後台要對應到 /admin/home
    // (你的 Router 設定裡，後台的 home 是在 children: [ { path: 'home' } ] )
    return `/admin${path}`;
  }

  // 如果是前台，就維持原樣
  return path;
};
const isEditMode = computed(() => isEditor.value);

// ⭐ 核心修正：聰明的鏡像路徑切換
const editLink = computed(() => {
  const currentPath = route.path;

  // 情況 A：如果正在看某篇文章，按筆要進入「文章編輯器」
  if (!isEditMode.value && route.name === "article-detail" && route.params.id) {
    return `/admin/editor/${route.params.id}`;
  }

  // 情況 B：如果在編輯器裡面，按地球要回到「文章前台」
  if (
    isEditMode.value &&
    (route.name === "admin-editor-edit" || route.name === "admin-editor-new")
  ) {
    // 如果有 id 就回該文章，沒 id 就回列表
    return route.params.id ? `/articles/${route.params.id}` : "/articles";
  }

  // 情況 C：一般頁面鏡像切換 (Mission -> Admin Mission)
  if (isEditMode.value) {
    // 後台 -> 前台：把 /admin 去掉
    // 例如 /admin/mission -> /mission
    return currentPath.replace(/^\/admin/, "") || "/home";
  } else {
    // 前台 -> 後台：加上 /admin
    // 例如 /mission -> /admin/mission
    // 根目錄特例處理
    return currentPath === "/" ? "/admin/home" : `/admin${currentPath}`;
  }
});
</script>

<template>
  <header :class="['header', { 'editor-header': isEditMode }]">
    <nav class="nav">
      <div class="logo">
        <RouterLink :to="isEditMode ? '/admin' : '/home'">
          <img src="/images/system/封面Logo.png" alt="Logo" class="logo-icon" />
          <img src="/images/system/封面題字.png" alt="無境界者" class="logo-text" />
          <span v-if="isEditMode" class="editor-badge">編輯模式</span>
        </RouterLink>
      </div>

      <div class="menu">
        <RouterLink v-if="isEditMode" to="/admin" class="admin-link">⚙️ 後台管理</RouterLink>

        <RouterLink :to="getLink('/home')">首頁</RouterLink>
        <RouterLink :to="getLink('/mission')">使命宣言</RouterLink>
        <RouterLink :to="getLink('/articles')">文章列表</RouterLink>
        <RouterLink :to="getLink('/authors')">專欄作者</RouterLink>
        <a href="https://forms.gle/aWSBFRfQ74QY13nw8" target="_blank">線上訂閱</a>
        <RouterLink :to="getLink('/submit')">投稿資訊</RouterLink>
      </div>
    </nav>

    <router-link
      :to="editLink"
      class="header-edit-btn"
      :title="isEditMode ? '返回前台' : '進入編輯模式'"
    >
      {{ isEditMode ? "🌏" : "✎" }}
    </router-link>
  </header>
</template>

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}

.header {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.95), rgba(129, 199, 132, 0.95));
  height: 120px;
  width: 100%;
  padding: 0 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);

  /* ⭐ 關鍵修改：改為 sticky 讓它黏在頂端 */
  position: sticky;
  top: 0;
  z-index: 1000; /* 確保它在最上層 */

  transition: all 0.3s ease;
  font-size: 20px;
  display: flex;
  align-items: center;
}

/* 編輯模式 Header 變色 */
.header.editor-header {
  background: linear-gradient(135deg, #2c3e50, #4ca1af);
}

.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
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

.editor-badge {
  color: #f1c40f;
  font-weight: bold;
  font-size: 0.9rem;
  border: 1px solid #f1c40f;
  padding: 2px 5px;
  border-radius: 4px;
  margin-left: 5px;
  align-self: start;
  margin-top: 10px;
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

.admin-link {
  background-color: rgba(255, 255, 255, 0.2);
  font-weight: bold;
}

.header-edit-btn {
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
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
  background-color: #007bff;
  transform: translateY(-50%) scale(1.1);
}

/* ==========================
   RWD 手機版
========================== */
@media (max-width: 1024px) {
  .menu {
    gap: 10px;
  }
}

@media (max-width: 768px) {
  .header {
    height: auto;
    padding: 10px 15px;
    font-size: 16px;
    display: block;

    /* 手機版依然保持 sticky，會很好用 */
    position: sticky;
    top: 0;
  }

  .nav {
    flex-direction: column;
    align-items: flex-start;
  }

  .logo {
    margin-bottom: 5px;
  }

  .logo-icon {
    width: 50px;
    height: 50px;
    margin-right: -10px;
  }
  .logo-text {
    width: 140px;
    height: 45px;
  }

  .menu {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 10px;
    margin-top: 5px;
    padding-bottom: 5px;
    width: 100%;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .menu::-webkit-scrollbar {
    display: none;
  }

  .menu a {
    flex: 0 0 auto;
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 15px;
    font-size: 0.95rem;
  }

  .header-edit-btn {
    display: none;
  }
}
</style>
