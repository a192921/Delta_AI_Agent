<script setup>
import { ref, computed, nextTick } from 'vue';
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

// --- 對話資料 ---
const chats = ref([
  {
    id: 1,
    title: '關於 Delta AI 的介紹',
    messages: [
      { id: 101, role: 'ai', content: '您好！我是 Delta AI Agent。我已經準備好協助您進行開發、分析或創意發想。' }
    ]
  }
]);

const currentChatId = ref(1);
const currentChat = computed(() => chats.value.find(c => c.id === currentChatId.value));

// --- 功能邏輯 ---

// 1. 開啟新對話
const createNewChat = () => {
  const newId = Date.now();
  const newChat = {
    id: newId,
    title: `新對話 ${chats.value.length + 1}`,
    messages: [{ id: Date.now() + 1, role: 'ai', content: '新對話已開啟，請問今天想聊些什麼？' }]
  };
  chats.value.unshift(newChat);
  currentChatId.value = newId;
  antMessage.success('已建立新對話');
};

// 2. 編輯名稱
const startEdit = (chat) => {
  editingId.value = chat.id;
  editValue.value = chat.title;
};

const saveEdit = (chat) => {
  if (editValue.value.trim()) {
    chat.title = editValue.value;
  }
  editingId.value = null;
};

// 3. 刪除對話
const deleteChat = (id) => {
  if (chats.value.length === 1) {
    antMessage.warning('至少需保留一個對話');
    return;
  }
  chats.value = chats.value.filter(c => c.id !== id);
  if (currentChatId.value === id) {
    currentChatId.value = chats.value[0].id;
  }
};

// 4. 發送訊息
const handleSend = async () => {
  if (!inputVal.value.trim()) return;

  const userQuery = inputVal.value;
  currentChat.value.messages.push({ id: Date.now(), role: 'user', content: userQuery });
  inputVal.value = '';

  await scrollToBottom();

  // 模擬 AI 回覆
  setTimeout(async () => {
    currentChat.value.messages.push({ 
      id: Date.now() + 1, 
      role: 'ai', 
      content: `[Delta AI 模擬回覆]：關於「${userQuery}」，這是一個很好的問題！我們可以使用 Vue 3 與 Ant Design 快速實作這項功能。` 
    });
    await scrollToBottom();
  }, 800);
};

const scrollToBottom = async () => {
  await nextTick();
  if (scrollRef.value) {
    scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
  }
};
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
        theme="dark" 
        mode="inline" 
        :selected-keys="[String(currentChatId)]"
        @click="({ key }) => (currentChatId = Number(key))"
        class="history-menu"
      >
        <div v-if="!isCollapsed" class="sidebar-label">歷史紀錄</div>
        <a-menu-item v-for="chat in chats" :key="String(chat.id)" class="chat-menu-item">
          <div class="menu-item-content">
            <MessageOutlined />
            
            <a-input
              v-if="editingId === chat.id"
              v-model:value="editValue"
              size="small"
              class="edit-input"
              @click.stop
              @pressEnter="saveEdit(chat)"
              @blur="saveEdit(chat)"
            >
              <template #suffix><check-outlined @click.stop="saveEdit(chat)" /></template>
            </a-input>

            <template v-else>
              <span class="chat-title">{{ chat.title }}</span>
              <div class="item-actions" v-if="!isCollapsed">
                <edit-outlined class="action-icon" @click.stop="startEdit(chat)" />
                <a-popconfirm title="確定刪除此對話？" @confirm="deleteChat(chat.id)">
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
              <div class="bubble">
                {{ msg.content }}
              </div>
            </div>
          </div>
        </div>

        <div class="input-area">
          <div class="input-container">
            <a-input-search
              v-model:value="inputVal"
              placeholder="給 Delta AI Agent 發送訊息..."
              size="large"
              @search="handleSend"
            >
              <template #enterButton>
                <a-button type="primary"><SendOutlined /></a-button>
              </template>
            </a-input-search>
          </div>
          <div class="footer-hint">Delta AI 可能會出錯。請考慮核查重要資訊。</div>
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.layout-wrapper { height: 100vh; overflow: hidden; }

/* 側邊欄 Logo */
.logo-area {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: #001529;
  color: white;
}
.logo-icon {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, #1890ff 0%, #52c41a 100%);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold; flex-shrink: 0;
}
.logo-text { margin-left: 12px; font-size: 16px; font-weight: 600; white-space: nowrap; }

.action-btn-area { padding: 16px; }
.sidebar-label { padding: 8px 24px; color: #595959; font-size: 12px; }

/* 歷史紀錄項目 */
.menu-item-content { display: flex; align-items: center; width: 100%; }
.chat-title { flex: 1; margin-left: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-actions { display: flex; gap: 8px; opacity: 0; transition: opacity 0.2s; }
.chat-menu-item:hover .item-actions { opacity: 1; }
.action-icon { font-size: 14px; color: #8c8c8c; }
.action-icon:hover { color: #1890ff; }
.action-icon.delete:hover { color: #ff4d4f; }
.edit-input { margin-left: 10px; background: #1f1f1f; border: 1px solid #434343; color: white; }

/* 右側 Header */
.header { background: #fff; padding: 0 24px; display: flex; align-items: center; border-bottom: 1px solid #f0f0f0; }
.trigger { font-size: 18px; cursor: pointer; }
.header-title { margin-left: 16px; font-weight: 600; color: #262626; }

/* 聊天內容 */
.chat-main { display: flex; flex-direction: column; background: #ffffff; }
.message-list { flex: 1; overflow-y: auto; padding: 40px 15%; }
.msg-row { display: flex; margin-bottom: 32px; gap: 16px; }
.msg-row.user { flex-direction: row-reverse; }

.avatar.ai { background-color: #f0f5ff; color: #1890ff; border: 1px solid #adc6ff; }
.avatar.user { background-color: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; }

.bubble-container { max-width: 80%; }
.bubble { 
  padding: 12px 16px; border-radius: 12px; font-size: 15px; line-height: 1.6;
  background: #f4f4f4; color: #262626;
}
.user .bubble { background: #1890ff; color: white; }

/* 輸入區域 */
.input-area { padding: 24px 15% 16px; background: white; }
.input-container { max-width: 840px; margin: 0 auto; }
.footer-hint { text-align: center; font-size: 12px; color: #bfbfbf; margin-top: 12px; }

/* 針對 AntD Menu 的微調 */
:deep(.ant-menu-item-selected) { background-color: #111a2c !important; }
</style>