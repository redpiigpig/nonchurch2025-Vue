<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router"; // 1. 多引入 useRoute
import { supabase } from "../supabase";

const email = ref("");
const password = ref("");
const loading = ref(false);
const router = useRouter();
const route = useRoute(); // 2. 取得當前路由資訊

const handleLogin = async () => {
  loading.value = true;
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (error) throw error;

    alert("登入成功！");

    // 3. 關鍵修改：檢查是否有「原本想去的頁面」
    // 如果有 redirect 參數 (例如 ?redirect=/admin/home)，就跳過去
    // 如果沒有，預設跳轉到 /admin
    const redirectPath = route.query.redirect || "/admin";
    router.push(redirectPath);
  } catch (error) {
    alert("登入失敗：" + error.message);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <h2>編輯者登入</h2>
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <button @click="handleLogin" :disabled="loading">
        {{ loading ? "登入中..." : "登入" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
}
.login-box {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 40px;
  background: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  width: 300px;
}
input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
button {
  padding: 10px;
  background: #333;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
button:disabled {
  background: #999;
}
</style>
