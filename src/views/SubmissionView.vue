<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import MainLayout from "../components/MainLayout.vue";
import { supabase } from "../supabase";
import { useEditorMode } from "../composables/useEditorMode";
import { useLanguage } from "../composables/useLanguage";

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const currentTheme = ref(null);
const { isEditor } = useEditorMode();
const { currentLang } = useLanguage();

const allIssues = ref([]);
const adminSelectedIssue = ref("");

// ⭐ 投稿資訊多國語言字典 (包含 Green Island 和 Buddhism of Human Realm)
const subMap = {
  "zh-TW": {
    title: "投稿資訊",
    loading: "正在載入投稿資訊 🕊️",
    noData: "目前尚無徵稿資訊。",
    intro:
      "《無境界者》雜誌是一個不以教會為本位的自由信仰論述平台，亦是一個實驗性質的線上雜誌，會定期在雙數月月底發刊。每一期皆會有一個當期主題，投稿者可以按照當期主題投稿，也可以自由發揮。",
    nextTitle: "☆下期徵稿主題",
    themePrefix: "徵稿主題：《",
    themeSuffix: "》",
    deadline: "📌 截稿期限：",
    typeTitle: "☆投稿類型",
    howTitle: "☆投稿方式",
    rules: [
      "欲投稿之作者，請按網頁下方的「我要投稿」，或者逕行投稿至 nonchurch2025@gmail.com，作品可匿名刊登，但投稿時仍須在電子郵件中附上真實姓名。初次投稿本刊物的作者請附上100-150字的信仰經歷簡介。",
      "《無境界者》雜誌是一個在網路上公開的非營利平台，故在此發表之作品皆視為公開發表，且恕無法提供稿酬。",
      "投稿至《無境界者》雜誌之作品，可以是原創作品或已公開發表過的作品，但作者需自負版權全責。",
      "每一期的截稿期限為單數月月底（刊登的一個月前），投稿時請標明投稿的期數。",
      "本刊物對於作品的刊登與否具有最終裁量權。",
    ],
    submitZone: "投稿專區",
    submitHint: "有精彩內容想分享嗎？點擊下方按鈕立即投稿！",
    submitBtn: "我要投稿",
    types: [
      {
        name: "專題文章",
        desc: "探討當期主題或其他議題的學術性或半學術性文章，約1,000-6,000字。",
        color: "red",
      },
      {
        name: "評論與回應",
        desc: "針對具有信仰啟發性的書籍、文章進行評論，或回應本刊及其他信仰刊物的文章。約500-6,000字。",
        color: "orange",
      },
      {
        name: "人物專訪",
        desc: "訪談對台灣教會史具獨特意義的人物，或針對特殊議題採訪重要人物並記錄其見解。約2,000-12,000字。",
        color: "yellow",
      },
      {
        name: "生命故事",
        desc: "個人生命經歷、日常信仰體悟，或參與活動的心得分享。約500-6,000字。",
        color: "green",
      },
      {
        name: "時事感想",
        desc: "對政治、社會、文化、教界時事的感想，或書寫時事對信仰的啟發。約500-6,000字。",
        color: "blue",
      },
      {
        name: "文藝創作",
        desc: "與信仰相關的詩詞、散文、短篇小說等創作。格式、篇幅不限。",
        color: "indigo",
      },
      {
        name: "公告與剪影",
        desc: "友好團體活動公告或活動紀錄，可附海報、照片或相關連結。約500-2,000字。",
        color: "purple",
      },
      { name: "光影時刻", desc: "以照片講述信仰故事，最多5張照片。文字500字以下。", color: "soil" },
      {
        name: "實驗園地",
        desc: "各類實驗性創作，格式不拘，投稿前請先與編輯聯絡討論。",
        color: "pink",
      },
    ],
  },
  "zh-CN": {
    title: "投稿信息",
    loading: "正在载入投稿信息 🕊️",
    noData: "目前尚无征稿信息。",
    intro:
      "《无境界者》杂志是一个不以教会为本位的自由信仰论述平台，亦是一个实验性质的在线杂志，定期在双数月月底发刊。每一期都会有一个当期主题，投稿者可以按照当期主题投稿，也可以自由发挥。",
    nextTitle: "☆下期征稿主题",
    themePrefix: "征稿主题：《",
    themeSuffix: "》",
    deadline: "📌 截稿期限：",
    typeTitle: "☆投稿类型",
    howTitle: "☆投稿方式",
    rules: [
      "欲投稿之作者，请按网页下方的“我要投稿”，或者直接投稿至 nonchurch2025@gmail.com。作品可匿名刊登，但投稿时仍须在电子邮件中附上真实姓名。初次投稿本刊物的作者请附上100-150字的信仰经历简介。",
      "《无境界者》杂志是一个在网络上公开的非营利平台，故在此发表之作品皆视为公开发表，且恕无法提供稿酬。",
      "投稿至《无境界者》杂志之作品，可以是原创作品或已公开发表过的作品，但作者需自负版权全责。",
      "每一期的截稿期限为单数月月底（刊登的一个月前），投稿时请标明投稿的期数。",
      "本刊物对于作品的刊登与否具有最终裁量权。",
    ],
    submitZone: "投稿专区",
    submitHint: "有精彩内容想分享吗？点击下方按钮立即投稿！",
    submitBtn: "我要投稿",
    types: [
      {
        name: "专题文章",
        desc: "探讨当期主题或其他议题的学术性或半学术性文章，约1,000-6,000字。",
        color: "red",
      },
      {
        name: "评论与回应",
        desc: "针对具有信仰启发性的书籍、文章进行评论，或回应本刊及其他信仰刊物的文章。约500-6,000字。",
        color: "orange",
      },
      {
        name: "人物专访",
        desc: "访谈对台湾教会史具独特意义的人物，或针对特殊议题采访重要人物并记录其见解。约2,000-12,000字。",
        color: "yellow",
      },
      {
        name: "生命故事",
        desc: "个人生命经历、日常信仰体悟，或参与活动的心得分享。约500-6,000字。",
        color: "green",
      },
      {
        name: "时事感想",
        desc: "对政治、社会、文化、教界时事的感想，或书写时事对信仰的启发。约500-6,000字。",
        color: "blue",
      },
      {
        name: "文艺创作",
        desc: "与信仰相关的诗词、散文、短篇小说等创作。格式、篇幅不限。",
        color: "indigo",
      },
      {
        name: "公告与剪影",
        desc: "友好团体活动公告或活动记录，可附海报、照片或相关链接。约500-2,000字。",
        color: "purple",
      },
      { name: "光影时刻", desc: "以照片讲述信仰故事，最多5张照片。文字500字以下。", color: "soil" },
      {
        name: "实验园地",
        desc: "各类实验性创作，格式不拘，投稿前请先与编辑联絡讨论。",
        color: "pink",
      },
    ],
  },
  en: {
    title: "Submissions",
    loading: "Loading submission info... 🕊️",
    noData: "Currently no call for papers.",
    intro:
      "Faith Without Boundary is a free faith discourse platform beyond church boundaries. It is an experimental online magazine published bi-monthly. Each issue has a specific theme, but independent topics are also welcome.",
    nextTitle: "☆ Next Theme",
    themePrefix: "Theme: 《",
    themeSuffix: "》",
    deadline: "📌 Deadline: ",
    typeTitle: "☆ Types",
    howTitle: "☆ How to Submit",
    rules: [
      "Click 'Submit Now' below or email nonchurch2025@gmail.com. Anonymity is possible, but real names must be included in the email. First-time contributors should include a 150-word bio.",
      "As a non-profit online platform, all published works are unremunerated.",
      "Submissions can be original or previously published. Authors take full responsibility for copyright.",
      "The deadline is the end of every odd month. Please specify the issue number.",
      "The editorial board has final discretion on publication.",
    ],
    submitZone: "Submission Zone",
    submitHint: "Want to share something? Submit now!",
    submitBtn: "Submit Now",
    types: [
      {
        name: "Features",
        desc: "Academic or semi-academic articles (1,000-6,000 words).",
        color: "red",
      },
      {
        name: "Reviews",
        desc: "Reviews or responses to books/articles (500-6,000 words).",
        color: "orange",
      },
      {
        name: "Interviews",
        desc: "Interviews with significant figures in church history (2,000-12,000 words).",
        color: "yellow",
      },
      {
        name: "Life Stories",
        desc: "Personal faith journeys or reflection on events (500-6,000 words).",
        color: "green",
      },
      {
        name: "Current Affairs",
        desc: "Thoughts on politics and society through faith (500-6,000 words).",
        color: "blue",
      },
      {
        name: "Literature",
        desc: "Faith-related poetry, prose, or fiction (No word limit).",
        color: "indigo",
      },
      {
        name: "Notices",
        desc: "Announcements of partner activities (500-2,000 words).",
        color: "purple",
      },
      {
        name: "Moments",
        desc: "Faith stories told through up to 5 photos (Under 500 words).",
        color: "soil",
      },
      {
        name: "Experimental",
        desc: "Experimental works. Please contact editors first.",
        color: "pink",
      },
    ],
  },
  ja: {
    title: "投稿案内",
    loading: "読み込み中... 🕊️",
    noData: "現在募集中の情報はありません。",
    intro:
      "『無境界者』は教会に依存しない自由な信仰論壇で、隔月の月末に発行されます。毎号テーマがありますが、自由なトピックも歓迎します。",
    nextTitle: "☆ 次号のテーマ",
    themePrefix: "テーマ：《",
    themeSuffix: "》",
    deadline: "📌 締切：",
    typeTitle: "☆ 募集分野",
    howTitle: "☆ 投稿方法",
    rules: [
      "下の「投稿する」ボタン、または nonchurch2025@gmail.com 宛にお送りください。匿名掲載も可能ですが、本名の記載が必要です。",
      "非営利プラットフォームのため、原稿料はお支払いできません。",
      "著作権の責任は著者が負うものとします。",
      "締切は奇数月の月末です。希望号数を明記してください。",
      "掲載の最終判断は編集部が行います。",
    ],
    submitZone: "投稿フォーム",
    submitHint: "素晴らしい記事をお待ちしております！",
    submitBtn: "投稿する",
    types: [
      { name: "特集記事", desc: "学術的または半学術的な記事（1,000～6,000字）。", color: "red" },
      { name: "評論と応答", desc: "書籍や他誌への書評・応答（500～6,000字）。", color: "orange" },
      {
        name: "インタビュー",
        desc: "重要な人物へのインタビュー（2,000～12,000字）。",
        color: "yellow",
      },
      {
        name: "ライフストーリー",
        desc: "個人の信仰体験や活動の感想（500～6,000字）。",
        color: "green",
      },
      {
        name: "時事コラム",
        desc: "政治・社会に対する信仰的な感想（500～6,000字）。",
        color: "blue",
      },
      { name: "文芸創作", desc: "詩、散文、小説などの創作活動（字数制限なし）。", color: "indigo" },
      { name: "お知らせ", desc: "友好団体の告知やイベント記録（500～2,000字）。", color: "purple" },
      { name: "光影の時", desc: "写真で語る信仰の物語（5枚まで、500字以内）。", color: "soil" },
      { name: "実験的創作", desc: "形式自由。事前に編集部へご相談ください。", color: "pink" },
    ],
  },
  ko: {
    title: "투고 안내",
    loading: "불러오는 중... 🕊️",
    noData: "현재 모집 중인 주제가 없습니다.",
    intro:
      "『무경계자』는 교회 중심주의를 벗어난 자유 신앙 담론 플랫폼으로 격월 발행됩니다. 주제에 맞춰 투고하거나 자유 주제로 투고할 수 있습니다.",
    nextTitle: "☆ 다음 호 주제",
    themePrefix: "주제: 《",
    themeSuffix: "》",
    deadline: "📌 마감일: ",
    typeTitle: "☆ 모집 분야",
    howTitle: "☆ 투고 방법",
    rules: [
      "아래 '투고하기'를 클릭하거나 nonchurch2025@gmail.com으로 보내주세요. 익명 게재가 가능하지만 본명 기재가 필요합니다.",
      "비영리 플랫폼이므로 원고료는 지급되지 않습니다.",
      "저작권에 대한 책임은 작성자에게 있습니다.",
      "마감일은 홀수 달 말일입니다. 호수를 명기해 주세요.",
      "게재 여부는 편집부가 최종 결정합니다.",
    ],
    submitZone: "투고하기",
    submitHint: "여러분의 이야기를 들려주세요!",
    submitBtn: "투고하기",
    types: [
      { name: "특집 기사", desc: "학술 및 반학술적 기사 (1,000-6,000자).", color: "red" },
      { name: "평론 및 응답", desc: "서평 및 응답 기사 (500-6,000자).", color: "orange" },
      { name: "인터뷰", desc: "주요 인물 인터뷰 (2,000-12,000자).", color: "yellow" },
      { name: "삶의 이야기", desc: "개인적인 신앙 경험 (500-6,000자).", color: "green" },
      { name: "시사 칼럼", desc: "정치, 사회 관련 단상 (500-6,000자).", color: "blue" },
      { name: "문예 창작", desc: "신앙 관련 시, 소설 등 (분량 제한 없음).", color: "indigo" },
      { name: "공지사항", desc: "행사 공지 및 기록 (500-2,000자).", color: "purple" },
      {
        name: "포토 스토리",
        desc: "사진으로 전하는 이야기 (5장 이내, 500자 이내).",
        color: "soil",
      },
      { name: "실험적 창작", desc: "형식 자유. 사전에 편집부와 논의해 주세요.", color: "pink" },
    ],
  },
};

const t = computed(() => subMap[currentLang.value] || subMap["zh-TW"]);

// ⭐ 核心：處理翻譯後的徵稿數據
const translatedTheme = computed(() => {
  if (!currentTheme.value) return null;
  const lang = currentLang.value === "default" ? "zh-TW" : currentLang.value;
  const transKey = lang.replace("-", "_");
  const trans = currentTheme.value.translations?.[transKey];

  return {
    ...currentTheme.value,
    // 優先使用翻譯欄位，沒有則用原始繁體
    cfp_title: trans?.cfp_title || currentTheme.value.cfp_title,
    cfp_theme: trans?.cfp_theme || currentTheme.value.cfp_theme,
  };
});

const themeParagraphs = computed(() => {
  if (!translatedTheme.value?.cfp_theme) return [];
  return translatedTheme.value.cfp_theme.split("\n").filter((p) => p.trim() !== "");
});

const fetchThemeData = async () => {
  loading.value = true;
  currentTheme.value = null;
  try {
    let query = supabase
      .from("issues")
      .select("id, title, date, cfp_title, cfp_theme, cfp_deadline, cfp_image, translations");

    if (route.params.issueNumber) {
      query = query.eq("id", route.params.issueNumber);
      adminSelectedIssue.value = route.params.issueNumber;
    } else {
      query = query.not("cfp_title", "is", null).order("id", { ascending: false }).limit(1);
    }

    if (!isEditor.value) {
      query = query.eq("is_published", true);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (data && data.length > 0) {
      currentTheme.value = data[0];
      if (!route.params.issueNumber) adminSelectedIssue.value = data[0].id;
    }
  } finally {
    loading.value = false;
  }
};

const fetchAllIssues = async () => {
  const { data } = await supabase
    .from("issues")
    .select("id, title, is_published")
    .order("id", { ascending: false });
  allIssues.value = data || [];
};

const handleAdminIssueChange = () => {
  if (!adminSelectedIssue.value) return;
  const targetPath = route.path.startsWith("/admin")
    ? `/admin/submit/issue/${adminSelectedIssue.value}`
    : `/submit/issue/${adminSelectedIssue.value}`;
  router.push(targetPath);
};

watch(() => route.params.issueNumber, fetchThemeData);
watch(isEditor, () => {
  fetchThemeData();
  if (isEditor.value) fetchAllIssues();
});

onMounted(() => {
  document.title = "投稿資訊 - 無境界者雜誌";
  fetchThemeData();
  if (isEditor.value) fetchAllIssues();
});
</script>

<template>
  <MainLayout>
    <h1 class="page-main-title">
      <span class="emoji">📬</span>{{ t.title }}<span class="emoji">📬</span>
    </h1>
    <div class="main-divider"></div>

    <div v-if="isEditor" class="admin-toolbar">
      <span class="toolbar-label">🔧 管理員導航：</span>
      <select v-model="adminSelectedIssue" @change="handleAdminIssueChange" class="admin-select">
        <option v-for="issue in allIssues" :key="issue.id" :value="issue.id">
          Vol.{{ issue.id }} - {{ issue.title }} {{ !issue.is_published ? "(草稿)" : "" }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="loading-state">
      {{ t.loading }}<span class="loading-dots"></span>
    </div>

    <div v-else-if="!translatedTheme" class="status-msg">{{ t.noData }}</div>

    <section id="theme" v-else>
      <section class="section-text">
        <p>{{ t.intro }}</p>
      </section>

      <h3>
        {{ t.nextTitle }}
        <span v-if="isEditor" style="font-size: 0.6em; color: #999">(預覽模式)</span>
      </h3>

      <div class="theme-block">
        <h2 class="theme-title">
          {{ t.themePrefix }}{{ translatedTheme.cfp_title }}{{ t.themeSuffix }}
        </h2>
        <div class="theme-image" v-if="translatedTheme.cfp_image">
          <img :src="translatedTheme.cfp_image" :alt="translatedTheme.cfp_title" />
        </div>
        <div class="theme-description">
          <p v-for="(para, index) in themeParagraphs" :key="index">{{ para }}</p>
        </div>
        <p class="deadline">{{ t.deadline }}{{ translatedTheme.cfp_deadline }}</p>
      </div>
    </section>

    <section id="types">
      <h3>{{ t.typeTitle }}</h3>
      <div class="theme-block">
        <div v-for="(type, idx) in t.types" :key="idx" class="type-item">
          <div :class="['type-block', type.color]">{{ type.name }}</div>
          <p class="type-description">{{ type.desc }}</p>
        </div>
      </div>
    </section>

    <section id="guidelines">
      <h3>{{ t.howTitle }}</h3>
      <p v-for="(rule, idx) in t.rules" :key="idx">{{ rule }}</p>
    </section>

    <div class="main-divider"></div>

    <section id="submit">
      <h2>{{ t.submitZone }}</h2>
      <p class="no-indent">{{ t.submitHint }}</p>
      <a href="https://forms.gle/wDxBRbGAorTTJqeJ9" class="submit-button" target="_blank">{{
        t.submitBtn
      }}</a>
    </section>
  </MainLayout>
</template>

<style scoped>
@import "@/assets/shared.css";

/* ⭐ 新增：後台工具列樣式 */
.admin-toolbar {
  background-color: #fff3cd;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  border: 1px solid #ffeeba;
  justify-content: center;
}
.toolbar-label {
  font-weight: bold;
  color: #856404;
  margin-right: 10px;
}
.admin-select {
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 1rem;
}

p {
  text-indent: 2rem;
  line-height: 1.8;
  color: #444;
  margin-bottom: 1rem;
  text-align: justify;
}
.no-indent,
.deadline {
  text-indent: 0 !important;
}
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

.theme-block {
  background-color: rgba(255, 255, 255, 0.6);
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 30px 60px;
  margin-bottom: 2rem;
}

.theme-title {
  text-align: center;
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #333;
  font-family: "KaiTi", "BiauKai", "DFKai-SB", "TW-Kai", serif;
}
.theme-image {
  text-align: center;
  margin-bottom: 1.5rem;
}
.theme-image img {
  max-width: 100%;
  height: auto;
  max-height: 600px;
  border-radius: 5px;
  display: block;
  margin: 0 auto;
}

/* ⭐ 修改：截稿期限顏色 (桃紅色) */
.deadline {
  text-align: right;
  font-weight: bold;
  margin-top: 2rem;
  margin-right: 10px;
  color: #e91e63; /* 桃紅色 */
}

.type-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
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
  text-indent: 0 !important;
}

.type-block.red {
  background-color: #8b0000;
}
.type-block.orange {
  background-color: #ff8000;
}
.type-block.yellow {
  background-color: #f0e137;
}
.type-block.green {
  background-color: #46b175;
}
.type-block.blue {
  background-color: #4682b4;
}
.type-block.indigo {
  background-color: #27408b;
}
.type-block.purple {
  background-color: #6a5acd;
}
.type-block.soil {
  background-color: #7d6c29;
}
.type-block.pink {
  background-color: #db7093;
}

a {
  color: #0275d8;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
#submit {
  text-align: center;
  padding: 20px 0;
  margin-top: -1rem;
}
#submit h2 {
  text-align: center;
}
#submit p {
  text-align: center !important;
  text-indent: 0 !important;
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
  transition:
    transform 0.2s,
    background-color 0.2s;
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

/* ===========================
   新增：載入動畫樣式
   =========================== */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh; /* 讓它垂直置中，高度佔畫面一半 */
  font-size: 2rem; /* 字體大小 */
  color: #888;
  font-family: serif; /* 如果想要跟內文一樣用襯線體 */
  font-weight: bold;
}

.loading-dots::after {
  content: "";
  animation: dots-cycle 2s infinite steps(1);
}

@keyframes dots-cycle {
  0% {
    content: "";
  }
  15% {
    content: ".";
  }
  30% {
    content: "..";
  }
  45% {
    content: "...";
  }
  60% {
    content: "....";
  }
  75% {
    content: ".....";
  }
  90% {
    content: "......";
  }
}

@media (max-width: 768px) {
  .theme-block {
    padding: 20px 20px;
  }
  .theme-description {
    margin: 0;
  }
  .type-item {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px 0;
  }
  .type-block {
    margin-bottom: 10px;
  }
}
</style>
