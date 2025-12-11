<template>
  <div class="article-list-page">
    <div id="main-container">
      <h1 class="main-title">
        <span class="emoji">📚</span>
        文 章 列 表
        <span class="emoji">📚</span>
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

      <div v-if="filteredIssues.length === 0" class="no-data">
        <p>尚無 {{ selectedYear }} 年的雜誌資料，敬請期待。🥺</p>
      </div>

      <div
        v-else
        v-for="(issue, index) in filteredIssues"
        :key="issue.number"
        class="magazine-item"
      >
        <br />
        <h2 :id="`issue-${issue.number}`">
          <span>　　</span>第{{ issue.number }}期《{{ issue.title }}》
          <span class="issue-date">／{{ issue.date }}</span>
        </h2>

        <div class="content-wrapper">
          <div class="left-section">
            <ul>
              <li
                v-for="(item, itemIndex) in issue.content"
                :key="itemIndex"
                :class="{ 'no-bullet': item.type === 'header' }"
              >
                <div
                  v-if="item.type === 'header'"
                  class="title-box"
                  :class="{ 'only-line': !item.text }"
                >
                  <h3 :class="item.styleClass">{{ item.text }}</h3>
                </div>

                <p v-else-if="item.type === 'text'">
                  <span v-if="item.displayId" style="font-weight: bold">{{ item.displayId }}</span>
                  {{ item.text }}
                </p>

                <p v-else>
                  <span v-if="item.displayId" style="font-weight: bold; margin-right: 0.5em">
                    {{ item.displayId }}
                  </span>

                  <span
                    v-if="item.category"
                    class="article-type"
                    :style="{ color: item.color, marginRight: '0.5em', fontSize: '0.8em' }"
                  >
                    {{ item.category }}
                  </span>

                  <a v-if="item.isExternal" :href="item.link" target="_blank">{{ item.title }}</a>

                  <router-link v-else :to="`/articles/${item.routeId}`">
                    {{ item.title }}
                  </router-link>

                  <span v-if="item.author" class="author">｜{{ item.author }}</span>
                </p>
              </li>
            </ul>
          </div>

          <div class="right-section">
            <a :href="issue.pdfLink" target="_blank" title="點擊封面下載PDF檔">
              <img :src="issue.coverImg" :alt="`第${issue.number}期封面`" class="magazine-cover" />
            </a>
            <p class="cover-description">點擊封面下載PDF檔</p>
          </div>
        </div>

        <br /><br />

        <div v-if="index !== filteredIssues.length - 1" class="issue-divider"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";

// =========================
// 狀態管理：年份控制
// =========================
const selectedYear = ref(2025); // 預設顯示 2025

const yearOptions = [
  { value: 2026, label: "2026 年 (第 7-12 期)" }, // 未來新增這行即可
  { value: 2025, label: "2025 年 (第 1-6 期)" },
];

// =========================
// 計算屬性：篩選資料
// =========================
const filteredIssues = computed(() => {
  return issues.filter((issue) => issue.year === selectedYear.value);
});

// =========================
// 生命週期
// =========================
onMounted(() => {
  document.title = "文章列表 - 無境界者雜誌";

  const route = useRoute();
  if (route.hash) {
    const target = document.querySelector(route.hash);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  }
});

// ==============================================================================
// 資料區：已加上 year: 2025
// ==============================================================================
const issues = [
  {
    year: 2025, // ✅ 新增
    number: 5,
    title: "誕神者",
    date: "2025年09-10月號",
    coverImg: "/images/covers/cover-5.png",
    pdfLink: "https://drive.google.com/file/d/1T7I4xzKYDdj9fJg3GHowUOckkAVH9p4R/view?usp=sharing",
    content: [
      { displayId: "01", title: "編輯室報告", routeId: "5-1編輯室報告", author: "編輯室" },
      { displayId: "02", title: "本期作者簡介", routeId: "5-2本期作者簡介", author: "編輯室" },
      {
        displayId: "03",
        category: "封面故事",
        color: "#7d6c29",
        title: "她讓身體成為上主的居所",
        routeId: "5-3她讓身體成為上主的居所",
        author: "奧斯定",
      },

      { type: "header", text: "特稿專區", styleClass: "theme-title" },
      {
        displayId: "04",
        category: "專題文章",
        color: "#8b0000",
        title: "回應呼召的自由——路加福音中馬利亞的反覆思考與神學的邀請本質",
        routeId: "5-4回應呼召的自由",
        author: "劉玉雯",
      },
      {
        displayId: "05",
        category: "專題文章",
        color: "#8b0000",
        title: "淺談聖公會傳統中的聖母馬利亞",
        routeId: "5-5淺談聖公會傳統中的聖母馬利亞",
        author: "王彥軒牧師",
      },

      { type: "header", text: "主題廣場", styleClass: "theme-title" },
      {
        displayId: "06",
        category: "專題文章",
        color: "#8b0000",
        title: "正教會對聖母的理解——在順服與承載之中，讓上帝的道成於人身",
        routeId: "5-6正教會對聖母的理解",
        author: "奧斯定",
      },
      {
        displayId: "07",
        category: "生命故事",
        color: "#46b175",
        title: "誕神者——從榮格心理學看夢境中的自性重生",
        routeId: "5-7誕神者",
        author: "張辰瑋",
      },
      {
        displayId: "08",
        category: "生命故事",
        color: "#46b175",
        title: "我的大公派史——我的信仰史（四）",
        routeId: "5-8我的大公派史",
        author: "張辰瑋",
      },
      {
        displayId: "09",
        category: "專題文章",
        color: "#8b0000",
        title: "尼西亞基督教的形成——基督宗教宗派譜系學初探（一）",
        routeId: "5-9尼西亞基督教的形成",
        author: "張辰瑋",
      },
      {
        displayId: "10",
        category: "評論與回應",
        color: "#ff8000",
        title: "神學回應啟示的使命——回應張辰瑋〈尼西亞基督教的形成〉",
        routeId: "5-10神學回應啟示的使命",
        author: "奧斯定",
      },

      { type: "header", text: "多元講堂", styleClass: "diverse-title" },
      {
        displayId: "11",
        category: "專題文章",
        color: "#8b0000",
        title: "關於苦難——從混沌到實踐的信仰之旅",
        routeId: "5-11關於苦難",
        author: "毛毛",
      },
      {
        displayId: "12",
        category: "公告與剪影",
        color: "#6a5acd",
        title: "權力即知識——野橄欖神學社與後現代神學（四）",
        routeId: "5-12權力即知識",
        author: "金子煥",
      },
      {
        displayId: "13",
        category: "評論與回應",
        color: "#ff8000",
        title: "話語與肉身——簡評林貝克《教義的本質》",
        routeId: "5-13話語與肉身",
        author: "張辰瑋",
      },

      { type: "header", text: "", styleClass: "" },
      {
        displayId: "14",
        title: "投稿資訊／下期主題",
        link: "/submission",
        isExternal: false,
        routeId: null,
      },
      { displayId: "15", type: "text", text: " 編輯資訊／線上資訊" },
    ],
  },
  {
    year: 2025, // ✅ 新增
    number: 4,
    title: "跨界的酷兒與跨宗教的友誼",
    date: "2025年07-08月號",
    coverImg: "/images/covers/cover-4.png",
    pdfLink: "https://drive.google.com/file/d/1jv7_Mw3sVGjB6pMm3dbIpXKLivVILZtH/view?usp=sharing",
    content: [
      { displayId: "01", title: "編輯室報告", routeId: "4-1編輯室報告", author: "編輯室" },
      { displayId: "02", title: "本期作者簡介", routeId: "4-2本期作者簡介", author: "編輯室" },
      {
        displayId: "03",
        category: "封面故事",
        color: "#7d6c29",
        title: "佛陀座下的泰澤祈禱",
        routeId: "4-3佛陀座下的泰澤祈禱",
        author: "曾櫳震",
      },

      { type: "header", text: "特稿專區", styleClass: "theme-title" },
      {
        displayId: "04",
        category: "人物專訪",
        color: "#f0e137",
        title: "拆毀信仰與性別的藩籬──昭慧法師訪談記",
        routeId: "4-4拆毀信仰與性別的藩籬",
        author: "昭慧法師",
      },
      {
        displayId: "05",
        category: "人物專訪",
        color: "#f0e137",
        title: "建立在愛與公義中的跨界友誼──盧俊義牧師訪談記",
        routeId: "4-5建立在愛與公義中的跨界友誼",
        author: "盧俊義牧師",
      },

      { type: "header", text: "主題廣場", styleClass: "theme-title" },
      {
        displayId: "06",
        category: "公告與剪影",
        color: "#6a5acd",
        title: "酷兒×宗教的跨界友誼──2025第二屆性別友善自在營營會側記",
        routeId: "4-6酷兒×宗教的跨界友誼",
        author: "邱詠恩",
      },
      {
        displayId: "07",
        category: "公告與剪影",
        color: "#6a5acd",
        title: "會於蘭亭，和而不同──2025第二屆性別友善自在營營後迴響與討論",
        routeId: "4-7會於蘭亭，和而不同",
        author: "曾櫳震、林帛諺、劉子榮、吳曙帆、羅駿騏",
      },
      {
        displayId: "08",
        category: "專題文章",
        color: "#8b0000",
        title: "跨越宗教藩籬的情誼──內村鑑三與佛教",
        routeId: "4-8跨越宗教藩籬的情誼",
        author: "廖本恩",
      },
      {
        displayId: "09",
        category: "專題文章",
        color: "#8b0000",
        title: "我願作十方橋──宗教多元主義在當代的理論建構與田野實踐",
        routeId: "4-9我願作十方橋",
        author: "張辰瑋",
      },
      {
        displayId: "10",
        category: "專題文章",
        color: "#8b0000",
        title: "怪胎與ㄊㄚ們的產地──酷兒神學簡介與我的實踐經驗分享",
        routeId: "4-10怪胎與ㄊㄚ們的產地",
        author: "Sunny Leung",
      },
      {
        displayId: "11",
        category: "生命故事",
        color: "#46b175",
        title: "我的彩基史──我的信仰史（三）",
        routeId: "4-11我的彩基史",
        author: "張辰瑋",
      },
      {
        displayId: "12",
        category: "生命故事",
        color: "#46b175",
        title: "因祂是我們的和睦──一位同志基督徒的生命分享",
        routeId: "4-12因祂是我們的和睦",
        author: "張辰瑋",
      },

      { type: "header", text: "多元講堂", styleClass: "diverse-title" },
      {
        displayId: "13",
        category: "評論與回應",
        color: "#ff8000",
        title: "神啊，祢在哪兒？──《台北大空襲》音樂劇的反思",
        routeId: "4-13神啊，祢在哪兒？",
        author: "毛毛",
      },
      {
        displayId: "14",
        category: "公告與剪影",
        color: "#6a5acd",
        title: "後現代是對「宏大敘事」的質疑──野橄欖神學社與後現代神學（三）",
        routeId: "4-14後現代是對「宏大敘事」的質疑",
        author: "金子煥",
      },
      {
        displayId: "15",
        category: "時事感想",
        color: "#4682b4",
        title: "不為自己求安樂，但願眾生得離苦──從佛教信仰看待社會議題的關懷與推動",
        routeId: "4-15不為自己求安樂，但願眾生得離苦",
        author: "淨智",
      },

      { type: "header", text: "", styleClass: "" },
      {
        displayId: "16",
        title: "投稿資訊／下期主題",
        link: "/submission",
        isExternal: false,
        routeId: null,
      },
      { displayId: "17", type: "text", text: " 編輯資訊／線上資訊" },
    ],
  },
  {
    year: 2025, // ✅ 新增
    number: 3,
    title: "馬丁‧路德的世紀婚禮",
    date: "2025年05-06月號",
    coverImg: "/images/covers/cover-3.png",
    pdfLink: "https://drive.google.com/file/d/17pfGcsBtvHbSK0yGkDNYHeLpBCheUIX_/view?usp=sharing",
    content: [
      { displayId: "01", title: "編輯室報告", routeId: "3-1編輯室報告", author: "編輯室" },
      { displayId: "02", title: "本期作者簡介", routeId: "3-2本期作者簡介", author: "編輯室" },
      {
        displayId: "03",
        category: "封面故事",
        color: "#7d6c29",
        title: "那天，我去了路德與凱蒂之家",
        routeId: "3-3那天，我去了路德與凱蒂之家",
        author: "張辰瑋",
      },
      {
        displayId: "04",
        category: "公告與剪影",
        color: "#6a5acd",
        title: "無境界者2025年度演講會公告",
        routeId: "3-4無境界者2025年度演講會公告",
        author: "編輯室",
      },

      { type: "header", text: "特稿專區", styleClass: "theme-title" },
      {
        displayId: "05",
        category: "專題文章",
        color: "#8b0000",
        title: "獨身．梵行與聖果之間的關係──佛教現代禪的觀點",
        routeId: "3-5獨身．梵行與聖果之間的關係",
        author: "溫金柯",
      },
      {
        displayId: "06",
        category: "時事感想",
        color: "#4682b4",
        title: "教宗方濟各對天主教會的影響",
        routeId: "3-6教宗方濟各對天主教會的影響",
        author: "談良辰",
      },

      { type: "header", text: "主題廣場", styleClass: "theme-title" },
      {
        displayId: "07",
        category: "專題文章",
        color: "#8b0000",
        title: "諸宗教當中的「獨身」與「婚姻」制度演化史",
        routeId: "3-7諸宗教當中的「獨身」與「婚姻」制度演化史",
        author: "張辰瑋",
      },
      {
        displayId: "08",
        category: "專題文章",
        color: "#8b0000",
        title: "婚禮也有神學──從性別與群體觀出發的感恩禮拜實踐",
        routeId: "3-8婚禮也有神學",
        author: "金子煥",
      },
      {
        displayId: "09",
        category: "專題文章",
        color: "#8b0000",
        title: "繼承路德的第二次宗教改革──内村鑑三與無教會主義",
        routeId: "3-9繼承路德的第二次宗教改革",
        author: "廖本恩",
      },
      {
        displayId: "10",
        category: "生命故事",
        color: "#46b175",
        title: "帶著路德去旅行──2024德國宗教改革之旅（上）",
        routeId: "3-10帶著路德去旅行",
        author: "張辰瑋",
      },
      {
        displayId: "11",
        category: "生命故事",
        color: "#46b175",
        title: "跟隨路德的腳蹤──2024德國宗教改革之旅（下）",
        routeId: "3-11跟隨路德的腳蹤",
        author: "張辰瑋",
      },
      {
        displayId: "12",
        category: "生命故事",
        color: "#46b175",
        title: "馬丁‧路德的恐懼與平安",
        routeId: "3-12馬丁‧路德的恐懼與平安",
        author: "張辰瑋",
      },

      { type: "header", text: "多元講堂", styleClass: "diverse-title" },
      {
        displayId: "13",
        category: "評論與回應",
        color: "#ff8000",
        title: "教會中你我是自願為誰的奴？──簡評艾蒂安．波埃西《自願為奴》",
        routeId: "3-13教會中你我是自願為誰的奴？",
        author: "毛毛",
      },
      {
        displayId: "14",
        category: "生命故事",
        color: "#46b175",
        title: "我的福音派史──我的信仰史（二）",
        routeId: "3-14我的福音派史",
        author: "張辰瑋",
      },
      {
        displayId: "15",
        category: "專題文章",
        color: "#8b0000",
        title: "救渡與文化──從文化哲學的角度論佛教傳統",
        routeId: "3-15救渡與文化",
        author: "釋等融",
      },
      {
        displayId: "16",
        category: "時事感想",
        color: "#4682b4",
        title: "戒律與時代適應性──淺談佛教近日時事「性平剃度事件」",
        routeId: "3-16戒律與時代適應性",
        author: "淨智",
      },
      {
        displayId: "17",
        category: "公告與剪影",
        color: "#6a5acd",
        title: "第二屆性別友善自在營公告",
        routeId: "3-17第二屆性別友善自在營公告",
        author: "性別營籌委會",
      },

      { type: "header", text: "", styleClass: "" },
      {
        displayId: "18",
        title: "投稿資訊／下期主題",
        link: "/submission",
        isExternal: false,
        routeId: null,
      },
      { displayId: "19", type: "text", text: " 編輯資訊／線上資訊" },
    ],
  },
  {
    year: 2025, // ✅ 新增
    number: 2,
    title: "流浪者的詩歌",
    date: "2025年03-04月號",
    coverImg: "/images/covers/cover-2.png",
    pdfLink: "https://drive.google.com/file/d/1eUnVuICCRfYThxGql5FjmDfboXjtF91K/view?usp=sharing",
    content: [
      { displayId: "01", title: "編輯室報告", routeId: "2-1編輯室報告", author: "編輯室" },
      { displayId: "02", title: "本期作者簡介", routeId: "2-2本期作者簡介", author: "編輯室" },
      {
        displayId: "03",
        category: "封面故事",
        color: "#7d6c29",
        title: "離散於港台之間",
        routeId: "2-3離散於港台之間",
        author: "Sunny Leung",
      },

      { type: "header", text: "特稿專區", styleClass: "theme-title" },
      {
        displayId: "04",
        category: "專題文章",
        color: "#8b0000",
        title: "沒有名字的教會，所為何來？",
        routeId: "2-4沒有名字的教會，所為何來？",
        author: "陳思豪牧師",
      },

      { type: "header", text: "主題廣場", styleClass: "theme-title" },
      {
        displayId: "05",
        category: "生命故事",
        color: "#46b175",
        title: "我的棄教宣言──一名麻煩死gay的棄教不離教的生命歷程",
        routeId: "2-5我的棄教宣言",
        author: "Sunny Leung",
      },
      {
        displayId: "06",
        category: "評論與回應",
        color: "#ff8000",
        title: "教會外的信徒還在嗎？──淺談拙作〈教會外的信徒〉",
        routeId: "2-6教會外的信徒還在嗎？",
        author: "張劭瑋",
      },
      {
        displayId: "07",
        category: "評論與回應",
        color: "#ff8000",
        title: "萬籟所成的生命詩歌──簡評赫曼‧赫塞《流浪者之歌》",
        routeId: "2-7萬籟所成的生命詩歌",
        author: "張辰瑋",
      },
      {
        displayId: "08",
        category: "生命故事",
        color: "#46b175",
        title: "遊牧信徒",
        routeId: "2-8遊牧信徒",
        author: "毛毛",
      },
      {
        displayId: "09",
        category: "生命故事",
        color: "#46b175",
        title: "大齋期的流浪──我的生命故事",
        routeId: "2-9大齋期的流浪",
        author: "奧斯定",
      },
      {
        displayId: "10",
        category: "生命故事",
        color: "#46b175",
        title: "流浪者之聲──浪人、小丑、靈長類",
        routeId: "2-10流浪者之聲",
        author: "張辰瑋",
      },

      { type: "header", text: "多元講堂", styleClass: "diverse-title" },
      {
        displayId: "11",
        category: "評論與回應",
        color: "#ff8000",
        title: "在燃燒中閃耀的神聖之黑──《黑祭司2：闇黑修女》中的多重離散與無境界精神",
        routeId: "2-11在燃燒中閃耀的神聖之黑",
        author: "邱詠恩",
      },
      {
        displayId: "12",
        category: "生命故事",
        color: "#46b175",
        title: "我的異端史──我的信仰史（一）",
        routeId: "2-12我的異端史",
        author: "張辰瑋",
      },
      {
        displayId: "13",
        category: "專題文章",
        color: "#8b0000",
        title: "孕育日本無教會主義的土壤：友誼──內村鑑三與宣教士的糾葛與友誼（二）",
        routeId: "2-13孕育日本無教會主義的土壤：友誼",
        author: "廖本恩",
      },
      {
        displayId: "14",
        category: "公告與剪影",
        color: "#6a5acd",
        title: "文本以外無一物？──野橄欖神學社與後現代神學（二）",
        routeId: "2-14文本以外無一物？",
        author: "金子煥",
      },
      {
        displayId: "15",
        category: "專題文章",
        color: "#8b0000",
        title: "飛鳥的啟示──信仰者的安全堡壘",
        routeId: "2-15飛鳥的啟示",
        author: "張辰瑋",
      },

      { type: "header", text: "", styleClass: "" },
      {
        displayId: "16",
        title: "投稿資訊／下期主題",
        link: "/submission",
        isExternal: false,
        routeId: null,
      },
      { displayId: "17", type: "text", text: " 編輯資訊／線上資訊" },
    ],
  },
  {
    year: 2025, // ✅ 新增
    number: 1,
    title: "無教會主義與二十一世紀的東亞",
    date: "2025年01-02月號",
    coverImg: "/images/covers/cover-1.png",
    pdfLink: "https://drive.google.com/file/d/1Fx0-Df6DlW_ljRAhbJjjFpUMETjedua-/view?usp=sharing",
    content: [
      { displayId: "01", title: "編輯室報告", routeId: "1-1編輯室報告", author: "編輯室" },
      { displayId: "02", title: "本期作者簡介", routeId: "1-2本期作者簡介", author: "編輯室" },
      {
        displayId: "03",
        category: "封面故事",
        color: "#7d6c29",
        title: "克呂尼的晚霞，大教堂時代的黃昏",
        routeId: "1-3克呂尼的晚霞，大教堂時代的黃昏",
        author: "張辰瑋",
      },
      {
        displayId: "04",
        title: "《無境界者》使命宣言",
        routeId: "1-4《無境界者》使命宣言",
        author: "張辰瑋",
      },

      { type: "header", text: "主題廣場", styleClass: "theme-title" },
      {
        displayId: "05",
        category: "專題文章",
        color: "#8b0000",
        title: "無教會主義的精神：獨立──內村鑑三與宣教士的糾葛（一）",
        routeId: "1-5無教會主義的精神：獨立",
        author: "廖本恩",
      },
      {
        displayId: "06",
        category: "評論與回應",
        color: "#ff8000",
        title: "縱貫一世紀的無教會史──簡評廖本恩《無境界的信徒們》（上）",
        routeId: "1-6縱貫一世紀的無教會史",
        author: "張辰瑋",
      },
      {
        displayId: "07",
        category: "評論與回應",
        color: "#ff8000",
        title: "從「無教會」到「無境界」──簡評廖本恩《無境界的信徒們》（下）",
        routeId: "1-7從「無教會」到「無境界」",
        author: "張辰瑋",
      },
      {
        displayId: "08",
        category: "專題文章",
        color: "#8b0000",
        title: "精神上的無教會──淺談一種感受與可能性",
        routeId: "1-8精神上的無教會",
        author: "邱詠恩",
      },
      {
        displayId: "09",
        category: "專題文章",
        color: "#8b0000",
        title: "基督教中的安那其份子──我心目中的無教會",
        routeId: "1-9基督教中的安那其份子",
        author: "張辰瑋",
      },
      {
        displayId: "10",
        category: "評論與回應",
        color: "#ff8000",
        title: "東正教的視角──與無教會主義的對話",
        routeId: "1-10東正教的視角",
        author: "奧斯定",
      },
      {
        displayId: "11",
        category: "公告與剪影",
        color: "#6a5acd",
        title: "作為無教會主義的一種實踐？──野橄欖神學社與後現代神學（一）",
        routeId: "1-11作為無教會主義的一種實踐？",
        author: "金子煥",
      },

      { type: "header", text: "多元講堂", styleClass: "diverse-title" },
      {
        displayId: "12",
        category: "時事感想",
        color: "#4682b4",
        title: "誕是",
        routeId: "1-12誕是",
        author: "小無",
      },
      {
        displayId: "13",
        category: "評論與回應",
        color: "#ff8000",
        title: "一部為無國家者辯白的歷史──簡評斯科特《反穀》",
        routeId: "1-13一部為無國家者辯白的歷史",
        author: "張辰瑋",
      },

      { type: "header", text: "", styleClass: "" },
      {
        displayId: "14",
        title: "投稿資訊／下期主題",
        link: "/submission",
        isExternal: false,
        routeId: null,
      },
      { displayId: "15", type: "text", text: " 編輯資訊／線上資訊" },
    ],
  },
];
</script>

<style scoped>
/* ==========================================================================
   CSS 還原區 (保留你原本的設定)
   ========================================================================== */

/* 1. 頁面基礎設定 */

#main-container {
  max-width: 100%;
  margin: 50px auto;
  padding: 50px 60px;
  background-color: rgba(255, 255, 255, 0.7); /* 保留你的 0.7 設定 */
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  min-height: 600px;
}

/* 2. 標題樣式 */
.main-title {
  font-family: "serif";
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  line-height: 1.4;
  margin-top: 30px;
  margin-bottom: 0px;
  color: #444;
  letter-spacing: 0.5rem;
}

.emoji {
  font-size: 2rem;
  margin: 0 0.5rem;
  vertical-align: middle;
}

.main-divider {
  width: 100%;
  height: 4px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 20px auto;
}

h2 {
  text-align: left;
  color: #444;
  margin-top: 1rem;
  margin-bottom: 1rem;
  font-size: 2rem;
  font-weight: bold;
}

.issue-date {
  color: #ff8000;
  font-size: 20px;
  font-weight: bold;
}

/* 3. 內容排版 (Flexbox) */
.content-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.left-section {
  flex: 1;
  margin-top: 0;
}

.right-section {
  text-align: center;
  margin-top: 2rem;
  flex-shrink: 0;
}

/* 4. 列表樣式 (數字凸排與樣式) */
ul {
  padding: 0;
  margin: 0;
  list-style: none;
}

li {
  list-style: none;
  position: relative;
  /* 左邊縮排邏輯 */
  margin-left: 2rem;
  padding-left: 0.5em;
  margin-bottom: 0.5rem;
  line-height: 1.8;
  font-size: 1.2rem;
  font-family: serif;
}

.left-section p {
  /* 關鍵修正 1：推開整個區塊，為 ID/Category 騰出空間 */
  /* 4em 距離足以涵蓋最長的 [ID 17 + 分類文字] */
  padding-left: 1.5em;

  /* 關鍵修正 2：把第一行文字拉回 4em，讓它和 ID/Category 對齊 */
  text-indent: -1.5em;
}

/* 特殊處理：標題不需要編號縮排 */
li.no-bullet {
  margin-left: 0;
  padding-left: 0;
}

/* 5. 分區標題 (特稿專區、主題廣場...) */
.title-box {
  text-align: center;
  position: relative;
  text-align: center;
  margin: 3rem 0 0.5rem 0;
}

.title-box::before {
  content: "";
  display: block;
  top: 50%;
  left: 0;
  width: 100%;
  height: 1.5px;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: 0;
  margin-bottom: 1rem;
}

.title-box h3 {
  text-align: center;
  display: inline-block;
  position: relative;
  font-weight: bold;
  color: #444;
  font-size: 1.5rem;
  margin: 0;
  padding: 0;
}

/* 6. 文章連結與顏色 */
.article-type {
  font-weight: bold;
  padding-right: 0.5rem;
}

.left-section a {
  color: #007bff;
  text-decoration: none;
  transition: color 0.3s ease;
}

.left-section a:hover {
  color: #0056b3;
  text-decoration: underline;
}

.author {
  color: #333;
  font-size: 1.2rem;
}

/* 7. 封面圖樣式 */
.magazine-cover {
  width: 350px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  margin-top: -2em;
}

.magazine-cover:hover {
  transform: scale(1.05);
}

.cover-description {
  font-size: 1rem;
  margin-top: 0.5rem;
  color: #666;
  font-family: serif;
}

.issue-divider {
  width: 100%;
  height: 2px;
  background-color: rgba(0, 0, 0, 0.75);
  border-radius: 2px;
  margin: 20px auto;
}

/* =========================================
   針對「沒有文字」的純分隔線修正
   ========================================= */

/* 1. 當只有線的時候，隱藏空的 h3，避免它佔據高度 */
.title-box.only-line h3 {
  display: none;
}

/* 2. 重置線條本身的下邊距 (原本是推開 h3，現在不需要了) */
.title-box.only-line::before {
  margin-bottom: 0;
}

/* 3. 設定盒子整體的下邊距為 1rem */
/* 這樣線條距離下一篇文章 (如第 16 篇) 就剛好是 1rem */
.title-box.only-line {
  margin-bottom: 1rem;
}

/* =========================================
   年份選單樣式 (Year Dropdown)
   ========================================= */
.year-selector-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0 3rem 0; /* 上下留白 */
  font-family: "serif"; /* 配合全站字體 */
  font-size: 1.2rem;
  color: #555;
}

/* 自訂下拉框容器 */
.custom-select {
  position: relative;
  display: inline-block;
}

/* 真正的 select 標籤 */
.custom-select select {
  appearance: none; /* 移除瀏覽器預設樣式 (重要!) */
  -webkit-appearance: none;
  -moz-appearance: none;

  background-color: transparent;
  border: none;
  border-bottom: 2px solid #888; /* 只有底線 */
  border-radius: 0;

  padding: 5px 30px 5px 10px; /* 右邊留空給箭頭 */
  font-family: "serif";
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
  cursor: pointer;
  outline: none;
  transition: border-color 0.3s;
}

/* 滑鼠移過去時，底線變黑 */
.custom-select select:hover,
.custom-select select:focus {
  border-bottom-color: #000;
}

/* 自製的箭頭符號 */
.custom-select .arrow {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none; /* 讓點擊穿透到 select 上 */
  font-size: 0.8rem;
  color: #555;
}

.no-data {
  text-align: center;
  padding: 3rem 0;
  color: #666;
  font-family: serif;
  font-size: 1.6rem;
}

/* ==========================================================================
   RWD 手機版適配 (保留你原本的設定)
   ========================================================================== */
@media (max-width: 1400px) {
  #main-container {
    max-width: 85%;
  }
}

@media (max-width: 1024px) {
  #main-container {
    max-width: 95%;
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .main-title {
    font-size: 1.8rem;
  }

  /* 隱藏裝飾用的 emoji */
  .emoji {
    display: none;
  }

  /* 內容改為直式排列 */
  .content-wrapper {
    flex-direction: column;
  }

  /* 封面排在上面 */
  .right-section {
    order: 1;
    margin: 0 auto 2rem auto;
    width: 100%;
  }

  .magazine-cover {
    width: 80%;
    max-width: 300px;
    margin-top: 0;
  }

  /* 文章列表排在下面 */
  .left-section {
    order: 2;
    width: 100%;
  }

  /* 手機版字體與縮排調整 */
  li {
    margin-left: 0.5rem;
    font-size: 1rem;
  }

  h2 {
    font-size: 1.5rem;
    text-align: center;
  }

  h2 span:first-child {
    display: none;
  }

  .issue-date {
    display: block;
    font-size: 1rem;
    margin-top: 5px;
  }

  .title-box h3 {
    font-size: 1.3rem;
  }

  .year-selector-wrapper {
    flex-direction: column; /* 手機上標籤跟選單垂直排列 */
    gap: 0.5rem;
  }
}
</style>
