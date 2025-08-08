// Configuration for GitHub Pages deployment
const isGitHubPages = window.location.host.includes('github.io');
const BASE_PATH = isGitHubPages ? '/wayne-ai-v1/' : '/';
const ASSET_PATH = isGitHubPages 
  ? 'https://raw.githubusercontent.com/Smartburme/wayne-ai-v1/main/src/' 
  : '../';

document.addEventListener('DOMContentLoaded', async function() {
  // DOM Elements
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const fileUpload = document.getElementById('file-upload');
  const newChatBtn = document.querySelector('.new-chat-btn');
  const sidebarHistory = document.querySelector('.chat-history');

  // Current conversation state
  let currentConversation = {
    id: generateConversationId(),
    messages: [],
    createdAt: new Date(),
    context: {}
  };

  // Initialize chat
  await initChat();

  // Event Listeners
  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  fileUpload.addEventListener('change', handleFileUpload);
  newChatBtn.addEventListener('click', startNewChat);

  // Functions
  function generateConversationId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async function initChat() {
    await loadConversationHistory();
    addAIMessage("ဟယ်လို! Wayne AI မှကြိုဆိုပါသည်။ ကျွန်ုပ်ကိုဘာတွေမေးမြန်းချင်ပါသလဲ?");
    saveConversationState();
  }

  async function startNewChat() {
    await saveConversationToHistory();
    chatMessages.innerHTML = '';
    
    currentConversation = {
      id: generateConversationId(),
      messages: [],
      createdAt: new Date(),
      context: {}
    };
    
    addAIMessage("ဆွေးနွေးမှုအသစ်စတင်ပါပြီ။ Wayne AI မှကြိုဆိုပါသည်။");
    saveConversationState();
  }

  async function loadConversationHistory() {
    try {
      const history = JSON.parse(localStorage.getItem('wayne-ai-conversations') || '[]');
      sidebarHistory.innerHTML = '';
      
      history.forEach(convo => {
        const convoEl = document.createElement('div');
        convoEl.className = 'history-item';
        convoEl.textContent = convo.messages[0]?.text?.substring(0, 30) || 'New Conversation';
        convoEl.addEventListener('click', () => loadConversation(convo.id));
        sidebarHistory.appendChild(convoEl);
      });
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  }

  async function loadConversation(convoId) {
    try {
      const history = JSON.parse(localStorage.getItem('wayne-ai-conversations') || '[]');
      const convo = history.find(c => c.id === convoId);
      
      if (convo) {
        await saveConversationToHistory();
        chatMessages.innerHTML = '';
        currentConversation = convo;
        
        convo.messages.forEach(msg => {
          if (msg.type === 'user') {
            addUserMessage(msg.text, msg.image, true);
          } else {
            addAIMessage(msg.text, msg.code, msg.image, true);
          }
        });
        
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }

  async function saveConversationToHistory() {
    try {
      if (currentConversation.messages.length === 0) return;
      
      const history = JSON.parse(localStorage.getItem('wayne-ai-conversations') || '[]');
      const existingIndex = history.findIndex(c => c.id === currentConversation.id);
      
      if (existingIndex >= 0) {
        history[existingIndex] = currentConversation;
      } else {
        history.push(currentConversation);
      }
      
      localStorage.setItem('wayne-ai-conversations', JSON.stringify(history));
      await loadConversationHistory();
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }

  function saveConversationState() {
    try {
      const history = JSON.parse(localStorage.getItem('wayne-ai-conversations') || '[]');
      const existingIndex = history.findIndex(c => c.id === currentConversation.id);
      
      if (existingIndex >= 0) {
        history[existingIndex] = currentConversation;
        localStorage.setItem('wayne-ai-conversations', JSON.stringify(history));
      }
    } catch (error) {
      console.error('Error saving conversation state:', error);
    }
  }

  function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
      addUserMessage(message);
      userInput.value = '';
      processUserMessage(message);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addAIMessage("ကျေးဇူးပြု၍ 5MB ထက်မကြီးသော ဓာတ်ပုံဖိုင်ကိုသာ အပ်လုဒ်လုပ်ပါ။");
      return;
    }

    if (file.type.startsWith('image/')) {
      showUploadProgress();
      
      const reader = new FileReader();
      reader.onload = async function(event) {
        hideUploadProgress();
        addUserMessage("", event.target.result);
        
        try {
          const response = await processImageMessage(event.target.result);
          if (response.image) {
            addAIMessage(response.text, null, response.image);
          } else {
            addAIMessage(response.text);
          }
        } catch (error) {
          console.error("Image processing error:", error);
          addAIMessage("ဓာတ်ပုံဆန်းစစ်ရာတွင် အမှားတစ်ခုဖြစ်ပေါ်ခဲ့သည်။");
        }
      };
      reader.readAsDataURL(file);
    } else {
      addAIMessage("ကျေးဇူးပြု၍ JPEG, PNG သို့မဟုတ် GIF ဖိုင်မျိုးသာ တင်ပါ။");
    }
    e.target.value = '';
  }

  function showUploadProgress() {
    const progressDiv = document.createElement('div');
    progressDiv.className = 'upload-progress';
    progressDiv.innerHTML = `
      <div class="progress-bar">
        <div class="progress"></div>
      </div>
      <div class="progress-text">ဓာတ်ပုံကိုတင်နေပါသည်...</div>
    `;
    chatMessages.appendChild(progressDiv);
    scrollToBottom();
  }

  function hideUploadProgress() {
    const progressDiv = document.querySelector('.upload-progress');
    if (progressDiv) progressDiv.remove();
  }

  function addUserMessage(text, image = null, isHistoryLoad = false) {
    const messageId = 'msg-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.id = messageId;
    
    if (text) {
      messageDiv.textContent = text;
    }
    
    if (image) {
      const imgContainer = document.createElement('div');
      imgContainer.className = 'image-container';
      
      const imgElement = document.createElement('img');
      imgElement.src = image;
      imgElement.className = 'message-image';
      imgElement.loading = 'lazy';
      
      imgContainer.appendChild(imgElement);
      messageDiv.appendChild(imgContainer);
    }
    
    if (!isHistoryLoad) {
      chatMessages.appendChild(messageDiv);
      scrollToBottom();
    }
    
    currentConversation.messages.push({
      id: messageId,
      type: 'user',
      text: text,
      image: image,
      timestamp: new Date()
    });
    
    if (!isHistoryLoad) {
      saveConversationState();
    }
  }

  function addAIMessage(text, code = null, image = null, isHistoryLoad = false) {
    const messageId = 'msg-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    messageDiv.id = messageId;
    
    if (text) {
      messageDiv.innerHTML = text; // Markdown parsing removed for GitHub compatibility
    }
    
    if (code) {
      const codeHeader = document.createElement('div');
      codeHeader.className = 'code-header';
      codeHeader.innerHTML = `
        <span>ကုဒ်</span>
        <button class="copy-btn" onclick="copyCode(this)">ကူးမည်</button>
      `;
      
      const codeBlock = document.createElement('pre');
      codeBlock.className = 'code-block';
      codeBlock.textContent = code;
      
      const codeContainer = document.createElement('div');
      codeContainer.className = 'code-container';
      codeContainer.appendChild(codeHeader);
      codeContainer.appendChild(codeBlock);
      
      messageDiv.appendChild(codeContainer);
    }
    
    if (image) {
      const imgContainer = document.createElement('div');
      imgContainer.className = 'image-container';
      
      const imgElement = document.createElement('img');
      imgElement.src = image;
      imgElement.className = 'message-image';
      imgElement.loading = 'lazy';
      
      imgContainer.appendChild(imgElement);
      messageDiv.appendChild(imgContainer);
    }
    
    const actionDiv = document.createElement('div');
    actionDiv.className = 'message-actions';
    actionDiv.innerHTML = `
      <button class="action-btn" onclick="regenerateResponse('${messageId}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4V8H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H8M20 16V20H19.4185M19.4185 20C18.2317 17.9318 15.3574 16 12 16C7.92038 16 4.55399 18.9463 4.06189 23M19.4185 20H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        ပြန်ဖြည့်မည်
      </button>
      <button class="action-btn" onclick="copyMessage('${messageId}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 16H6C4.89543 16 4 15.1046 4 14V6C4 4.89543 4.89543 4 6 4H14C15.1046 4 16 4.89543 16 6V8M10 20H18C19.1046 20 20 19.1046 20 18V10C20 8.89543 19.1046 8 18 8H10C8.89543 8 8 8.89543 8 10V18C8 19.1046 8.89543 20 10 20Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        ကူးမည်
      </button>
    `;
    messageDiv.appendChild(actionDiv);
    
    if (!isHistoryLoad) {
      chatMessages.appendChild(messageDiv);
      scrollToBottom();
    }
    
    currentConversation.messages.push({
      id: messageId,
      type: 'ai',
      text: text,
      code: code,
      image: image,
      timestamp: new Date()
    });
    
    if (!isHistoryLoad) {
      saveConversationState();
    }
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function processUserMessage(message) {
    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message loading-message';
    loadingDiv.id = loadingId;
    loadingDiv.innerHTML = `
      <div class="loading-content">
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="loading-text">Wayne AI စဉ်းစားနေပါသည်...</div>
      </div>
    `;
    chatMessages.appendChild(loadingDiv);
    scrollToBottom();
    
    try {
      const response = await fetchAIResponse(message);
      
      const loadingElement = document.getElementById(loadingId);
      if (loadingElement) loadingElement.remove();
      
      if (response.code) {
        addAIMessage(response.text, response.code);
      } else {
        addAIMessage(response.text);
      }
    } catch (error) {
      const loadingElement = document.getElementById(loadingId);
      if (loadingElement) loadingElement.remove();
      
      addAIMessage("တောင်းပန်ပါသည်၊ အမှားတစ်ခုဖြစ်ပေါ်ခဲ့သည်။ ကျေးဇူးပြု၍ နောက်မှထပ်ကြိုးစားပါ။");
      console.error("Error processing message:", error);
    }
  }

  async function fetchAIResponse(message) {
    // For GitHub Pages compatibility, using a simple response
    // In a real implementation, you would call your AI backend
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          text: "ကျေးဇူးပြု၍ Wayne AI ၏ အပြည့်အစုံ feature များကို local server တွင် run ပါ။ GitHub Pages တွင် AI engine ကို တိုက်ရိုက်ချိတ်ဆက်၍မရပါ။",
          code: null
        });
      }, 1500);
    });
  }

  async function processImageMessage(imageData) {
    // Placeholder for image processing
    return {
      text: "ဓာတ်ပုံဆန်းစစ်မှုအား local server တွင်သာ အပြည့်အစုံအသုံးပြုနိုင်ပါသည်။",
      image: null
    };
  }
});

// Global functions
window.copyCode = function(button) {
  const codeBlock = button.closest('.code-header').nextElementSibling;
  navigator.clipboard.writeText(codeBlock.textContent).then(() => {
    const originalText = button.textContent;
    button.textContent = 'ကူးပြီး!';
    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  });
};

window.copyMessage = function(messageId) {
  const messageDiv = document.getElementById(messageId);
  const textToCopy = messageDiv.textContent.replace(/ကူးမည်ပြန်ဖြည့်မည်/g, '').trim();
  navigator.clipboard.writeText(textToCopy).then(() => {
    alert('မက်ဆေ့ချ်ကိုကူးယူပြီးပါပြီ!');
  });
};

window.regenerateResponse = async function(messageId) {
  const messageDiv = document.getElementById(messageId);
  const prevMessage = messageDiv.previousElementSibling;
  
  if (prevMessage && prevMessage.classList.contains('user-message')) {
    const userMessage = prevMessage.textContent;
    messageDiv.innerHTML = `
      <div class="loading-content">
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="loading-text">အဖြေကိုပြန်လည်ထုတ်ပေးနေပါသည်...</div>
      </div>
    `;
    
    try {
      const response = await fetchAIResponse(userMessage);
      messageDiv.outerHTML = '';
      if (response.code) {
        addAIMessage(response.text, response.code);
      } else {
        addAIMessage(response.text);
      }
    } catch (error) {
      messageDiv.outerHTML = '';
      addAIMessage("တောင်းပန်ပါသည်၊ အဖြေပြန်လည်ထုတ်ပေးရာတွင် အမှားတစ်ခုဖြစ်ပေါ်ခဲ့သည်။");
    }
  }
};

// Helper function for GitHub Pages asset loading
function loadAsset(path) {
  return isGitHubPages 
    ? `${ASSET_PATH}${path}` 
    : `../${path}`;
}

// Update logo sources for GitHub Pages
document.querySelectorAll('img[src*="../images/"]').forEach(img => {
  const originalSrc = img.getAttribute('src');
  img.src = originalSrc.replace('../', loadAsset('images/'));
});
