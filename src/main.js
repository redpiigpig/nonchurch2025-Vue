import { createApp } from "vue";
import App from "./App.vue";
import router from "./router"; // <--- 1. 引入剛剛寫的 router

import "./assets/main.css";
import "./assets/article.css"; // 記得引入我們分出來的 CSS

const app = createApp(App);

app.use(router); // <--- 2. 告訴 App 使用 router

app.mount("#app");
