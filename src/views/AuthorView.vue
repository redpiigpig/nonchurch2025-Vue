<script setup>
import { ref, watch, onMounted } from "vue";
import MainLayout from "../components/MainLayout.vue";
// 1. 移除本地資料 import
// import { authors } from "../data/authors.js";
// 2. 改為引入 Supabase
import { supabase } from "../supabase";

const selectedYear = ref(2025);
const yearOptions = [
  { value: 2026, label: "2026 年專欄作者" },
  { value: 2025, label: "2025 年專欄作者" },
];

// 用來存從資料庫抓回來的所有原始資料
const allAuthors = ref([]);
// 用來存過濾並隨機排序後的顯示資料
const randomizedAuthors = ref([]);
const isLoading = ref(true); // 增加一個讀取狀態

// 從 Supabase 抓取資料
const fetchAuthors = async () => {
  try {
    isLoading.value = true;
    const { data, error } = await supabase
      .from("authors")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;

    if (data) {
      allAuthors.value = data;
      // 資料抓回來後，立刻執行一次過濾與排序
      updateAuthors();
    }
  } catch (error) {
    console.error("Error fetching authors:", error.message);
  } finally {
    isLoading.value = false;
  }
};

const updateAuthors = () => {
  // 改為從 allAuthors (資料庫資料) 進行過濾
  // 資料庫的 years 欄位是陣列 (integer[])，JS 裡直接用 includes 即可
  const filtered = allAuthors.value.filter((a) => a.years && a.years.includes(selectedYear.value));

  const newArr = [...filtered];
  // 洗牌演算法 (Fisher-Yates Shuffle)
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }

  randomizedAuthors.value = newArr;
};

watch(selectedYear, () => {
  updateAuthors();
});

onMounted(() => {
  document.title = "專欄作者 - 無境界者雜誌";
  // 啟動抓取資料
  fetchAuthors();
});
</script>

<template>
  <MainLayout>
    <div class="authors-page">
      <h1 class="page-main-title">
        <span class="emoji">✍️</span>專欄作者<span class="emoji">✍️</span>
      </h1>

      <div class="main-divider"></div>

      <div class="year-selector-wrapper">
        <label for="year-select">選擇年份：</label>
        <div class="custom-select">
          <select id="year-select" v-model="selectedYear">
            <option v-for="item in yearOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
          <span class="arrow">▼</span>
        </div>
      </div>

      <div v-if="isLoading" class="loading-state">
        <p>正在載入作者資料...</p>
      </div>

      <div v-else-if="randomizedAuthors.length === 0" class="no-data">
        <p>尚無 {{ selectedYear }} 年的專欄作者資料，敬請期待。🥺</p>
      </div>

      <div v-else class="authors-list">
        <div v-for="author in randomizedAuthors" :key="author.id" class="author-box">
          <div class="author-info">
            <div
              class="author-image"
              :style="{ backgroundImage: `url(${author.author_image})` }"
              role="img"
              :aria-label="author.name"
            ></div>
            <h2>{{ author.name }}</h2>
          </div>

          <div class="author-bio">
            <p>{{ author.bio }}</p>
            <router-link :to="`/authors/${author.id}`" class="read-more-btn">
              閱讀此作者文章
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped>
@import "@/assets/base.css";

/* 增加一個簡單的 Loading 樣式 */
.loading-state {
  text-align: center;
  font-size: 1.2rem;
  color: #666;
  margin: 40px 0;
}

.authors-list {
  max-width: 1100px;
  margin: 0 auto;
}

.author-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px auto;
  padding: 30px;

  background-color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);

  max-width: 900px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.author-box:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  background-color: rgba(255, 255, 255, 0.9);
}

.author-info {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.author-image {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  margin-right: 20px;
  background-color: #e0e0e0;
  background-size: cover;
  background-position: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.author-info h2 {
  font-size: 1.5rem;
  margin: 0;
  color: #333;
  padding-right: 40px;
  font-weight: bold;
  font-family: "Times New Roman", serif;
  white-space: nowrap;
}

.author-bio {
  flex: 1;
  text-align: left;
  position: relative;
  padding-bottom: 25px;
  min-height: 80px;
}

.author-bio p {
  margin: 0 0 10px;
  color: #555;
  line-height: 1.6;
  font-family: serif;
  font-size: 1.15rem;
  text-align: justify;
  white-space: pre-line;
}

.read-more-btn {
  position: absolute;
  bottom: -5px;
  right: 0;
  color: #4caf50;
  text-decoration: none;
  font-weight: bold;
  font-family: "Times New Roman", serif;
  transition: color 0.3s;
}

.read-more-btn:hover {
  color: #2e7d32;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .author-box {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px;
  }

  .author-info {
    flex-direction: column;
    align-items: center;
    margin-bottom: 1rem;
    width: 100%;
    border-bottom: 1px dashed #ccc;
    padding-bottom: 1rem;
  }

  .author-image {
    width: 160px;
    height: 160px;
    margin-right: 0;
    margin-bottom: 10px;
  }

  .author-info h2 {
    padding-right: 0;
    font-size: 1.6rem;
    white-space: normal;
  }

  .author-bio {
    width: 100%;
    text-align: left;
    padding-bottom: 0;
    min-height: auto;
  }

  .read-more-btn {
    position: static;
    display: block;
    margin-top: 1rem;
    text-align: right;
    font-size: 1.1rem;
  }
}
</style>
