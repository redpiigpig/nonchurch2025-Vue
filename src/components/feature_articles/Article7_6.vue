<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
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

// 電腦版：切割封面封底與內頁
const interiorPages = computed(() => {
  if (allPages.value.length < 2) return [];
  return allPages.value.slice(1, -1);
});
const backCoverPage = computed(() => {
  if (allPages.value.length === 0) return null;
  return allPages.value[allPages.value.length - 1];
});

const isMobile = ref(false);
const mobileCurrentPage = ref(0);
const showMobileModal = ref(false);

let pageFlip = null;
const bookContainer = ref(null);

// ==========================================
// 2. 音訊與音量控制
// ==========================================
const audioRef = ref(null);
const isPlaying = ref(false);
const isMuted = ref(false);
const volume = ref(0.8);

const togglePlay = () => {
  if (!audioRef.value) return;
  if (isPlaying.value) audioRef.value.pause();
  else audioRef.value.play();
  isPlaying.value = !isPlaying.value;
};

const toggleMute = () => {
  if (!audioRef.value) return;
  isMuted.value = !isMuted.value;
  if (isMuted.value) audioRef.value.volume = 0;
  else audioRef.value.volume = volume.value;
};

const onVolumeChange = () => {
  if (!audioRef.value) return;
  audioRef.value.volume = volume.value;
  if (volume.value > 0) isMuted.value = false;
};

// ==========================================
// 3. PageFlip 初始化 (僅限電腦版)
// ==========================================
const initPageFlip = () => {
  if (!bookContainer.value || isMobile.value) return;

  if (pageFlip) {
    pageFlip.destroy();
    pageFlip = null;
  }

  pageFlip = new PageFlip(bookContainer.value, {
    width: 473,
    height: 675,
    size: "stretch",
    minWidth: 300,
    maxWidth: 800,
    minHeight: 400,
    maxHeight: 1100,
    maxShadowOpacity: 0.5,
    showCover: true,
    mobileScrollSupport: false,
  });

  const pages = bookContainer.value.querySelectorAll(".page");
  pageFlip.loadFromHTML(pages);
};

const prevPageBtn = () => {
  if (pageFlip) pageFlip.flipPrev();
};
const nextPageBtn = () => {
  if (pageFlip) pageFlip.flipNext();
};

// ==========================================
// 4. 手機版：彈窗與翻頁邏輯
// ==========================================

const openMobileReader = () => {
  showMobileModal.value = true;
  document.body.style.overflow = "hidden";
};

// ⭐ 關鍵修改：關閉時重置頁碼
const closeMobileReader = () => {
  showMobileModal.value = false;
  document.body.style.overflow = "";

  // 重置回第一頁 (封面)
  mobileCurrentPage.value = 0;

  // 關閉時若正在播放，則暫停音樂
  if (isPlaying.value && audioRef.value) {
    audioRef.value.pause();
    isPlaying.value = false;
  }
};

const touchStartX = ref(0);
const touchEndX = ref(0);
const minSwipeDistance = 50;

const onTouchStart = (e) => {
  touchStartX.value = e.changedTouches[0].screenX;
};

const onTouchEnd = (e) => {
  touchEndX.value = e.changedTouches[0].screenX;
  handleSwipe();
};

const handleSwipe = () => {
  const distance = touchEndX.value - touchStartX.value;
  if (Math.abs(distance) < minSwipeDistance) return;

  if (distance > 0) {
    prevMobilePage();
  } else {
    nextMobilePage();
  }
};

const nextMobilePage = () => {
  if (mobileCurrentPage.value < allPages.value.length - 1) {
    mobileCurrentPage.value++;
    const modalContent = document.querySelector(".mobile-modal-scroll-area");
    if (modalContent) modalContent.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const prevMobilePage = () => {
  if (mobileCurrentPage.value > 0) {
    mobileCurrentPage.value--;
    const modalContent = document.querySelector(".mobile-modal-scroll-area");
    if (modalContent) modalContent.scrollTo({ top: 0, behavior: "smooth" });
  }
};

// 偵測螢幕尺寸
const checkMobile = () => {
  const wasMobile = isMobile.value;
  isMobile.value = window.innerWidth <= 1100;

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
  }
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);

  if (audioRef.value) {
    audioRef.value.volume = volume.value;
    audioRef.value.src = bookData.value.audio || "";
  }
  nextTick(() => {
    if (!isMobile.value) {
      initPageFlip();
    }
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
  if (pageFlip) pageFlip.destroy();
  document.body.style.overflow = "";
});
</script>

<template>
  <div class="media-experience-container">
    <div v-if="!isMobile" class="desktop-wrapper">
      <div class="control-bar">
        <button class="icon-btn" @click="togglePlay" :title="isPlaying ? '暫停' : '播放'">
          {{ isPlaying ? "⏸" : "▶" }}
        </button>
        <div class="volume-control-group">
          <button class="icon-btn" @click="toggleMute">
            {{ isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊" }}
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
        <div class="mode-switch-group">
          <span class="mode-label">📖 有聲繪本</span>
        </div>
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
                <img
                  :src="page.image"
                  :class="page.imageClass ? page.imageClass : 'page-img'"
                  loading="lazy"
                />
              </div>
              <div class="page-text-area" v-if="page.text" :class="{ 'text-only': !page.image }">
                <div v-html="page.text" class="text-content"></div>
                <span
                  class="page-number"
                  :class="(index + 1) % 2 !== 0 ? 'num-left' : 'num-right'"
                  >{{ index + 1 }}</span
                >
              </div>
            </div>
          </div>
          <div class="page page-cover" data-density="hard">
            <div class="page-content cover-layout">
              <img
                v-if="backCoverPage && backCoverPage.image"
                :src="backCoverPage.image"
                class="cover-img-full"
              />
              <div v-else class="back-cover-placeholder"><h3>THE END</h3></div>
            </div>
          </div>
        </div>
        <div class="nav-arrow left" @click="prevPageBtn">❮</div>
        <div class="nav-arrow right" @click="nextPageBtn">❯</div>
        <p class="hint-text">💡 拖曳角落翻頁</p>
      </div>
    </div>

    <div v-else class="mobile-wrapper">
      <div class="mobile-preview-card" @click="openMobileReader">
        <div class="preview-cover-box">
          <img v-if="allPages.length > 0" :src="allPages[0].image" class="preview-cover-img" />
          <div class="play-overlay">
            <span class="play-icon">📖</span>
            <span class="play-text">點擊開始閱讀</span>
          </div>
        </div>
        <div class="preview-info">
          <h3>有聲繪本體驗</h3>
          <p>點擊上方圖片進入全螢幕閱讀模式</p>
        </div>
      </div>

      <transition name="fade-modal">
        <div v-if="showMobileModal" class="mobile-modal-overlay">
          <div class="mobile-header-bar">
            <div class="mobile-audio-controls">
              <button class="icon-btn" @click="togglePlay">
                {{ isPlaying ? "⏸" : "▶" }}
              </button>
              <button class="icon-btn" @click="toggleMute">
                {{ isMuted || volume === 0 ? "🔇" : "🔊" }}
              </button>
            </div>
            <button class="close-btn" @click="closeMobileReader">✕</button>
          </div>

          <div class="mobile-modal-scroll-area" @touchstart="onTouchStart" @touchend="onTouchEnd">
            <transition name="slide-fade" mode="out-in">
              <div :key="mobileCurrentPage" class="mobile-page-content">
                <div v-if="allPages[mobileCurrentPage].image" class="mobile-img-box">
                  <img
                    :src="allPages[mobileCurrentPage].image"
                    :class="
                      allPages[mobileCurrentPage].imageClass ? 'mobile-role-img' : 'mobile-std-img'
                    "
                    loading="lazy"
                  />
                </div>
                <div class="mobile-text-box">
                  <div
                    v-if="allPages[mobileCurrentPage].text"
                    v-html="allPages[mobileCurrentPage].text"
                    class="text-content"
                  ></div>
                </div>
                <div
                  class="mobile-page-num"
                  v-if="mobileCurrentPage > 0 && mobileCurrentPage < allPages.length - 1"
                >
                  - {{ mobileCurrentPage }} -
                </div>
              </div>
            </transition>
          </div>

          <div class="mobile-nav-bar">
            <button
              class="nav-btn prev"
              @click.stop="prevMobilePage"
              :disabled="mobileCurrentPage === 0"
            >
              ❮ 上一頁
            </button>
            <span class="nav-info">
              {{
                mobileCurrentPage === 0
                  ? "封面"
                  : mobileCurrentPage === allPages.length - 1
                  ? "封底"
                  : `${mobileCurrentPage} / ${allPages.length - 2}`
              }}
            </span>
            <button
              class="nav-btn next"
              @click.stop="nextMobilePage"
              :disabled="mobileCurrentPage === allPages.length - 1"
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

/* Desktop Control Bar */
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

/* Desktop Book Scene */
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
  padding: 30px;
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

/* =========================================
   Mobile Modal Styles
   ========================================= */

/* 1. 預覽卡片 */
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

/* 2. 全螢幕彈窗 */
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

/* Modal Header */
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

/* Modal Content Area (Scrollable) */
.mobile-modal-scroll-area {
  flex: 1;
  overflow-y: auto;
  background: #fff;
  position: relative;
  -webkit-overflow-scrolling: touch;
}

/* 內容排版：滿版 */
.mobile-page-content {
  min-height: 100%;
  padding: 30px 20px 40px 20px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* Mobile Images */
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

/* Mobile Text */
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

/* Modal Footer */
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

/* Transitions */
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

/* RWD Override */
@media (max-width: 1100px) {
  .media-experience-container {
    background: transparent;
    box-shadow: none;
    max-width: 100%;
  }
}
</style>
