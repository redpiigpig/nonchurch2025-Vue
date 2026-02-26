<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { PageFlip } from "page-flip";

const props = defineProps({
  article: {
    type: Object,
    required: true,
  },
});

// ==========================================
// 1. 資料解析
// ==========================================
const mediaData = computed(() => props.article.media_data || {});
const bookData = computed(() => mediaData.value.book || { pages: [], audio: "" });
const allPages = computed(() => bookData.value.pages || []);

// 電腦版：內頁切分
const interiorPages = computed(() => {
  if (allPages.value.length < 2) return [];
  return allPages.value.slice(1, -1);
});
const backCoverPage = computed(() => {
  if (allPages.value.length === 0) return null;
  return allPages.value[allPages.value.length - 1];
});

<<<<<<< HEAD
// 手機版：圖文合併
=======
// 手機版：圖文合併邏輯 (⭐ 加入 audio 欄位合併)
>>>>>>> 42c9988 (有聲書播放功能調整)
const processedMobilePages = computed(() => {
  const pages = allPages.value;
  const result = [];
  for (let i = 0; i < pages.length; i++) {
    const current = pages[i];
    const next = pages[i + 1];
    if (
      i > 0 &&
      i < pages.length - 2 &&
      current.image &&
      !current.text &&
      next &&
      next.text &&
      !next.image
    ) {
      result.push({
        image: current.image,
        imageClass: current.imageClass,
        text: next.text,
<<<<<<< HEAD
        audio: current.audio || next.audio,
=======
        audio: current.audio || next.audio, // ⭐ 這裡要接住音檔網址
>>>>>>> 42c9988 (有聲書播放功能調整)
      });
      i++;
    } else {
      result.push(current);
    }
  }
  return result;
});

const isMobile = ref(false);
const mobileCurrentPage = ref(0);
const showMobileModal = ref(false);

let pageFlip = null;
const bookContainer = ref(null);

// ==========================================
<<<<<<< HEAD
// 2. 音訊核心邏輯：自動朗讀與播放切換
=======
// 2. 音訊核心邏輯 (⭐ 翻頁自動播放 / 重新播放)
>>>>>>> 42c9988 (有聲書播放功能調整)
// ==========================================
const audioRef = ref(null);
const isPlaying = ref(false);
const isMuted = ref(false);
const volume = ref(0.8);

<<<<<<< HEAD
// 功能 A：翻頁自動朗讀
const playPageAudio = (audioUrl) => {
  if (!audioRef.value) return;

=======
// ⭐ 執行朗讀
const playPageAudio = (audioUrl) => {
  if (!audioRef.value) return;
>>>>>>> 42c9988 (有聲書播放功能調整)
  if (audioUrl) {
    audioRef.value.src = audioUrl;
    audioRef.value.load();
    audioRef.value
      .play()
      .then(() => {
        isPlaying.value = true;
      })
      .catch((e) => {
<<<<<<< HEAD
        console.warn("自動播放受限:", e);
=======
        console.warn("自動播放受限，等待互動:", e);
>>>>>>> 42c9988 (有聲書播放功能調整)
        isPlaying.value = false;
      });
  } else {
    audioRef.value.pause();
    isPlaying.value = false;
  }
};

<<<<<<< HEAD
// ⭐ 功能 B：播放鍵邏輯 (播放中->暫停 / 暫停或結束->重新開始)
const togglePlay = () => {
  if (!audioRef.value) return;

  if (isPlaying.value) {
    // 正在播放中按按鈕：暫停
    audioRef.value.pause();
    isPlaying.value = false;
  } else {
    // 已播完或暫停中按按鈕：從頭重新朗讀
    audioRef.value.currentTime = 0;
    audioRef.value
      .play()
      .then(() => {
        isPlaying.value = true;
      })
      .catch((e) => console.error("播放失敗:", e));
=======
// ⭐ 播放鍵邏輯 (播放中點擊暫停，其餘重播)
const togglePlay = () => {
  if (!audioRef.value) return;
  if (isPlaying.value) {
    audioRef.value.pause();
    isPlaying.value = false;
  } else {
    audioRef.value.currentTime = 0; // ⭐ 從頭播放
    audioRef.value.play().then(() => {
      isPlaying.value = true;
    });
>>>>>>> 42c9988 (有聲書播放功能調整)
  }
};

const toggleMute = () => {
  if (!audioRef.value) return;
  isMuted.value = !isMuted.value;
  audioRef.value.volume = isMuted.value ? 0 : volume.value;
};

const onVolumeChange = () => {
  if (!audioRef.value) return;
  audioRef.value.volume = volume.value;
  if (volume.value > 0) isMuted.value = false;
};

// ==========================================
<<<<<<< HEAD
// 3. 翻頁事件監聽 (自動播放下一頁)
// ==========================================
const initPageFlip = () => {
  if (!bookContainer.value || isMobile.value) return;
  if (pageFlip) pageFlip.destroy();
=======
// 3. PageFlip 初始化與偵測翻頁
// ==========================================
const initPageFlip = () => {
  if (!bookContainer.value || isMobile.value) return;
  if (pageFlip) {
    pageFlip.destroy();
    pageFlip = null;
  }
>>>>>>> 42c9988 (有聲書播放功能調整)

  pageFlip = new PageFlip(bookContainer.value, {
    width: 473,
    height: 675,
    size: "stretch",
    showCover: true,
  });

  const pages = bookContainer.value.querySelectorAll(".page");
  pageFlip.loadFromHTML(pages);

<<<<<<< HEAD
  pageFlip.on("flip", (e) => {
    const pageIndex = e.data;
=======
  // ⭐ 電腦版翻頁偵測
  pageFlip.on("flip", (e) => {
    const pageIndex = e.data;
    // 檢查左右兩頁是否有音檔
>>>>>>> 42c9988 (有聲書播放功能調整)
    const audioUrl = allPages.value[pageIndex]?.audio || allPages.value[pageIndex + 1]?.audio;
    playPageAudio(audioUrl);
  });
};

watch(mobileCurrentPage, (newIdx) => {
  if (isMobile.value && showMobileModal.value) {
    const audioUrl = processedMobilePages.value[newIdx]?.audio;
    playPageAudio(audioUrl);
  }
});

// ==========================================
<<<<<<< HEAD
// 4. 開啟/關閉閱讀器
=======
// 4. 手機版邏輯
>>>>>>> 42c9988 (有聲書播放功能調整)
// ==========================================
const openMobileReader = () => {
  showMobileModal.value = true;
  document.body.style.overflow = "hidden";
<<<<<<< HEAD
  const audioUrl = processedMobilePages.value[0]?.audio;
  playPageAudio(audioUrl);
=======
  // 開啟瞬間播放第一頁音檔
  playPageAudio(processedMobilePages.value[0]?.audio);
>>>>>>> 42c9988 (有聲書播放功能調整)
};

const closeMobileReader = () => {
  showMobileModal.value = false;
  document.body.style.overflow = "";
  mobileCurrentPage.value = 0;
<<<<<<< HEAD
  audioRef.value?.pause();
  isPlaying.value = false;
};

const prevPageBtn = () => pageFlip?.flipPrev();
const nextPageBtn = () => pageFlip?.flipNext();

const touchStartX = ref(0);
const touchEndX = ref(0);
const onTouchStart = (e) => (touchStartX.value = e.changedTouches[0].screenX);
const onTouchEnd = (e) => {
  touchEndX.value = e.changedTouches[0].screenX;
  const distance = touchEndX.value - touchStartX.value;
  if (Math.abs(distance) < 50) return;
=======
  if (audioRef.value) {
    audioRef.value.pause();
    isPlaying.value = false;
  }
};

// ⭐ 手機版翻頁偵測
watch(mobileCurrentPage, (newIdx) => {
  if (isMobile.value && showMobileModal.value) {
    playPageAudio(processedMobilePages.value[newIdx]?.audio);
  }
});

const touchStartX = ref(0);
const touchEndX = ref(0);
const minSwipeDistance = 50;
const onTouchStart = (e) => {
  touchStartX.value = e.changedTouches[0].screenX;
};
const onTouchEnd = (e) => {
  touchEndX.value = e.changedTouches[0].screenX;
  const distance = touchEndX.value - touchStartX.value;
  if (Math.abs(distance) < minSwipeDistance) return;
>>>>>>> 42c9988 (有聲書播放功能調整)
  distance > 0 ? prevMobilePage() : nextMobilePage();
};

const nextMobilePage = () => {
  if (mobileCurrentPage.value < processedMobilePages.value.length - 1) {
    mobileCurrentPage.value++;
    document.querySelector(".mobile-modal-scroll-area")?.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const prevMobilePage = () => {
  if (mobileCurrentPage.value > 0) {
    mobileCurrentPage.value--;
    document.querySelector(".mobile-modal-scroll-area")?.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 1100;
<<<<<<< HEAD
  if (!isMobile.value) {
    showMobileModal.value = false;
    document.body.style.overflow = "";
    nextTick(() => initPageFlip());
  } else {
    pageFlip?.destroy();
    pageFlip = null;
=======
  if (wasMobile !== isMobile.value) {
    if (!isMobile.value) {
      showMobileModal.value = false;
      document.body.style.overflow = "";
      nextTick(() => initPageFlip());
    } else {
      if (pageFlip) {
        pageFlip.destroy();
        pageFlip = null;
      }
    }
>>>>>>> 42c9988 (有聲書播放功能調整)
  }
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
  if (audioRef.value) audioRef.value.volume = volume.value;
  nextTick(() => {
    if (!isMobile.value) initPageFlip();
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
  pageFlip?.destroy();
});
</script>

<template>
  <div class="media-experience-container">
    <div v-if="!isMobile" class="desktop-wrapper">
      <div class="control-bar">
<<<<<<< HEAD
        <button class="icon-btn" @click="togglePlay">
=======
        <button class="icon-btn" @click="togglePlay" :title="isPlaying ? '暫停' : '朗讀'">
>>>>>>> 42c9988 (有聲書播放功能調整)
          {{ isPlaying ? "⏸" : "▶" }}
        </button>
        <div class="volume-control-group">
          <button class="icon-btn" @click="toggleMute">
            {{ isMuted || volume === 0 ? "🔇" : "🔊" }}
          </button>
          <div class="volume-slider-wrapper">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              v-model.number="volume"
              @input="onVolumeChange"
              class="volume-range"
            />
          </div>
        </div>
        <div class="mode-switch-group"><span class="mode-label">📖 有聲繪本</span></div>
      </div>

      <div class="book-scene-container">
        <div class="flip-book" ref="bookContainer">
          <div class="page page-cover" data-density="hard">
            <div class="page-content cover-layout">
              <img v-if="allPages.length > 0" :src="allPages[0].image" class="cover-img-full" />
            </div>
          </div>
          <div v-for="(page, index) in interiorPages" :key="index" class="page">
            <div class="page-content interior-page">
              <div class="page-image-area" v-if="page.image">
                <img :src="page.image" :class="page.imageClass || 'page-img'" />
              </div>
              <div class="page-text-area" v-if="page.text" :class="{ 'text-only': !page.image }">
                <div v-html="page.text" class="text-content"></div>
              </div>
            </div>
          </div>
          <div class="page page-cover" data-density="hard">
            <div class="page-content cover-layout">
              <img v-if="backCoverPage?.image" :src="backCoverPage.image" class="cover-img-full" />
              <div v-else class="back-cover-placeholder"><h3>THE END</h3></div>
            </div>
          </div>
        </div>
        <div class="nav-arrow left" @click="prevPageBtn">❮</div>
        <div class="nav-arrow right" @click="nextPageBtn">❯</div>
      </div>
    </div>

    <div v-else class="mobile-wrapper">
      <div class="mobile-preview-card" @click="openMobileReader">
        <div class="preview-cover-box">
          <img v-if="allPages.length > 0" :src="allPages[0].image" class="preview-cover-img" />
          <div class="play-overlay">
            <span class="play-icon">📖</span><span class="play-text">點擊開始朗讀</span>
          </div>
        </div>
      </div>

      <transition name="fade-modal">
        <div v-if="showMobileModal" class="mobile-modal-overlay">
          <div class="mobile-header-bar">
            <div class="mobile-audio-controls">
              <button class="icon-btn" @click="togglePlay">{{ isPlaying ? "⏸" : "▶" }}</button>
              <button class="icon-btn" @click="toggleMute">
                {{ isMuted || volume === 0 ? "🔇" : "🔊" }}
              </button>
            </div>
            <button class="close-btn" @click="closeMobileReader">✕</button>
          </div>
          <div class="mobile-modal-scroll-area" @touchstart="onTouchStart" @touchend="onTouchEnd">
            <transition name="slide-fade" mode="out-in">
              <div :key="mobileCurrentPage" class="mobile-page-content">
                <div v-if="processedMobilePages[mobileCurrentPage].image" class="mobile-img-box">
                  <img
                    :src="processedMobilePages[mobileCurrentPage].image"
                    :class="
                      processedMobilePages[mobileCurrentPage].imageClass
                        ? 'mobile-role-img'
                        : 'mobile-std-img'
                    "
                  />
                </div>
                <div class="mobile-text-box">
                  <div
                    v-if="processedMobilePages[mobileCurrentPage].text"
                    v-html="processedMobilePages[mobileCurrentPage].text"
                    class="text-content"
                  ></div>
                </div>
<<<<<<< HEAD
=======
                <div
                  class="mobile-page-num"
                  v-if="
                    mobileCurrentPage > 0 && mobileCurrentPage < processedMobilePages.length - 1
                  "
                >
                  - {{ mobileCurrentPage }} -
                </div>
>>>>>>> 42c9988 (有聲書播放功能調整)
              </div>
            </transition>
          </div>
          <div class="mobile-nav-bar">
            <button
              class="nav-btn"
              @click.stop="prevMobilePage"
              :disabled="mobileCurrentPage === 0"
            >
              ❮ 上一頁
            </button>
<<<<<<< HEAD
            <span class="nav-info">{{
              mobileCurrentPage === 0
                ? "封面"
                : mobileCurrentPage === processedMobilePages.length - 1
                  ? "封底"
                  : `第 ${mobileCurrentPage} 頁`
            }}</span>
=======
            <span class="nav-info">
              {{
                mobileCurrentPage === 0
                  ? "封面"
                  : mobileCurrentPage === processedMobilePages.length - 1
                    ? "封底"
                    : `${mobileCurrentPage} / ${processedMobilePages.length - 2}`
              }}
            </span>
>>>>>>> 42c9988 (有聲書播放功能調整)
            <button
              class="nav-btn"
              @click.stop="nextMobilePage"
              :disabled="mobileCurrentPage === processedMobilePages.length - 1"
            >
              下一頁 ❯
            </button>
          </div>
        </div>
      </transition>
    </div>
    <audio ref="audioRef" @ended="isPlaying = false"></audio>
  </div>
</template>

<style scoped>
/* CSS 完全保持您原本的設定，不作任何變動 */
.media-experience-container {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  position: relative;
  background: #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  font-family: "Times New Roman", "DFKai-SB", serif;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}
.mobile-wrapper {
  width: 100%;
}
.desktop-wrapper .control-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: #333;
  color: white;
  z-index: 100;
  position: relative;
}
.icon-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  width: 40px;
}
.volume-control-group {
  display: flex;
  align-items: center;
  position: relative;
}
.volume-slider-wrapper {
  width: 0;
  overflow: hidden;
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
}
.volume-control-group:hover .volume-slider-wrapper,
.volume-slider-wrapper:hover {
  width: 100px;
  margin-left: 10px;
}
.volume-range {
  width: 100%;
  cursor: pointer;
  height: 4px;
}
.mode-label {
  color: #ccc;
  font-size: 0.9rem;
  font-weight: bold;
  border: 1px solid #666;
  padding: 5px 12px;
  border-radius: 20px;
}
.book-scene-container {
  min-height: 750px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  position: relative;
}
.flip-book {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}
.page {
  background-color: #fdfdfd;
  border: 1px solid #c2c2c2;
  overflow: hidden;
}
.page-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 25px;
}
.page-cover {
  background-color: #eee;
  border: 1px solid #999;
}
.cover-layout {
  padding: 0;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  display: flex;
}
.cover-img-full {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.page-image-area {
  flex: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 20px;
}
.page-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}
.role-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border: 10px solid white;
  box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.2);
  transform: rotate(-2deg);
  display: block;
  margin: 0 auto;
}
.page-text-area {
  flex: 2;
  font-size: 1.15rem;
  line-height: 1.6;
  color: #222;
  position: relative;
  padding: 0 5px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.page-text-area.text-only {
  flex: 1;
  justify-content: center;
  padding: 25px;
}
.text-content {
  text-align: justify;
}
.back-cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #444;
  color: white;
}
:deep(h2),
:deep(h3) {
  text-align: center;
  font-size: 1.5rem;
  margin-top: 0.2rem;
  margin-bottom: 0.3rem;
  color: #444;
  font-weight: bold;
  font-family: "DFKai-SB", serif;
  line-height: 1.2;
}
:deep(b) {
  font-weight: bold;
  color: #000;
}
.page-number {
  position: absolute;
  bottom: 15px;
  font-size: 0.85rem;
  color: #999;
}
.num-left {
  left: 25px;
  right: auto;
}
.num-right {
  right: 25px;
  left: auto;
}
.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 4rem;
  color: rgba(0, 0, 0, 0.15);
  cursor: pointer;
  padding: 20px;
  transition: all 0.3s;
  z-index: 50;
}
.nav-arrow:hover {
  color: rgba(0, 0, 0, 0.5);
  transform: translateY(-50%) scale(1.1);
}
.nav-arrow.left {
  left: 20px;
}
.nav-arrow.right {
  right: 20px;
}
.hint-text {
  margin-top: 15px;
  color: #777;
  font-size: 1rem;
}
.mobile-preview-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin: 20px;
  cursor: pointer;
  text-align: center;
  border: 1px solid #eee;
}
.preview-cover-box {
  position: relative;
  width: 100%;
  height: 300px;
  background: #f0f0f0;
}
.preview-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0.8;
  transition: opacity 0.3s;
}
.play-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}
.play-text {
  font-size: 1.2rem;
  font-weight: bold;
  letter-spacing: 1px;
}
.preview-info {
  padding: 15px;
}
.preview-info h3 {
  margin: 0 0 5px 0;
  color: #333;
}
.preview-info p {
  margin: 0;
  color: #777;
  font-size: 0.9rem;
}
.mobile-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #fff;
  z-index: 9999;
  display: flex;
  flex-direction: column;
}
.mobile-header-bar {
  height: 60px;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  flex-shrink: 0;
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
.mobile-audio-controls {
  display: flex;
  gap: 10px;
}
.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px 10px;
}
.mobile-modal-scroll-area {
  flex: 1;
  overflow-y: auto;
  background: #fff;
  position: relative;
  -webkit-overflow-scrolling: touch;
}
.mobile-page-content {
  min-height: 100%;
  padding: 30px 20px 40px 20px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.mobile-img-box {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 25px;
}
.mobile-std-img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}
.mobile-role-img {
  max-width: 90%;
  height: auto;
  border: 8px solid white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  transform: rotate(-1deg);
}
.mobile-text-box {
  font-size: 1.25rem;
  line-height: 1.8;
  color: #333;
  text-align: justify;
  flex-grow: 1;
}
.mobile-page-num {
  text-align: center;
  color: #999;
  font-size: 0.9rem;
  margin-top: 40px;
}
.mobile-nav-bar {
  height: 70px;
  background: #f9f9f9;
  border-top: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  flex-shrink: 0;
}
.nav-btn {
  background: white;
  border: 1px solid #ddd;
  color: #333;
  padding: 10px 20px;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}
.nav-btn:disabled {
  color: #ccc;
  border-color: #eee;
  box-shadow: none;
}
.nav-info {
  color: #666;
  font-size: 0.9rem;
}
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.3s;
}
.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.25s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
@media (max-width: 1100px) {
  .media-experience-container {
    background: transparent;
    box-shadow: none;
    max-width: 100%;
  }
}
</style>
