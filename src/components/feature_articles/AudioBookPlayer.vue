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
const slideData = computed(() => mediaData.value.slideshow || { images: [], audio: "" });
const allPages = computed(() => bookData.value.pages || []);

// 頁面切割邏輯：
// 內頁 = 去掉頭尾
const interiorPages = computed(() => {
  if (allPages.value.length < 2) return [];
  return allPages.value.slice(1, -1);
});
// 封底 = 最後一頁
const backCoverPage = computed(() => {
  if (allPages.value.length === 0) return null;
  return allPages.value[allPages.value.length - 1];
});

const mode = ref("book");
const isBookEnded = ref(false);

let pageFlip = null;
const bookContainer = ref(null);

// ==========================================
// 2. 音訊與音量控制
// ==========================================
const audioRef = ref(null);
const isPlaying = ref(false);
const isMuted = ref(false);
const volume = ref(0.8);
const previousVolume = ref(0.8);

const togglePlay = () => {
  if (!audioRef.value) return;
  if (isPlaying.value) audioRef.value.pause();
  else audioRef.value.play();
  isPlaying.value = !isPlaying.value;
};

const toggleMute = () => {
  if (!audioRef.value) return;
  isMuted.value = !isMuted.value;
  if (isMuted.value) {
    previousVolume.value = volume.value;
    volume.value = 0;
  } else {
    volume.value = previousVolume.value;
  }
  audioRef.value.volume = volume.value;
};

const onVolumeChange = () => {
  if (!audioRef.value) return;
  audioRef.value.volume = volume.value;
  if (volume.value > 0) isMuted.value = false;
};

const switchAudioSource = async () => {
  if (!audioRef.value) return;
  audioRef.value.pause();
  const newSrc = mode.value === "book" ? bookData.value.audio : slideData.value.audio;
  audioRef.value.src = newSrc || "";
  audioRef.value.load();
  audioRef.value.volume = volume.value;

  if (mode.value === "slideshow" && newSrc) {
    try {
      await audioRef.value.play();
      isPlaying.value = true;
    } catch (e) {
      console.log("自動播放被阻擋");
      isPlaying.value = false;
    }
  } else {
    isPlaying.value = false;
  }
};

// ==========================================
// 3. PageFlip 初始化
// ==========================================
const initPageFlip = () => {
  if (!bookContainer.value) return;

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

  pageFlip.on("flip", (e) => {
    const totalPages = pageFlip.getPageCount();
    // 檢查是否翻到最後一頁 (封底)
    if (e.data >= totalPages - 1) {
      isBookEnded.value = true;
    } else {
      isBookEnded.value = false;
    }
  });
};

const prevPageBtn = () => {
  if (pageFlip) pageFlip.flipPrev();
};
const nextPageBtn = () => {
  if (pageFlip) pageFlip.flipNext();
};

// ==========================================
// 4. 幻燈片 & 模式切換
// ==========================================
const currentSlideIndex = ref(0);
let slideInterval = null;

const startSlideshow = () => {
  stopSlideshow();
  slideInterval = setInterval(() => {
    currentSlideIndex.value = (currentSlideIndex.value + 1) % slideData.value.images.length;
  }, 4000);
};

const stopSlideshow = () => {
  if (slideInterval) clearInterval(slideInterval);
};

const changeMode = (targetMode) => {
  mode.value = targetMode;
  if (targetMode === "slideshow") {
    if (pageFlip) {
      pageFlip.destroy();
      pageFlip = null;
    }
    switchAudioSource();
    startSlideshow();
  } else {
    stopSlideshow();
    switchAudioSource();
    nextTick(() => {
      initPageFlip();
    });
  }
};

onMounted(() => {
  if (audioRef.value) {
    audioRef.value.volume = volume.value;
    audioRef.value.src = bookData.value.audio || "";
  }
  nextTick(() => {
    if (mode.value === "book") {
      initPageFlip();
    }
  });
});

onUnmounted(() => {
  stopSlideshow();
  if (pageFlip) pageFlip.destroy();
});
</script>

<template>
  <div class="media-experience-container">
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
        <button :class="['mode-btn', { active: mode === 'book' }]" @click="changeMode('book')">
          📖 繪本
        </button>
        <transition name="fade-btn">
          <button
            v-if="mode === 'slideshow'"
            :class="['mode-btn', { active: mode === 'slideshow' }]"
            @click="changeMode('slideshow')"
          >
            🎵 幻燈片
          </button>
        </transition>
      </div>
    </div>

    <div v-if="mode === 'book'" class="book-scene-container">
      <transition name="fade-btn">
        <div v-if="isBookEnded" class="end-action-overlay">
          <button class="play-slideshow-btn" @click="changeMode('slideshow')">
            <span>🎵</span>
            播放人物介紹幻燈片
          </button>
        </div>
      </transition>

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

              <span class="page-number" :class="(index + 1) % 2 !== 0 ? 'num-left' : 'num-right'">
                {{ index + 1 }}
              </span>
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
            <div v-else class="back-cover-placeholder">
              <h3>THE END</h3>
            </div>
          </div>
        </div>
      </div>

      <div class="nav-arrow left" @click="prevPageBtn">❮</div>
      <div class="nav-arrow right" @click="nextPageBtn">❯</div>
      <p class="hint-text">💡 拖曳角落翻頁</p>
    </div>

    <div v-else class="slideshow-scene">
      <transition name="fade" mode="out-in">
        <img
          v-if="slideData.images.length > 0"
          :key="currentSlideIndex"
          :src="slideData.images[currentSlideIndex]"
          class="slide-img"
        />
        <div v-else class="no-slide-data">
          <p>幻燈片準備中...</p>
        </div>
      </transition>
      <div class="slideshow-overlay">
        <div class="playing-indicator">
          <span class="music-note">🎵</span>
          正在播放音樂與回憶...
        </div>
      </div>
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

/* --- Control Bar --- */
.control-bar {
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
  transition: transform 0.2s;
}
.icon-btn:hover {
  transform: scale(1.1);
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
.mode-switch-group {
  display: flex;
  gap: 10px;
}
.mode-btn {
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid #666;
  background: transparent;
  color: #aaa;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}
.mode-btn.active {
  background: #e91e63;
  color: white;
  border-color: #e91e63;
  font-weight: bold;
}
.fade-btn-enter-active,
.fade-btn-leave-active {
  transition: opacity 0.5s;
}
.fade-btn-enter-from,
.fade-btn-leave-to {
  opacity: 0;
}

/* --- Book Scene --- */
.book-scene-container {
  min-height: 750px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  position: relative;
}

/* 按鈕位置 */
.end-action-overlay {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 200;
}

.play-slideshow-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: white;
  border: 2px solid #e91e63;
  color: #e91e63;
  padding: 20px 30px;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s;
  font-family: "DFKai-SB", serif;
}
.play-slideshow-btn span {
  font-size: 2rem;
}
.play-slideshow-btn:hover {
  background: #e91e63;
  color: white;
  transform: scale(1.05);
}

/* Book Styles */
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

/* Cover & Back Cover */
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
.cover-image-box {
  width: 100%;
  height: 100%;
}
.cover-img-full {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

/* Interior Pages */
.interior-page {
  background: #fff;
}

.page-image-area {
  flex: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 20px;
}

/* 一般繪本插圖 */
.page-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

/* ⭐ 人物介紹照片專用樣式 */
.role-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border: 10px solid white; /* 白色相框邊框 */
  box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.2); /* 相片陰影 */
  transform: rotate(-2deg); /* 稍微歪一點，更有貼照片的感覺 */
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

/* Navigation */
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
  user-select: none;
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

/* Slideshow */
.slideshow-scene {
  width: 100%;
  height: 700px;
  position: relative;
  background: black;
  display: flex;
  align-items: center;
  justify-content: center;
}
.slide-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  position: absolute;
}
.no-slide-data {
  color: white;
  font-size: 1.5rem;
}
.slideshow-overlay {
  position: absolute;
  bottom: 20px;
  left: 20px;
  color: white;
  background: rgba(0, 0, 0, 0.4);
  padding: 5px 15px;
  border-radius: 20px;
}
.music-note {
  display: inline-block;
  animation: bounce 1s infinite;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

/* RWD */
@media (max-width: 1100px) {
  .media-experience-container {
    max-width: 100%;
  }
  .nav-arrow {
    display: none;
  }

  .end-action-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    right: auto;
  }
}
</style>
