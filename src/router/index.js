import { createRouter, createWebHistory, RouterView } from "vue-router";
import { supabase } from "../supabase";

// 1. 引入前台頁面
import HomeView from "../views/HomeView.vue";
import MissionView from "../views/MissionView.vue";
import ArticleListView from "../views/ArticleListView.vue";
import AuthorView from "../views/AuthorView.vue";
import AuthorDetailView from "../views/AuthorDetailView.vue";
import ArticleContent from "../views/ArticleContent.vue";
import SearchView from "../views/SearchView.vue";
import LoginView from "../views/LoginView.vue";
import SubmissionView from "../views/SubmissionView.vue";

// 2. 引入後台管理頁面
const AdminLayout = () => import("../views/admin/AdminLayout.vue");
const EditorView = () => import("../views/admin/EditorView.vue");
const PublishingCenter = () => import("../views/admin/PublishingCenter.vue");
const IssuesManager = () => import("../views/admin/IssuesManager.vue");
const AuthorsManager = () => import("../views/admin/AuthorsManager.vue");
const ArticlesManager = () => import("../views/admin/ArticlesManager.vue");
const MediaManager = () => import("../views/admin/MediaManager.vue");

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ===========================
    // 前台路由 (保持不變)
    // ===========================
    { path: "/", redirect: "/home" },
    { path: "/home", name: "home", component: HomeView },
    { path: "/home/issue/:issueNumber", name: "home-issue", component: HomeView, props: true },
    { path: "/mission", name: "mission", component: MissionView },
    { path: "/authors", name: "authors", component: AuthorView },
    { path: "/authors/:name", name: "author-detail", component: AuthorDetailView },
    { path: "/articles", name: "article-list", component: ArticleListView },
    { path: "/articles/:id", name: "article-detail", component: ArticleContent },
    { path: "/preview", name: "article-preview", component: ArticleContent },
    { path: "/submit", name: "submit", component: SubmissionView },
    { path: "/submit/issue/:issueNumber", name: "submit-issue", component: SubmissionView },
    { path: "/search", name: "search", component: SearchView },
    { path: "/login", name: "login", component: LoginView },

    // ===========================
    // 後台路由結構
    // ===========================
    {
      path: "/admin",
      component: RouterView, // 權限檢查層
      meta: { requiresAuth: true },
      children: [
        // -------------------------
        // A. 真・後台管理介面 (SideBar 連結到這裡)
        // -------------------------
        {
          path: "",
          component: AdminLayout,
          children: [
            // 1. 期刊發布中心 (預設首頁)
            { path: "", name: "admin-publishing", component: PublishingCenter },

            // 2. 期刊主題管理
            { path: "issues_manager", name: "admin-issues-manager", component: IssuesManager },

            // 3. 作者管理
            { path: "authors_manager", name: "admin-authors-manager", component: AuthorsManager },

            // ⭐ 4. 文章管理 (列表模式)
            {
              path: "articles_manager",
              name: "admin-articles-manager",
              component: ArticlesManager,
            },

            // 5. 新增/編輯文章 (Editor)
            { path: "editor", name: "admin-editor-new", component: EditorView },
            { path: "editor/:id", name: "admin-editor-edit", component: EditorView },

            { path: "media_manager", name: "admin-media-manager", component: MediaManager },
          ],
        },

        // -------------------------
        // B. 鏡像前台介面 (Header 鏡像切換用，無側邊欄)
        // -------------------------
        { path: "home", component: HomeView },
        { path: "home/issue/:issueNumber", component: HomeView, props: true },
        { path: "mission", component: MissionView },
        { path: "articles", component: ArticleListView },
        { path: "articles/:id", component: ArticleContent },
        { path: "authors", component: AuthorView },
        { path: "authors/:name", component: AuthorDetailView },
        { path: "submit", component: SubmissionView },
        { path: "submit/issue/:issueNumber", component: SubmissionView },
        { path: "search", component: SearchView },
      ],
    },

    { path: "/:pathMatch(.*)*", redirect: "/home" },
  ],
  // 滾動行為
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
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

// 路由守衛
router.beforeEach(async (to, from, next) => {
  const requiresAuth =
    to.matched.some((record) => record.meta.requiresAuth) || to.path.startsWith("/admin");

  if (requiresAuth) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      next({ name: "login", query: { redirect: to.fullPath } });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
