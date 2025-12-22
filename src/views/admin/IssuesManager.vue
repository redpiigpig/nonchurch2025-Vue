<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../../supabase";

const issues = ref([]);
const loading = ref(false);
const saving = ref(false);

// 編輯彈窗控制
const showModal = ref(false);
const editingIssue = ref({});

// 1. 讀取列表
const fetchIssues = async () => {
  loading.value = true;
  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    alert("讀取失敗：" + error.message);
  } else {
    issues.value = data;
  }
  loading.value = false;
};

// 2. 開啟編輯模式
const openEditModal = (issue) => {
  // 深拷貝物件，避免直接修改列表顯示
  const tempIssue = JSON.parse(JSON.stringify(issue));

  // 特殊處理：將 author_order 陣列轉為字串 (用逗號分隔)，方便編輯
  if (Array.isArray(tempIssue.author_order)) {
    tempIssue.author_order_str = tempIssue.author_order.join("、");
  } else {
    tempIssue.author_order_str = "";
  }

  editingIssue.value = tempIssue;
  showModal.value = true;
};

// 3. 儲存修改
const saveIssue = async () => {
  saving.value = true;

  try {
    // 特殊處理：將 author_order_str 轉回陣列
    let authorArray = [];
    if (editingIssue.value.author_order_str) {
      // 支援全形頓號、半形逗號、全形逗號分割
      authorArray = editingIssue.value.author_order_str
        .split(/[、,,，]/)
        .map((name) => name.trim())
        .filter((name) => name !== "");
    }

    // 準備要更新的資料 (排除不該更新的欄位如 id, created_at)
    const updates = {
      title: editingIssue.value.title,
      date: editingIssue.value.date,
      cover_img: editingIssue.value.cover_img,
      pdf_link: editingIssue.value.pdf_link,
      intro_home: editingIssue.value.intro_home,
      author_order: authorArray,

      // 下期預告相關 (CFP)
      intro_cfp: editingIssue.value.intro_cfp,
      cfp_title: editingIssue.value.cfp_title,
      cfp_image: editingIssue.value.cfp_image,
      cfp_theme: editingIssue.value.cfp_theme,
      cfp_deadline: editingIssue.value.cfp_deadline,
    };

    const { error } = await supabase.from("issues").update(updates).eq("id", editingIssue.value.id);

    if (error) throw error;

    alert(`第 ${editingIssue.value.id} 期資料更新成功！`);
    showModal.value = false;
    fetchIssues(); // 重新整理列表
  } catch (err) {
    alert("儲存失敗：" + err.message);
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchIssues();
});
</script>

<template>
  <div class="issues-manager">
    <div class="header">
      <h2>📅 期刊主題管理</h2>
      <p class="desc">
        在此編輯每一期的詳細資訊，包含封面連結、PDF 下載點、首頁簡介、以及下期徵稿預告。
        <br />
        <small>* 新增期數請至「期刊發布中心」操作。</small>
      </p>
    </div>

    <div v-if="loading" class="loading">載入中...</div>

    <div class="table-container" v-else>
      <table>
        <thead>
          <tr>
            <th width="80">期數</th>
            <th>主題 (Title)</th>
            <th>發刊日期</th>
            <th>封面預覽</th>
            <th width="100">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in issues" :key="item.id">
            <td class="text-center">Vol.{{ item.id }}</td>
            <td>{{ item.title }}</td>
            <td>{{ item.date }}</td>
            <td class="text-center">
              <img v-if="item.cover_img" :src="item.cover_img" class="preview-thumb" alt="cover" />
              <span v-else class="no-img">無圖片</span>
            </td>
            <td class="text-center">
              <button class="btn-edit" @click="openEditModal(item)">編輯</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>編輯 第 {{ editingIssue.id }} 期內容</h3>
          <button class="btn-close" @click="showModal = false">×</button>
        </div>

        <div class="modal-body">
          <fieldset>
            <legend>📖 本期資訊</legend>

            <div class="form-row">
              <div class="form-group half">
                <label>期刊主題 (Title)</label>
                <input type="text" v-model="editingIssue.title" class="input-text" />
              </div>
              <div class="form-group half">
                <label>發刊日期 (Date)</label>
                <input
                  type="text"
                  v-model="editingIssue.date"
                  placeholder="例如：2025年01-02月號"
                  class="input-text"
                />
              </div>
            </div>

            <div class="form-group">
              <label>封面圖片連結 (Cover Image URL)</label>
              <input
                type="text"
                v-model="editingIssue.cover_img"
                class="input-text"
                placeholder="https://..."
              />
              <div class="preview-box" v-if="editingIssue.cover_img">
                <img :src="editingIssue.cover_img" alt="Preview" />
              </div>
            </div>

            <div class="form-group">
              <label>PDF 檔案連結 (PDF Link)</label>
              <input
                type="text"
                v-model="editingIssue.pdf_link"
                class="input-text"
                placeholder="https://..."
              />
            </div>

            <div class="form-group">
              <label>首頁本期簡介 (Intro Home)</label>
              <textarea v-model="editingIssue.intro_home" rows="4" class="input-area"></textarea>
            </div>

            <div class="form-group">
              <label>專欄作者順序 (Author Order)</label>
              <input
                type="text"
                v-model="editingIssue.author_order_str"
                class="input-text"
                placeholder="輸入作者姓名，以逗號或頓號分隔"
              />
              <small class="hint"
                >請輸入作者姓名，使用「、」或「,」分隔。例如：張三、李四、王五</small
              >
            </div>
          </fieldset>

          <fieldset>
            <legend>📢 下期預告 / 徵稿 (CFP)</legend>

            <div class="form-row">
              <div class="form-group half">
                <label>下期主題 (CFP Title)</label>
                <input type="text" v-model="editingIssue.cfp_title" class="input-text" />
              </div>
              <div class="form-group half">
                <label>截稿日期 (CFP Deadline)</label>
                <input
                  type="text"
                  v-model="editingIssue.cfp_deadline"
                  class="input-text"
                  placeholder="例如：2025年3月31日"
                />
              </div>
            </div>

            <div class="form-group">
              <label>下期預告圖片連結 (CFP Image URL)</label>
              <input
                type="text"
                v-model="editingIssue.cfp_image"
                class="input-text"
                placeholder="https://..."
              />
              <div class="preview-box" v-if="editingIssue.cfp_image">
                <img :src="editingIssue.cfp_image" alt="CFP Preview" />
              </div>
            </div>

            <div class="form-group">
              <label>本期內文中預告文字 (Intro CFP)</label>
              <textarea
                v-model="editingIssue.intro_cfp"
                rows="3"
                class="input-area"
                placeholder="這段文字會出現在本期首頁介紹的下方"
              ></textarea>
            </div>

            <div class="form-group">
              <label>下期主題完整說明 (CFP Theme)</label>
              <textarea
                v-model="editingIssue.cfp_theme"
                rows="6"
                class="input-area"
                placeholder="顯示於「投稿資訊」頁面的完整徵稿說明"
              ></textarea>
            </div>
          </fieldset>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="showModal = false">取消</button>
          <button class="btn-save" @click="saveIssue" :disabled="saving">
            {{ saving ? "儲存中..." : "確認儲存" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.issues-manager {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* ============================
   Header 區塊 (標題與文字置中)
   ============================ */
.header {
  margin-bottom: 30px;
  text-align: center; /* ⭐ 關鍵：讓此區塊內所有文字置中 */
}

.header h2 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 1.8rem;
}

.desc {
  color: #666;
  line-height: 1.6;
  margin: 0 auto; /* 確保區塊本身也置中 */
  max-width: 800px; /* 限制寬度，避免文字太長難閱讀 */
}

/* ============================
   表格與其他樣式 (保持原本設定)
   ============================ */
.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f8f9fa;
  font-weight: bold;
  color: #444;
}

.text-center {
  text-align: center;
}

.preview-thumb {
  height: 50px;
  width: auto;
  border-radius: 4px;
  border: 1px solid #ddd;
}
.no-img {
  font-size: 0.8rem;
  color: #ccc;
}

.btn-edit {
  padding: 6px 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.2s;
}
.btn-edit:hover {
  background: #2980b9;
}

/* 彈窗樣式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
}

.modal {
  background: white;
  width: 100%;
  max-width: 800px;
  height: 90vh; /* 固定高度，內容捲動 */
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}
.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #999;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

fieldset {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 25px;
}

legend {
  font-weight: bold;
  color: #3498db;
  padding: 0 10px;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: flex;
  gap: 20px;
}
.form-group.half {
  flex: 1;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 0.95rem;
  color: #555;
}

.input-text {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.input-area {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
}

.hint {
  display: block;
  margin-top: 5px;
  font-size: 0.85rem;
  color: #888;
}

.preview-box {
  margin-top: 10px;
  padding: 5px;
  border: 1px dashed #ccc;
  border-radius: 4px;
  display: inline-block;
  background: #f9f9f9;
}
.preview-box img {
  max-height: 150px;
  max-width: 100%;
  display: block;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  padding: 10px 20px;
  background: #ccc;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-save {
  padding: 10px 20px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}
.btn-save:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

/* RWD */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
