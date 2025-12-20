<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="logo">無境界者 後台</div>
      <nav>
        <router-link to="/admin/issues">📅 期刊發布</router-link>
        <router-link to="/admin/articles">📝 文章管理</router-link>
        <router-link to="/admin/authors">🧑‍🏫 作者管理</router-link>
        <router-link to="/admin/editor">✏️ 寫新文章</router-link>
      </nav>
      <div class="bottom-actions">
        <router-link to="/home" class="btn-home">🏠 回前台</router-link>
        <button @click="handleLogout" class="btn-logout">登出</button>
      </div>
    </aside>

    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  font-family: sans-serif;
}

/* ============================
   電腦版樣式 (Desktop)
   ============================ */
.sidebar {
  width: 250px;
  /* 背景色維持深藍色，與編輯模式 Header (#2c3e50) 融合 */
  background: #2c3e50;
  color: white;

  display: flex;
  flex-direction: column;

  /* ⭐ 關鍵修改 1：直接頂到最上面 */
  position: fixed;
  left: 0;
  top: 0;

  /* ⭐ 關鍵修改 2：高度佔滿全螢幕 */
  height: 100vh;

  /* ⭐ 關鍵修改 3：上方增加內距，把選單往下推，才不會被 Header 擋住 */
  /* 120px (Header高度) + 20px (原本的 padding) = 140px */
  padding: 140px 20px 20px 20px;

  /* 確保層級比 Header (1000) 低，這樣 Header 會蓋在它上面 */
  z-index: 900;
  overflow-y: auto;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 30px;
  text-align: center;
  border-bottom: 1px solid #34495e;
  padding-bottom: 20px;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

nav a {
  color: #b8c7ce;
  text-decoration: none;
  padding: 12px 15px;
  border-radius: 5px;
  transition: 0.3s;
}

nav a:hover,
nav a.router-link-active {
  background: #1a252f;
  color: white;
}

.bottom-actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-home {
  text-align: center;
  background: #34495e;
  color: white;
  text-decoration: none;
  padding: 10px;
  border-radius: 5px;
}

.btn-logout {
  padding: 10px;
  background: #c0392b;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 5px;
}
.btn-logout:hover {
  background: #e74c3c;
}

.content {
  flex: 1;
  padding: 40px;
  background: #f4f6f9;

  /* 內容區塊保持左邊距，避開側邊欄 */
  margin-left: 250px;
  min-height: 100vh;
}

/* ============================
   手機版樣式 (Mobile < 768px)
   ============================ */
@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }

  .sidebar {
    /* 手機版維持靜態流動 */
    position: static;
    width: 100%;
    height: auto;
    top: auto;

    /* 手機版不需要這麼大的 padding-top，因為 Header 在它上面 */
    padding: 20px;

    flex-direction: column;
  }

  .logo {
    display: none;
  }

  .content {
    margin-left: 0;
    padding: 20px;
  }
}
</style>
