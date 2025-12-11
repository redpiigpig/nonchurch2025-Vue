<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router"; // 引入 useRouter 來換頁

const router = useRouter();
const searchQuery = ref("");
const searchType = ref("title");

// 修改後的搜尋函式：只負責跳轉頁面
const handleSearch = () => {
  if (!searchQuery.value.trim()) return;

  // 跳轉到 /search 頁面，並帶上參數
  // 網址會變成： /search?q=林貝克&type=title
  router.push({
    name: "search",
    query: {
      q: searchQuery.value,
      type: searchType.value,
    },
  });
};
</script>

<template>
  <div class="home-container">
    <section class="hero-section">
      <h2>歡迎來到無境界者雜誌</h2>
      <br />
      <p class="subtitle">打破藩籬，看見真實的信仰與肉身</p>
    </section>

    <div class="search">
      <h2>文章檢索</h2>
      <div class="search-info-box">💡 提示：支援模糊搜尋，請選擇欄位並輸入關鍵字。</div>
      <br />

      <div class="search-links">
        <a
          href="#"
          @click.prevent="
            searchQuery = '林貝克';
            searchType = 'title';
            handleSearch();
          "
          class="keyword-link"
          >#林貝克</a
        >
        <a
          href="#"
          @click.prevent="
            searchQuery = '身體';
            searchType = 'keyword';
            handleSearch();
          "
          class="keyword-link"
          >#身體經驗</a
        >
        <a
          href="#"
          @click.prevent="
            searchQuery = '後自由';
            searchType = 'content';
            handleSearch();
          "
          class="keyword-link"
          >#後自由神學</a
        >
      </div>

      <div class="search-box">
        <select v-model="searchType" class="search-select">
          <option value="title">搜尋文章標題</option>
          <option value="author">搜尋作者</option>
          <option value="content">搜尋文章全文</option>
          <option value="keyword">搜尋關鍵字</option>
        </select>

        <input
          v-model="searchQuery"
          @keyup.enter="handleSearch"
          type="text"
          placeholder="請輸入搜尋內容..."
          class="search-input"
        />

        <button @click="handleSearch" class="btn">搜尋</button>
      </div>
    </div>

    <div class="original-content">
      <slot name="original-home-content"></slot>
    </div>
  </div>
</template>

<style scoped>
/* 這裡的 CSS 保持您原本的樣式即可，完全不用動 */
/* ... (HomeView 的 style 貼在下面) ... */
.home-container {
  padding: 40px 20px;
}
.hero-section {
  text-align: center;
  margin-bottom: 60px;
}
.hero-section h2 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  color: #2c3e50;
}
.hero-section .subtitle {
  font-size: 1.2rem;
  color: #666;
}
.search {
  text-align: center;
  margin-bottom: 40px;
}
.search h2 {
  margin-bottom: 1rem;
  font-family: "Times New Roman", serif;
  color: #333;
}
.search-info-box {
  margin-top: 1rem;
  padding: 1rem;
  background-color: rgba(255, 165, 0, 0.2);
  border: 1px solid rgba(255, 165, 0, 0.5);
  border-radius: 10px;
  text-align: center;
  font-size: 1rem;
  color: #555;
  font-weight: bold;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}
.search-links {
  margin-bottom: 1.5rem;
}
.keyword-link {
  display: inline-block;
  margin: 0 0.5rem;
  font-size: 1.1rem;
  color: #007bff;
  text-decoration: none;
  transition: color 0.3s ease;
  font-family: "Times New Roman", serif;
}
.keyword-link:hover {
  color: #0056b3;
  text-decoration: underline;
}
.search-box {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.search-select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  height: 40px;
  cursor: pointer;
}
.search-input {
  width: 300px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  height: 40px;
  font-family: "Times New Roman", serif;
}
.btn {
  padding: 0 1.5rem;
  background-color: #28a745;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  height: 40px;
  line-height: 40px;
}
.btn:hover {
  background-color: #218838;
}
@media (max-width: 768px) {
  .search-input,
  .search-select,
  .btn {
    width: 100%;
  }
}
</style>
