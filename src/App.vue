<script setup>
import { ref, computed, nextTick, onMounted } from 'vue';
import axios from 'axios';
import { 
  MenuUnfoldOutlined, MenuFoldOutlined, PlusOutlined,
  MessageOutlined, SendOutlined, UserOutlined, RobotOutlined,
  EditOutlined, CheckOutlined, DeleteOutlined
} from '@ant-design/icons-vue';
import { message as antMessage } from 'ant-design-vue';

// --- 狀態管理 ---
const isCollapsed = ref(false);
const inputVal = ref('');
const scrollRef = ref(null);
const editingId = ref(null); 
const editValue = ref('');
const isLoading = ref(false);

// --- 對話資料管理 ---
const chats = ref([]);
const currentChatId = ref(null); // 此 ID 對應後端的 session_id

// 取得當前選中的對話物件
const currentChat = computed(() => chats.value.find(c => c.id === currentChatId.value));

// --- 功能邏輯 ---

// 1. 初始化 (GET)
const fetchHistory = async () => {
  // 預設建立一個起始對話，避免畫面空白
  if (chats.value.length === 0) {
    createNewChat("新對話 1");
  }
};

// 2. 開啟新對話 (生成新的 session_id)
const createNewChat = (customTitle = null) => {
  const sessionId = `session_${Date.now()}`; 
  const newChat = {
    id: sessionId, 
    title: customTitle || `新對話 ${chats.value.length + 1}`,
    messages: [
      { id: `ai_${Date.now()}`, role: 'ai', content: '您好！我是 Delta AI Agent，請問今天有什麼可以幫您的？' }
    ]
  };
  chats.value.unshift(newChat);
  currentChatId.value = sessionId;
  antMessage.success('已建立新對話');
};

// 3. 處理鍵盤事件 (Enter 發送, Shift + Enter 換行)
const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};

// 4. 發送訊息 (POST)
const handleSend = async () => {
  const trimmedMsg = inputVal.value.trim();
  if (!trimmedMsg || isLoading.value) return;

  const userQuery = trimmedMsg;
  const targetSessionId = currentChatId.value;

  // UI 即時更新使用者訊息
  currentChat.value.messages.push({ 
    id: `u_${Date.now()}`, 
    role: 'user', 
    content: userQuery 
  });
  
  inputVal.value = '';
  await scrollToBottom();

  try {
    isLoading.value = true;
    
    // 符合要求：傳送 message 與 session_id
    const response = await axios.post('/api/chat', {
      message: userQuery,
      session_id: targetSessionId
    });

    // 處理回傳：從 respond 欄位取得資料
    const aiReply = response.data.respond; 

    if (aiReply) {
      currentChat.value.messages.push({ 
        id: `ai_${Date.now()}`, 
        role: 'ai', 
        content: aiReply
      });
    } else {
      console.warn("API 成功但 respond 欄位缺失:", response.data);
      antMessage.warning('未能取得有效回覆內容');
    }

  } catch (error) {
    console.error("API Error:", error);
    antMessage.error('通訊失敗，請檢查連線');
    
    currentChat.value.messages.push({ 
      id: `err_${Date.now()}`, 
      role: 'ai', 
      content: '抱歉，系統目前連線異常，請稍後再試。' 
    });
  } finally {
    isLoading.value = false;
    await scrollToBottom();
  }
};

// 5. 其他 UI 操作 (編輯與刪除)
const startEdit = (chat) => {
  editingId.value = chat.id;
  editValue.value = chat.title;
};

const saveEdit = (chat) => {
  if (editValue.value.trim()) chat.title = editValue.value;
  editingId.value = null;
};

const deleteChat = (id) => {
  if (chats.value.length === 1) return antMessage.warning('需保留至少一個對話');
  chats.value = chats.value.filter(c => c.id !== id);
  if (currentChatId.value === id) currentChatId.value = chats.value[0].id;
};

const scrollToBottom = async () => {
  await nextTick();
  if (scrollRef.value) {
    scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
  }
};

onMounted(fetchHistory);
</script>

<template>
  <a-layout class="layout-wrapper">
    <a-layout-sider v-model:collapsed="isCollapsed" collapsible :trigger="null" width="280" theme="dark">
      <div class="logo-area">
        <div class="logo-icon">Δ</div>
        <span v-if="!isCollapsed" class="logo-text">Delta AI Agent</span>
      </div>

      <div class="action-btn-area">
        <a-button type="primary" block @click="createNewChat" :ghost="isCollapsed">
          <template #icon><PlusOutlined /></template>
          <span v-if="!isCollapsed">開啟新對話</span>
        </a-button>
      </div>

      <a-menu 
        theme="dark" mode="inline" 
        :selected-keys="[String(currentChatId)]"
        @click="({ key }) => (currentChatId = key)"
        class="history-menu"
      >
        <div v-if="!isCollapsed" class="sidebar-label">歷史紀錄</div>
        <a-menu-item v-for="chat in chats" :key="chat.id" class="chat-menu-item">
          <div class="menu-item-content">
            <MessageOutlined />
            <a-input
              v-if="editingId === chat.id"
              v-model:value="editValue"
              size="small"
              class="edit-input"
              @click.stop @pressEnter="saveEdit(chat)" @blur="saveEdit(chat)"
            >
              <template #suffix><check-outlined @click.stop="saveEdit(chat)" /></template>
            </a-input>
            <template v-else>
              <span class="chat-title">{{ chat.title }}</span>
              <div class="item-actions" v-if="!isCollapsed">
                <edit-outlined class="action-icon" @click.stop="startEdit(chat)" />
                <a-popconfirm title="確定刪除？" @confirm="deleteChat(chat.id)">
                  <delete-outlined class="action-icon delete" @click.stop />
                </a-popconfirm>
              </div>
            </template>
          </div>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="header">
        <div class="header-left">
          <menu-unfold-outlined v-if="isCollapsed" class="trigger" @click="isCollapsed = !isCollapsed" />
          <menu-fold-outlined v-else class="trigger" @click="isCollapsed = !isCollapsed" />
          <span class="header-title">{{ currentChat?.title }}</span>
        </div>
      </a-layout-header>

      <a-layout-content class="chat-main">
        <div class="message-list" ref="scrollRef">
          <div v-for="msg in currentChat?.messages" :key="msg.id" :class="['msg-row', msg.role]">
            <a-avatar :size="36" :class="['avatar', msg.role]">
              <template #icon>
                <UserOutlined v-if="msg.role === 'user'" />
                <RobotOutlined v-else />
              </template>
            </a-avatar>
            <div class="bubble-container">
              <div class="bubble">{{ msg.content }}</div>
            </div>
          </div>
        </div>

        <div class="input-area">
          <div class="input-container">
            <div class="input-wrapper">
              <a-textarea
                v-model:value="inputVal"
                placeholder="發送訊息... (Shift + Enter 換行)"
                :auto-size="{ minRows: 1, maxRows: 6 }"
                class="custom-textarea"
                @keydown="handleKeyDown"
              />
              <div class="send-btn-wrapper">
                <a-button 
                  type="primary" shape="circle" 
                  :loading="isLoading" 
                  @click="handleSend"
                  :disabled="!inputVal.trim()"
                >
                  <template #icon><SendOutlined /></template>
                </a-button>
              </div>
            </div>
          </div>
          <div class="footer-hint">回應由 Delta AI 生成。通訊格式：{ message, session_id }</div>
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.layout-wrapper { height: 100vh; overflow: hidden; display: flex; }

/* 側邊欄樣式 */
.logo-area { height: 64px; display: flex; align-items: center; padding: 0 20px; background: #001529; color: white; }
.logo-icon { width: 32px; height: 32px; background: linear-gradient(135deg, #1890ff 0%, #52c41a 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; }
.logo-text { margin-left: 12px; font-size: 16px; font-weight: 600; white-space: nowrap; }
.action-btn-area { padding: 16px; }
.sidebar-label { padding: 8px 24px; color: #595959; font-size: 12px; }

.menu-item-content { display: flex; align-items: center; width: 100%; }
.chat-title { flex: 1; margin-left: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-actions { display: flex; gap: 8px; opacity: 0; transition: opacity 0.2s; }
.chat-menu-item:hover .item-actions { opacity: 1; }
.action-icon { font-size: 14px; color: #8c8c8c; cursor: pointer; }
.action-icon:hover { color: #1890ff; }
.action-icon.delete:hover { color: #ff4d4f; }
.edit-input { margin-left: 10px; background: #1f1f1f; color: white; border: 1px solid #434343; }

.header { background: #fff; padding: 0 24px; display: flex; align-items: center; border-bottom: 1px solid #f0f0f0; }
.trigger { font-size: 18px; cursor: pointer; }
.header-title { margin-left: 16px; font-weight: 600; color: #262626; }

.chat-main { display: flex; flex-direction: column; background: #ffffff; flex: 1; }
.message-list { flex: 1; overflow-y: auto; padding: 40px 15%; scroll-behavior: smooth; }
.msg-row { display: flex; margin-bottom: 32px; gap: 16px; }
.msg-row.user { flex-direction: row-reverse; }

.avatar.ai { background-color: #f0f5ff; color: #1890ff; border: 1px solid #adc6ff; }
.avatar.user { background-color: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; }

.bubble-container { max-width: 80%; }
.bubble { 
  padding: 12px 16px; border-radius: 12px; font-size: 15px; line-height: 1.6;
  background: #f4f4f4; color: #262626;
  white-space: pre-wrap; /* 支援多行顯示 */
  word-break: break-word;
}
.user .bubble { background: #1890ff; color: white; }

.input-area { padding: 24px 15% 16px; background: white; border-top: 1px solid #f0f0f0; }
.input-container { max-width: 840px; margin: 0 auto; }
.input-wrapper {
  display: flex; align-items: flex-end; background: #f4f4f4;
  border-radius: 12px; padding: 8px 12px; border: 1px solid transparent;
}
.input-wrapper:focus-within { background: #fff; border-color: #1890ff; box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1); }
.custom-textarea { flex: 1; border: none !important; background: transparent !important; box-shadow: none !important; resize: none; font-size: 15px; }
.send-btn-wrapper { margin-left: 8px; margin-bottom: 2px; }
.footer-hint { text-align: center; font-size: 12px; color: #bfbfbf; margin-top: 12px; }

:deep(.ant-menu-item-selected) { background-color: #111a2c !important; }
</style>