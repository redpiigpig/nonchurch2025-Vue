import { createRouter, createWebHistory } from "vue-router";
import { supabase } from "../supabase"; // 【新增】引入 Supabase 以便檢查登入狀態

// 1. 引入頁面
import HomeView from "../views/HomeView.vue";
import MissionView from "../views/MissionView.vue";
import ArticleListView from "../views/ArticleListView.vue";
import AuthorView from "../views/AuthorView.vue";
import ArticleContent from "../views/ArticleContent.vue";
import SearchView from "../views/SearchView.vue";
import LoginView from "../views/LoginView.vue";
import EditorView from "../views/EditorView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/home",
      name: "home",
      component: HomeView,
    },
    {
      path: "/mission",
      name: "mission",
      component: MissionView,
    },
    {
      path: "/authors",
      name: "authors",
      component: AuthorView,
    },
    {
      path: "/articles",
      name: "article-list",
      component: ArticleListView,
    },
    {
      path: "/articles/:id",
      name: "article-detail",
      component: ArticleContent,
    },
    {
      path: "/preview",
      name: "article-preview",
      component: ArticleContent,
    },
    {
      path: "/search",
      name: "search",
      component: SearchView,
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },

    // 🔥【重點修改】編輯相關路由，加上 meta: { requiresAuth: true }
    // 這代表這些頁面「需要權限」才能進入
    {
      path: "/admin/editor",
      name: "editor-new",
      component: EditorView,
      meta: { requiresAuth: true }, // 加上這個標記
    },
    {
      path: "/admin/editor/:id",
      name: "editor-edit",
      component: EditorView,
      meta: { requiresAuth: true }, // 加上這個標記
    },

    // 萬用路由
    {
      path: "/:pathMatch(.*)*",
      redirect: "/home",
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const element = document.querySelector(to.hash);
          if (element) {
            element.scrollIntoView({ behavior: "auto", block: "center" });
            resolve(false);
          } else {
            resolve({ top: 0 });
          }
        }, 50);
      });
    }
    return { left: 0, top: 0 };
  },
});

// 🔥【新增】全域路由守衛 (Global Navigation Guard)
// 這是網站的「警衛室」，每次換頁都會經過這裡
router.beforeEach(async (to, from, next) => {
  // 1. 檢查這個頁面是否需要權限 (看有沒有 meta.requiresAuth)
  if (to.meta.requiresAuth) {
    // 2. 向 Supabase 檢查是否有登入 Session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // 3. 如果沒有 Session (沒登入)
    if (!session) {
      // 踢回登入頁
      next("/login");
      // (選用) 可以跳個 alert 提示
      // alert("請先登入編輯者帳號！");
    } else {
      // 有登入，放行
      next();
    }
  } else {
    // 不需要權限的頁面 (如首頁)，直接放行
    next();
  }
});

export default router;
