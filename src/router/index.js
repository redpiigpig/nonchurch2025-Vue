import { createRouter, createWebHistory } from "vue-router";
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

// ⭐ 請把這三行註解解開 (Uncomment)
const IssueManager = () => import("../views/admin/IssueManager.vue");
const ArticleListManager = () => import("../views/admin/ArticleListManager.vue");
const AuthorManager = () => import("../views/admin/AuthorManager.vue");

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ... (前台路由保持不變) ...
    { path: "/", redirect: "/home" },
    { path: "/home", name: "home", component: HomeView },
    { path: "/home/issue/:issueNumber", name: "home-issue", component: HomeView, props: true },
    { path: "/mission", name: "mission", component: MissionView },
    { path: "/authors", name: "authors", component: AuthorView },
    {
      path: "/authors/:name",
      name: "author-detail",
      component: AuthorDetailView,
    },
    { path: "/articles", name: "article-list", component: ArticleListView },
    { path: "/articles/:id", name: "article-detail", component: ArticleContent },
    { path: "/preview", name: "article-preview", component: ArticleContent },
    { path: "/submit", name: "submit", component: SubmissionView },
    { path: "/submit/issue/:issueNumber", name: "submit-issue", component: SubmissionView },
    { path: "/search", name: "search", component: SearchView },

    // Admin root layout (可顯示後台首頁或作為子路由容器)
    {
      path: "/admin",
      name: "admin",
      component: AdminLayout,
      meta: { requiresAuth: true },
    },
    { path: "/login", name: "login", component: LoginView },

    // 後台路由
    {
      path: "/admin",
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          component: AdminLayout,
          children: [
            { path: "", redirect: "issues" },
            { path: "issues", name: "admin-issues", component: IssueManager },
            { path: "articles", name: "admin-articles", component: ArticleListManager },
            { path: "authors", name: "admin-authors", component: AuthorManager },

            { path: "editor", name: "admin-editor-new", component: EditorView },
            { path: "editor/:id", name: "admin-editor-edit", component: EditorView },
          ],
        },
        // ... (鏡像路由保持不變) ...
        { path: "home", component: HomeView },
        { path: "home/issue/:issueNumber", component: HomeView, props: true },
        { path: "mission", component: MissionView },
        { path: "authors", component: AuthorView },
        { path: "articles", component: ArticleListView },
        { path: "articles/:id", component: ArticleContent },
        { path: "submit", component: SubmissionView },
        { path: "submit/issue/:issueNumber", component: SubmissionView },
      ],
    },

    // ... (萬用路由與守衛保持不變) ...
    { path: "/:pathMatch(.*)*", redirect: "/home" },
  ],
  // ...
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
