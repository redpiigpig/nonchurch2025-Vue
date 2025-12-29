<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useEditorMode } from "../composables/useEditorMode";

const route = useRoute();
const { isEditor } = useEditorMode();
const isEditMode = computed(() => isEditor.value);

// 導覽列連結生成器：前台維持原樣，後台加 /admin
const getLink = (path) => {
  if (isEditMode.value) {
    return `/admin${path}`;
  }
  return path;
};

// ⭐ 鏡像切換按鈕邏輯 (保持您原本的邏輯)
const editLink = computed(() => {
  const currentPath = route.path;

  // A. 文章詳情 -> 編輯器
  if (!isEditMode.value && route.name === "article-detail" && route.params.id) {
    return `/admin/editor/${route.params.id}`;
  }
  // B. 編輯器 -> 文章詳情
  if (
    isEditMode.value &&
    (route.name === "admin-editor-edit" || route.name === "admin-editor-new")
  ) {
    return route.params.id ? `/articles/${route.params.id}` : "/articles";
  }

  // C. 一般頁面切換 (/mission <-> /admin/mission)
  if (isEditMode.value) {
    return currentPath.replace(/^\/admin/, "") || "/home";
  } else {
    // 如果在首頁，要去的後台對應頁是 /admin/home (鏡像首頁)，不是 /admin (管理後台)
    return currentPath === "/" ? "/admin/home" : `/admin${currentPath}`;
  }
});
</script>

<template>
  <header :class="['header', { 'editor-header': isEditMode }]">
    <nav class="nav">
      <div class="logo">
        <RouterLink :to="isEditMode ? '/admin/home' : '/home'">
          <img
            src="https://pottupypvdzamztdhsah.supabase.co/storage/v1/object/public/images/system/Header_Logo.png"
            alt="Logo"
            class="logo-icon"
          />
          <img
            src="https://pottupypvdzamztdhsah.supabase.co/storage/v1/object/public/images/system/Header_text.png"
            alt="無境界者"
            class="logo-text"
          />
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

        <RouterLink :to="getLink('/search')" class="search-icon-btn" title="搜尋">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </RouterLink>
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
  position: sticky;
  top: 0;
  z-index: 1000;
  transition: all 0.3s ease;
  font-size: 20px;
  display: flex;
  align-items: center;
}

/* ⭐ 修改處：後台模式 (editor-header) 增加左側內距，將內容往右推 2rem */
.header.editor-header {
  background: linear-gradient(135deg, #2c3e50, #4ca1af);
  padding-left: calc(20px);
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
  align-items: center;
  margin-right: 2rem;
}

.editor-header .menu {
  margin-right: -2rem;
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

.search-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px !important;
}
.search-icon-btn svg {
  width: 22px;
  height: 22px;
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
@media (max-width: 1024px) {
  .menu {
    gap: 10px;
    margin-right: 3rem;
  }
}
@media (max-width: 768px) {
  .header {
    height: auto;
    padding: 10px 15px;
    font-size: 16px;
    display: block;
    position: sticky;
    top: 0;
  }
  /* 手機版移除額外的 padding，避免擠壓 */
  .header.editor-header {
    padding-left: 15px;
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
    margin-right: 0;
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
    top: 30%;
  }
}
</style>
