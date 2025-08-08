// Configuration
const API_BASE_URL = 'https://wayne-ai-v1.mysvm.workers.dev'; // Replace with your actual Worker URL
let currentChatId = generateChatId();
let isWaitingForResponse = false;

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const fileUpload = document.getElementById('file-upload');
const newChatBtn = document.querySelector('.new-chat-btn');
const chatHistory = document.querySelector('.chat-history');
const sidebarToggle = document.getElementById('sidebar-toggle');
const refreshBtn = document.getElementById('refresh-btn');

// Initialize the app
function init() {
    loadChatHistory();
    setupEventListeners();
}

// Generate unique chat ID
function generateChatId() {
    return 'chat-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Set up all event listeners
function setupEventListeners() {
    // Message sending
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isWaitingForResponse) sendMessage();
    });

    // Chat management
    newChatBtn.addEventListener('click', startNewChat);
    refreshBtn.addEventListener('click', confirmNewChat);
    sidebarToggle.addEventListener('click', toggleSidebar);

    // File upload
    fileUpload.addEventListener('change', handleFileUpload);
}

// Send message to Gemini API via Cloudflare Worker
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message || isWaitingForResponse) return;

    // Add user message to chat
    addMessageToChat('user', message);
    userInput.value = '';
    isWaitingForResponse = true;
    userInput.disabled = true;
    
    // Show loading indicator
    const loadingId = 'loading-' + Date.now();
    addLoadingIndicator(loadingId);

    try {
        const response = await fetch(`${API_BASE_URL}/api/gemini`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: message,
                chatId: currentChatId
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `API request failed with status ${response.status}`);
        }

        // Process successful response
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            addMessageToChat('assistant', aiResponse);
            saveToChatHistory(currentChatId, message, aiResponse);
        } else {
            throw new Error('Invalid response format from API');
        }
    } catch (error) {
        console.error('API Error:', error);
        addMessageToChat('assistant', `Error: ${error.message}`);
        
        // Detailed error logging
        if (error.response) {
            try {
                const errorData = await error.response.json();
                console.error('Error details:', errorData);
            } catch (e) {
                console.error('Failed to parse error response:', e);
            }
        }
    } finally {
        // Clean up
        removeLoadingIndicator(loadingId);
        isWaitingForResponse = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

// Add message to chat UI
function addMessageToChat(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';
    
    // Process markdown-like formatting
    if (role === 'assistant') {
        messageBubble.innerHTML = formatResponse(content);
    } else {
        messageBubble.textContent = content;
    }
    
    messageDiv.appendChild(messageBubble);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Format AI response with basic markdown support
function formatResponse(text) {
    // Simple markdown parsing
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
        .replace(/`([^`]+)`/g, '<code>$1</code>') // Inline code
        .replace(/```([^`]+)```/gs, '<pre>$1</pre>') // Code blocks
        .replace(/\n/g, '<br>'); // Line breaks
}

// Loading indicator functions
function addLoadingIndicator(id) {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant-message';
    loadingDiv.id = id;
    
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'message-bubble loading-bubble';
    loadingBubble.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
    
    loadingDiv.appendChild(loadingBubble);
    chatMessages.appendChild(loadingDiv);
    scrollToBottom();
}

function removeLoadingIndicator(id) {
    const loadingElement = document.getElementById(id);
    if (loadingElement) loadingElement.remove();
}

// Chat history management
function loadChatHistory() {
    const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
    chatHistory.innerHTML = '';
    
    history.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.innerHTML = `
            <div class="chat-preview">${chat.preview || 'New Chat'}</div>
            <div class="chat-time">${formatTime(chat.timestamp)}</div>
        `;
        chatItem.addEventListener('click', () => loadChat(chat.id));
        chatHistory.appendChild(chatItem);
    });
}

function saveToChatHistory(chatId, userMessage, aiResponse) {
    let history = JSON.parse(localStorage.getItem('chatHistory')) || [];
    
    const preview = userMessage.length > 30 
        ? userMessage.substring(0, 30) + '...' 
        : userMessage;
    
    const existingIndex = history.findIndex(chat => chat.id === chatId);
    
    if (existingIndex >= 0) {
        // Update existing chat
        history[existingIndex] = {
            ...history[existingIndex],
            preview,
            timestamp: Date.now(),
            lastMessage: aiResponse
        };
    } else {
        // Add new chat
        history.unshift({
            id: chatId,
            preview,
            timestamp: Date.now(),
            messages: [
                { role: 'user', content: userMessage },
                { role: 'assistant', content: aiResponse }
            ]
        });
        
        // Keep only the last 20 chats
        if (history.length > 20) history = history.slice(0, 20);
    }
    
    localStorage.setItem('chatHistory', JSON.stringify(history));
    loadChatHistory();
}

// Format timestamp for chat history
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Chat management functions
function startNewChat() {
    if (chatMessages.children.length > 0) {
        if (confirm('Are you sure you want to start a new chat?')) {
            resetChat();
        }
    }
}

function confirmNewChat() {
    if (chatMessages.children.length > 0) {
        if (confirm('Start a new chat? Current chat will be lost.')) {
            resetChat();
        }
    }
}

function resetChat() {
    currentChatId = generateChatId();
    chatMessages.innerHTML = '';
    addWelcomeMessage();
}

function addWelcomeMessage() {
    const welcomeMessage = `Hello! I'm Wayne AI. How can I help you today?`;
    addMessageToChat('assistant', welcomeMessage);
}

// Load a specific chat from history
function loadChat(chatId) {
    const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
    const chat = history.find(c => c.id === chatId);
    
    if (!chat) {
        alert('Chat not found in history');
        return;
    }
    
    currentChatId = chatId;
    chatMessages.innerHTML = '';
    
    // Load all messages if available
    if (chat.messages) {
        chat.messages.forEach(msg => {
            addMessageToChat(msg.role, msg.content);
        });
    } else {
        // Fallback for old format
        if (chat.lastMessage) {
            addMessageToChat('assistant', chat.lastMessage);
        }
    }
    
    // Close sidebar on mobile
    document.querySelector('.sidebar').classList.remove('active');
}

// File upload handling
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.match('image.*')) {
        alert('Please upload an image file only.');
        return;
    }

    // Process the image
    const reader = new FileReader();
    reader.onload = function(e) {
        addImageToChat(e.target.result);
        // You can extend this to send to Gemini Vision API
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    event.target.value = '';
}

function addImageToChat(imageData) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    
    const imageBubble = document.createElement('div');
    imageBubble.className = 'message-bubble image-bubble';
    
    const img = document.createElement('img');
    img.src = imageData;
    img.alt = 'Uploaded image';
    
    imageBubble.appendChild(img);
    messageDiv.appendChild(imageBubble);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// UI Helper functions
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Make some functions available globally
window.startNewChat = startNewChat;
