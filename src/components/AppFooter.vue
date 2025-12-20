<script setup>
const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="app-footer">
    <p class="footer-note">Copyright © {{ currentYear }} 無境界者雙月刊 All rights reserved.</p>
  </footer>
</template>

<style scoped>
/* ⭐ 關鍵修正 */
*,
*::before,
*::after {
  box-sizing: border-box;
}

.app-footer {
  background-color: #f1f1f1;
  text-align: center;
  height: 70px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%; /* 加上 box-sizing 後，這行就安全了 */
  /* margin-bottom: -10px;  <-- 建議移除這行，負邊距有時也會造成版面問題 */
}

.footer-note {
  margin: 10px 0;
  font-size: 20px;
  color: #444;
}

@media (max-width: 768px) {
  .app-footer {
    height: auto;
    padding: 20px 10px; /* 增加上下 padding 比較好看，且不會撐爆寬度 */
    line-height: 1.4;
  }

  .footer-note {
    padding: 0; /* 移除原本奇怪的 padding-right */
    font-size: 14px; /* 手機版字體再小一點 */
  }
}
</style>
