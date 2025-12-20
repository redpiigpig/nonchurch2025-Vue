<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import MainLayout from "../components/MainLayout.vue";
import { supabase } from "../supabase";

const route = useRoute();
const loading = ref(true);
const currentTheme = ref(null);

// 核心函式：根據網址決定要抓哪一期
const fetchThemeData = async () => {
  loading.value = true;
  currentTheme.value = null;

  try {
    let query = supabase
      .from("issues")
      .select("id, title, date, cfp_title, cfp_theme, cfp_deadline, cfp_image");

    if (route.params.issueNumber) {
      // 指定期數
      query = query.eq("id", route.params.issueNumber);
    } else {
      // 預設抓最新一期 (必須有 cfp_title)
      query = query.not("cfp_title", "is", null).order("id", { ascending: false }).limit(1);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (data && data.length > 0) {
      currentTheme.value = data[0];
    }
  } catch (err) {
    console.error("Error fetching submission theme:", err.message);
  } finally {
    loading.value = false;
  }
};

// 輔助：將資料庫文章依換行符號切割成陣列，確保每一段都能正確縮排
const themeParagraphs = computed(() => {
  if (!currentTheme.value || !currentTheme.value.cfp_theme) return [];
  // 濾掉純空白行
  return currentTheme.value.cfp_theme.split("\n").filter((p) => p.trim() !== "");
});

watch(
  () => route.params.issueNumber,
  () => {
    fetchThemeData();
  }
);

onMounted(() => {
  fetchThemeData();
});
</script>

<template>
  <MainLayout>
    <h1 class="page-main-title">
      <span class="emoji">📬</span>投稿資訊<span class="emoji">📬</span>
    </h1>

    <div class="main-divider"></div>

    <section class="section-text">
      <p>
        《無境界者》雜誌是一個不以教會為本位的自由信仰論述平台，亦是一個實驗性質的線上雜誌，會定期在雙數月月底發刊。每一期皆會有一個當期主題，投稿者可以按照當期主題投稿，也可以自由發揮。
      </p>
    </section>

    <div v-if="loading" class="status-msg">正在載入徵稿資訊...</div>

    <div v-else-if="!currentTheme" class="status-msg">目前尚無徵稿資訊。</div>

    <section id="theme" v-else>
      <h3>☆下期徵稿主題</h3>
      <div class="theme-block">
        <h4 class="theme-date">{{ currentTheme.date }} (第 {{ currentTheme.id }} 期)</h4>

        <h4 class="theme-title">徵稿主題：《{{ currentTheme.cfp_title }}》</h4>

        <div class="theme-image" v-if="currentTheme.cfp_image">
          <img :src="currentTheme.cfp_image" :alt="currentTheme.cfp_title" />
        </div>

        <div class="theme-description">
          <p v-for="(para, index) in themeParagraphs" :key="index">
            {{ para }}
          </p>
        </div>

        <p class="deadline">📌 截稿期限：{{ currentTheme.cfp_deadline }}</p>
      </div>
    </section>

    <section id="types">
      <h3>☆投稿類型</h3>
      <div class="theme-block">
        <div class="type-item">
          <div class="type-block red">專題文章</div>
          <p class="type-description">
            探討當期主題或其他議題的學術性或半學術性文章，約1,000-6,000字。
          </p>
        </div>
        <div class="type-item">
          <div class="type-block orange">評論與回應</div>
          <p class="type-description">
            針對具有信仰啟發性的書籍、文章進行評論，或回應本刊及其他信仰刊物的文章。約500-6,000字。
          </p>
        </div>
        <div class="type-item">
          <div class="type-block yellow">人物專訪</div>
          <p class="type-description">
            訪談對台灣教會史具獨特意義的人物，或針對特殊議題採訪重要人物並記錄其見解。約2,000-12,000字。
          </p>
        </div>
        <div class="type-item">
          <div class="type-block green">生命故事</div>
          <p class="type-description">
            個人生命經歷、日常信仰體悟，或參與活動的心得分享。約500-6,000字。
          </p>
        </div>
        <div class="type-item">
          <div class="type-block blue">時事感想</div>
          <p class="type-description">
            對政治、社會、文化、教界時事的感想，或書寫時事對信仰的啟發。約500-6,000字。
          </p>
        </div>
        <div class="type-item">
          <div class="type-block indigo">文藝創作</div>
          <p class="type-description">
            與信仰相關的詩詞、散文、短篇小說、歌詞、樂譜、圖畫等創作。格式、篇幅不限，但篇幅過長者建議以連載形式投稿。字數不限。
          </p>
        </div>
        <div class="type-item">
          <div class="type-block purple">公告與剪影</div>
          <p class="type-description">
            友好團體活動公告或活動紀錄，可附海報、照片或相關連結。約500-2,000字。
          </p>
        </div>
        <div class="type-item">
          <div class="type-block soil">光影時刻</div>
          <p class="type-description">
            以照片講述信仰故事，最多5張照片。若符合當期主題，投稿作品亦可能被選為封面故事。文字500字以下。
          </p>
        </div>
        <div class="type-item">
          <div class="type-block pink">實驗園地</div>
          <p class="type-description">
            各類實驗性創作，格式不拘，投稿前請先與編輯聯絡討論。字數不限。
          </p>
        </div>
      </div>
    </section>

    <section id="guidelines">
      <h3>☆投稿方式</h3>
      <p>
        欲投稿之作者，請按網頁下方的「我要投稿」，或者逕行投稿至
        <a href="mailto:nonchurch2025@gmail.com">nonchurch2025@gmail.com</a
        >，作品可匿名刊登，但投稿時仍須在電子郵件中附上真實姓名。初次投稿本刊物的作者請附上100-150字的信仰經歷簡介。
      </p>
      <p>
        《無境界者》雜誌是一個在網路上公開的非營利平台，故在此發表之作品皆視為公開發表，且恕無法提供稿酬。
      </p>
      <p>
        投稿至《無境界者》雜誌之作品，可以是原創作品或已公開發表過的作品（已在網路或其他紙本上發表過之文章、過期演講稿），但若對其他書籍、刊物有侵權之嫌，作者需自負全責，本刊物亦不為任何作者之信仰論述背書。
      </p>
      <p>
        若是學術性文章，文史類文章註腳格式採用
        <a href="#">《國史館館刊》寫作格式</a>；社會科學類文章註腳格式採用
        <a href="#">《臺灣宗教研究》撰稿體例</a>。
      </p>
      <p>
        每一期的截稿期限為單數月月底（刊登的一個月前），投稿時請標明投稿的期數，但如果非與當期主題相關之文章，本刊編輯可視文章數量進行調動。
      </p>
      <p>
        本刊編輯原則上會盡可能維持作品原貌，僅就錯別字、語詞誤用、格式調整等方面進行校對，也會在校對過程中與原作者協議，但本刊物具有最終編輯權。
      </p>
      <p>
        若投稿作品不符合本刊物目前的需求，或者須大幅調整者，編輯會在退稿時附上說明，但本刊物對於作品的刊登與否具有最終裁量權。
      </p>
      <p>
        若對於本刊物的信仰特色、投稿規範有任何疑問者，也歡迎先寄信至
        <a href="mailto:nonchurch2025@gmail.com">nonchurch2025@gmail.com</a>詢問。
      </p>
    </section>

    <div class="main-divider"></div>

    <section id="submit">
      <h2>投稿專區</h2>
      <p class="no-indent">有精彩內容想分享嗎？點擊下方按鈕立即投稿！</p>
      <a href="https://forms.gle/wDxBRbGAorTTJqeJ9" class="submit-button" target="_blank"
        >我要投稿</a
      >
    </section>
  </MainLayout>
</template>

<style scoped>
@import "@/assets/base.css";

/* ==========================
  全域設定：強制縮排 2rem
========================== */
p {
  text-indent: 2rem;
  line-height: 1.8;
  color: #444;
  margin-bottom: 1rem;
  text-align: justify;
}

/* 特例：不縮排的文字 */
.no-indent,
.deadline {
  text-indent: 0 !important;
}

/* ==========================
  標題樣式
========================== */
.main-divider {
  width: 100%;
  height: 4px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 20px auto;
}

h2 {
  text-align: center;
  color: #444;
  margin: 1rem 0;
}

h3 {
  text-align: left;
  text-indent: 0;
  font-weight: bold;
  color: #333;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

/* ==========================
  徵稿主題 & 投稿類型 共用容器 
========================== */
.theme-block {
  background-color: rgba(255, 255, 255, 0.6);
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 2rem;
}

/* 徵稿主題內容 */
.theme-date {
  color: #666;
  font-weight: normal;
  margin-bottom: 5px;
  text-align: left;
}

.theme-title {
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #333;
}

.theme-image {
  text-align: center;
  margin-bottom: 1rem;
}

.theme-image img {
  max-width: 100%;
  height: auto;
  max-height: 600px;
  border-radius: 5px;
  display: block;
  margin: 0 auto;
}

.deadline {
  text-align: right;
  font-weight: bold;
  margin-top: 1rem;
}

/* ==========================
  投稿類型列表
========================== */
.type-item {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #eee;
}

.type-item:last-child {
  border-bottom: none;
}

.type-block {
  width: 120px;
  height: 40px;
  color: white;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 20px;
  flex-shrink: 0;
  margin-right: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-size: 0.95rem;
}

.type-description {
  margin: 0;
  color: #555;
  line-height: 1.6;
  text-align: justify;
  text-indent: 0 !important; /* 類型描述若不希望縮排可保留此行，若要縮排請移除 */
}

/* ⭐ 顏色分類 (依照您提供的色碼) */
.type-block.red {
  background-color: #8b0000;
} /* 深紅 */
.type-block.orange {
  background-color: #ff8000;
} /* 深橙 */
.type-block.yellow {
  background-color: #b8860b;
} /* 深黃 */
.type-block.green {
  background-color: #46b175;
} /* 淺綠 */
.type-block.blue {
  background-color: #4682b4;
} /* 深藍 */
.type-block.indigo {
  background-color: #27408b;
} /* 靛藍 */
.type-block.purple {
  background-color: #6a5acd;
} /* 深紫 */
.type-block.soil {
  background-color: #7d6c29;
} /* 土黃 - 替換原有的 grass */
.type-block.pink {
  background-color: #db7093;
} /* 粉紅 */

/* ==========================
  連結樣式
========================== */
a {
  color: #0275d8;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}

/* ==========================
  投稿按鈕區
========================== */
#submit {
  text-align: center;
  padding: 20px 0;
  margin-top: -1rem;
}

#submit h2 {
  text-align: center;
}

.submit-button {
  display: inline-block;
  padding: 15px 60px;
  background-color: #5cb85c;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  border-radius: 50px;
  transition: transform 0.2s, background-color 0.2s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-top: 1rem;
}

.submit-button:hover {
  background-color: #4cae4c;
  transform: translateY(-3px);
  text-decoration: none;
}

.status-msg {
  text-align: center;
  padding: 20px;
  font-size: 1.2rem;
  color: #666;
  text-indent: 0 !important;
}

/* ==========================
  RWD 適配
========================== */
@media (max-width: 768px) {
  .type-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .type-block {
    margin-bottom: 10px;
  }
}
</style>
