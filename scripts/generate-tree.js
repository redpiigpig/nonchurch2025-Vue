#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();
const OUTFILE = path.join(ROOT, "tree.txt");
const IGNORES = new Set(["node_modules", ".git", "dist", "tree.txt"]);

function formatDate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function walk(dir, relative = "") {
  const entries = [];
  const full = path.join(dir, relative);
  let names;
  try {
    names = await fs.readdir(full, { withFileTypes: true });
  } catch (e) {
    return entries;
  }

  // sort: directories first, then files, alphabetical
  names.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
  });

  for (const dirent of names) {
    const name = dirent.name;
    if (IGNORES.has(name)) continue;
    const relPath = path.join(relative, name);
    const fullPath = path.join(dir, relPath);

    if (dirent.isDirectory()) {
      const children = await walk(dir, relPath);
      entries.push({ type: "dir", name, path: relPath, children });
    } else if (dirent.isFile()) {
      const stat = await fs.stat(fullPath);
      entries.push({
        type: "file",
        name,
        path: relPath,
        mtime: stat.mtime,
        size: stat.size,
      });
    }
  }

  return entries;
}

function renderTree(entries, prefix = "") {
  const lines = [];
  entries.forEach((entry, idx) => {
    const isLast = idx === entries.length - 1;
    const pointer = isLast ? "└── " : "├── ";
    if (entry.type === "dir") {
      lines.push(`${prefix}${pointer}${entry.name}/`);
      const childPrefix = prefix + (isLast ? "    " : "│   ");
      lines.push(...renderTree(entry.children, childPrefix));
    } else {
      const mtime = entry.mtime ? ` (${formatDate(new Date(entry.mtime))})` : "";
      const label = getChineseLabel(entry.path || entry.name);
      const labelStr = label ? ` ${label}` : "";
      lines.push(`${prefix}${pointer}${entry.name}${mtime}${labelStr}`);
    }
  });
  return lines;
}

// A small mapping from paths / filenames to Chinese titles
function getChineseLabel(relPath) {
  const map = {
    "src/App.vue": "根組件",
    "src/main.js": "應用入口",
    "src/supabase.js": "Supabase 初始化",
    "src/assets/article.css": "文章樣式",
    "src/assets/base.css": "基礎樣式",
    "src/components": "共用元件資料夾",
    "src/components/AppHeader.vue": "頁首元件",
    "src/components/AppFooter.vue": "頁尾元件",
    "src/components/MainLayout.vue": "主要版面配置",
    "src/components/icons": "圖示元件",
    "src/router/index.js": "路由設定",
    "src/composables/useEditorMode.js": "編輯模式工具函式",
    "src/stores/tempArticles.js": "暫存文章資料",
    "src/data/authors.js": "作者資料",
    "src/data/issues.js": "期數資料",
    "src/data/submissionThemes.js": "投稿主題清單",
    "src/views/HomeView.vue": "首頁",
    "src/views/ArticleListView.vue": "文章列表",
    "src/views/ArticleContent.vue": "文章內容",
    "src/views/AuthorView.vue": "作者頁面",
    "src/views/AuthorDetailView.vue": "作者詳細頁",
    "src/views/LoginView.vue": "登入頁",
    "src/views/MissionView.vue": "使命宣言",
    "src/views/SearchView.vue": "搜尋頁",
    "src/views/SubmissionView.vue": "投稿頁",
    "src/views/admin/AdminLayout.vue": "後台佈局",
    "src/views/admin/EditorView.vue": "編輯器頁面",
    "src/views/admin/ArticleListManager.vue": "文章管理",
    "src/views/admin/AuthorManager.vue": "作者管理",
    "src/views/admin/IssueManager.vue": "期數管理",
  };

  // exact match first
  if (map[relPath]) return map[relPath];

  // try filename match
  const filename = relPath.split("/").pop();
  for (const key in map) {
    if (key.endsWith(filename)) return map[key];
  }

  return "";
}

async function generate() {
  const stats = await fs.stat(ROOT);
  const now = new Date();
  const header = [`Generated: ${formatDate(now)}`, `Root: ${ROOT}`, ""];

  const entries = await walk(ROOT);

  // Render top-level similar to previous formatting
  const lines = ["magazine-web/"];
  // We will render top-level entries from 'entries'
  const topLines = [];
  entries.forEach((entry, idx) => {
    const isLast = idx === entries.length - 1;
    const pointer = isLast ? "└── " : "├── ";

    // Special-case: summarize `public/` contents (display children as simplified)
    if (entry.type === "dir" && entry.name === "public") {
      topLines.push(`${pointer}public/`);
      const childPrefix = isLast ? "    " : "│   ";
      // list immediate children but do not recurse into them
      entry.children.forEach((child, cidx) => {
        const childIsLast = cidx === entry.children.length - 1;
        const childPointer = childIsLast ? "└── " : "├── ";
        // mark as simplified
        topLines.push(`${childPrefix}${childPointer}${child.name}/ (簡略)`);
      });
    } else if (entry.type === "dir") {
      topLines.push(`${pointer}${entry.name}/`);
      const childPrefix = isLast ? "    " : "│   ";
      topLines.push(...renderTree(entry.children, childPrefix));
    } else {
      const mtime = entry.mtime ? ` (${formatDate(new Date(entry.mtime))})` : "";
      const label = getChineseLabel(entry.path || entry.name);
      const labelStr = label ? ` ${label}` : "";
      topLines.push(`${pointer}${entry.name}${mtime}${labelStr}`);
    }
  });

  const output = [...header, ...lines, ...topLines].join("\n") + "\n";
  await fs.writeFile(OUTFILE, output, "utf8");
  console.log(`Wrote ${OUTFILE}`);
}

function usageAndExit() {
  console.log("Usage: node scripts/generate-tree.js [--watch]");
  process.exit(1);
}

async function main() {
  const argv = process.argv.slice(2);
  const watch = argv.includes("--watch");

  await generate();

  if (watch) {
    // try to load chokidar
    let chokidar;
    try {
      chokidar = (await import("chokidar")).default;
    } catch (e) {
      console.error("To use --watch please install chokidar: npm install -D chokidar");
      process.exit(1);
    }

    const watcher = chokidar.watch(["**/*"], {
      ignored: (p) => {
        // ignore node_modules, .git and the generated file
        return p.includes("node_modules") || p.includes(".git") || p.endsWith("tree.txt");
      },
      ignoreInitial: true,
    });

    let timeout = null;
    const regen = () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        try {
          await generate();
        } catch (e) {
          console.error("Error generating tree:", e);
        }
      }, 200);
    };

    watcher.on("add", regen);
    watcher.on("change", regen);
    watcher.on("unlink", regen);
    watcher.on("addDir", regen);
    watcher.on("unlinkDir", regen);

    console.log("Watching for file changes to regenerate tree.txt...");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
