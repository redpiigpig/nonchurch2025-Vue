<script setup>
// 自動抓取年份
const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="app-footer">
    <p class="footer-note">Copyright © {{ currentYear }} 無境界者雙月刊 All rights reserved.</p>
  </footer>
</template>

<style scoped>
.app-footer {
  background-color: #f1f1f1;
  text-align: center;
  height: 70px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: -10px;
  width: 100%;
}

.footer-note {
  margin-top: 10px;
  margin-bottom: 10px;
  font-size: 1rem;
  color: #444;
  font-size: 20px;
}

/* ==========================
   RWD 
========================== */
@media (max-width: 768px) {
  .app-footer {
    text-align: center;
    padding: 10px;
    height: auto;
    line-height: 1.4;
    white-space: normal;
  }

  .footer-note {
    padding-right: 30px;
    margin-bottom: 0;
    font-size: 16px;
  }
}
</style>
