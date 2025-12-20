import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 啟用 / 停用 devtools plugin 可透過環境變數控制
    // 若遇到 runtime 錯誤 (例如某些瀏覽器環境中訪問 null 的 broadcast)，
    // 可將環境變數 DISABLE_VUE_DEVTOOLS=true 以停用該 plugin
    ...(process.env.DISABLE_VUE_DEVTOOLS === "true" ? [] : [vueDevTools()]),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
