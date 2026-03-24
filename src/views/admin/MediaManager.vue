<script setup>
// 已經不需要任何複雜的邏輯與 Supabase 綁定，純粹作為引導頁面
const openCloudinary = () => {
  // 直接開新分頁連往 Cloudinary 登入頁面
  window.open("https://cloudinary.com/users/login", "_blank");
};
</script>

<template>
  <div class="media-manager-guide">
    <div class="guide-container">
      <div class="icon-header">☁️</div>
      <h2>媒體庫已全面升級至 Cloudinary</h2>
      <p class="desc">
        為提供讀者更快、更穩定的圖片與 PDF 載入速度，我們的靜態檔案已經搬遷至專業雲端平台。<br />
        請點擊下方按鈕前往 Cloudinary 後台進行上傳、管理與網址複製。
      </p>

      <button class="btn-primary" @click="openCloudinary">🚀 前往 Cloudinary 媒體庫</button>

      <div class="sop-card">
        <h3>📝 編輯助理操作指南 (SOP)</h3>
        <ol>
          <li>
            <strong>登入平台：</strong>點擊上方按鈕，使用《無境界者》專屬帳號登入 Cloudinary。
          </li>
          <li>
            <strong>上傳檔案：</strong>進入左側的
            <code>Media Library (Folders)</code>，找到對應的期數資料夾（如
            <code>articles/issue-8</code>），將電腦中的圖片拖曳上傳。
          </li>
          <li>
            <strong>複製網址：</strong>上傳完成後，將滑鼠移到該圖片上，點擊
            <code>&lt; &gt;</code> (Copy URL) 圖示，即可複製圖片網址。
          </li>
          <li>
            <strong>貼入文章：</strong
            >回到「新增文章」頁面，點擊插入圖片的按鈕，將剛才複製的網址貼上即可。
          </li>
        </ol>
        <div class="warning-box">
          ⚠️ <strong>系統警告：</strong>請務必將檔案上傳至正確的分類資料夾。切勿更動或刪除
          <code>system</code>（網站系統圖）或
          <code>authors</code>（作者大頭貼）資料夾內的原始檔案，以免導致前台網站破圖。
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.media-manager-guide {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 60px);
  background-color: #f4f6f9;
  padding: 40px 20px;
}

.guide-container {
  background: white;
  max-width: 800px;
  width: 100%;
  border-radius: 12px;
  padding: 50px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid #eee;
}

.icon-header {
  font-size: 5rem;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

h2 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.8rem;
  font-weight: bold;
}

.desc {
  color: #666;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 40px;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
  margin-bottom: 50px;
}

.btn-primary:hover {
  background: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
}

.sop-card {
  background: #f8f9fa;
  text-align: left;
  padding: 30px;
  border-radius: 10px;
  border-left: 5px solid #28a745;
}

.sop-card h3 {
  margin-top: 0;
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.3rem;
}

.sop-card ol {
  padding-left: 20px;
  margin-bottom: 25px;
}

.sop-card li {
  margin-bottom: 12px;
  line-height: 1.6;
  color: #444;
  font-size: 1.05rem;
}

.warning-box {
  background: #fff3cd;
  color: #856404;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #ffeeba;
  font-size: 0.95rem;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .guide-container {
    padding: 30px 20px;
  }
  .icon-header {
    font-size: 4rem;
  }
  h2 {
    font-size: 1.5rem;
  }
}
</style>
