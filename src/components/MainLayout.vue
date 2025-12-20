<template>
  <div class="main-layout-container">
    <slot></slot>
  </div>
</template>

<style scoped>
.main-layout-container {
  /* 1. 統一的定位與間距 */
  max-width: 80%; /* 預設寬度 */
  margin: 80px auto; /* ⭐ 統一距離頂部 80px，解決高低不一的問題 */
  padding: 50px 60px; /* 統一內距 */

  /* 2. 統一的視覺風格 (玻璃擬態) */
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  min-height: 600px;
  box-sizing: border-box;
}

/* 3. 統一的 RWD 響應式規則 */

@media (max-width: 1024px) {
  .main-layout-container {
    max-width: 95%;
    padding: 30px; /* 平板縮小內距 */
  }
}

@media (max-width: 768px) {
  .main-layout-container {
    max-width: 90%;
    margin: 40px auto;
    padding: 20px;
  }
}
</style>
