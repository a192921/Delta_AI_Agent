<script setup>
import { ref, computed, nextTick } from 'vue';
import { 
  MessageOutlined, SendOutlined, UserOutlined, RobotOutlined,
  PlusOutlined, CloseOutlined, MinusOutlined, HistoryOutlined
} from '@ant-design/icons-vue';

// --- 狀態管理 ---
const isVisible = ref(false); // 控制對話框顯示/隱藏
const inputVal = ref('');
const scrollRef = ref(null);

// --- 對話資料 ---
const chats = ref([
  {
    id: 1,
    title: '預設對話',
    messages: [
      { id: 101, role: 'ai', content: '您好！我是 Delta AI 助手，很高興為您服務。' }
    ]
  }
]);

const currentChatId = ref(1);
const currentChat = computed(() => chats.value.find(c => c.id === currentChatId.value));

// --- 功能邏輯 ---
const toggleChat = () => {
  isVisible.value = !isVisible.value;
  if (isVisible.value) scrollToBottom();
};

const handleSend = async () => {
  if (!inputVal.value.trim()) return;

  currentChat.value.messages.push({ id: Date.now(), role: 'user', content: inputVal.value });
  inputVal.value = '';

  await scrollToBottom();

  setTimeout(async () => {
    currentChat.value.messages.push({ 
      id: Date.now() + 1, 
      role: 'ai', 
      content: '我收到了您的訊息，正在為您查詢 Delta 相關資料...' 
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
  <div class="delta-widget-container">
    <div class="float-trigger" @click="toggleChat" v-if="!isVisible">
      <div class="logo-icon-small">Δ</div>
      <span class="trigger-text">Delta AI 諮詢</span>
    </div>

    <div class="chat-window" v-if="isVisible">
      <div class="chat-header">
        <div class="header-info">
          <div class="logo-icon-v-small">Δ</div>
          <span class="header-name">Delta AI Agent</span>
        </div>
        <div class="header-ops">
          <history-outlined class="op-icon" title="對話歷史" />
          <minus-outlined class="op-icon" @click="isVisible = false" />
        </div>
      </div>

      <div class="message-body" ref="scrollRef">
        <div v-for="msg in currentChat?.messages" :key="msg.id" :class="['msg-row', msg.role]">
          <a-avatar :size="32" :class="['avatar', msg.role]">
            <template #icon>
              <UserOutlined v-if="msg.role === 'user'" />
              <RobotOutlined v-else />
            </template>
          </a-avatar>
          <div class="bubble">
            {{ msg.content }}
          </div>
        </div>
      </div>

      <div class="chat-footer">
        <a-input
          v-model:value="inputVal"
          placeholder="請輸入問題..."
          @pressEnter="handleSend"
          :bordered="false"
          class="footer-input"
        >
          <template #suffix>
            <send-outlined class="send-btn" @click="handleSend" />
          </template>
        </a-input>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 懸浮觸發按鈕 */
.float-trigger {
  position: fixed;
  right: 30px;
  bottom: 30px;
  display: flex;
  align-items: center;
  background: #1677ff;
  color: white;
  padding: 10px 20px;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.4);
  z-index: 1000;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

.float-trigger:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(22, 119, 255, 0.5);
}

.logo-icon-small {
  width: 24px; height: 24px;
  background: white; color: #1677ff;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold; margin-right: 10px;
}

/* 聊天視窗 */
.chat-window {
  position: fixed;
  right: 30px;
  bottom: 90px;
  width: 360px;
  height: 550px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  z-index: 1001;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.chat-header {
  padding: 16px;
  background: #1677ff;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info { display: flex; align-items: center; }
.logo-icon-v-small {
  width: 20px; height: 20px;
  background: rgba(255,255,255,0.2);
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  margin-right: 8px; font-size: 12px;
}
.header-name { font-weight: 600; font-size: 15px; }

.op-icon { cursor: pointer; margin-left: 12px; font-size: 16px; opacity: 0.8; }
.op-icon:hover { opacity: 1; }

/* 訊息內容 */
.message-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f7f8fa;
}

.msg-row { display: flex; gap: 10px; margin-bottom: 20px; }
.msg-row.user { flex-direction: row-reverse; }

.avatar.ai { background-color: #e6f4ff; color: #1677ff; }
.avatar.user { background-color: #f6ffed; color: #52c41a; }

.bubble {
  max-width: 80%;
  padding: 10px 14px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  font-size: 14px;
  line-height: 1.5;
}

.user .bubble {
  background: #1677ff;
  color: white;
}

/* 底部輸入 */
.chat-footer {
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #f0f0f0;
}

.footer-input {
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 8px;
}

.send-btn {
  color: #1677ff;
  cursor: pointer;
  font-size: 18px;
}
</style>