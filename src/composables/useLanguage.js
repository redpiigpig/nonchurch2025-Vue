// src/composables/useLanguage.js
import { ref, watch } from "vue";

// 這裡改成 'default'
const currentLang = ref(localStorage.getItem("app_lang") || "default");

watch(currentLang, (newVal) => {
  localStorage.setItem("app_lang", newVal);
});

export function useLanguage() {
  return { currentLang };
}
