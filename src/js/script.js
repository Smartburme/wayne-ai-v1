// API Configuration
const API_BASE_URL = 'https://your-worker-url.workers.dev'; // Replace with your Cloudflare Worker URL
let currentChatId = Date.now().toString();

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const fileUpload = document.getElementById('file-upload');
const newChatBtn = document.querySelector('.new-chat-btn');
const chatHistory = document.querySelector('.chat-history');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadChatHistory();
    
    // Set up event listeners
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    newChatBtn.addEventListener('click', startNewChat);
    fileUpload.addEventListener('change', handleFileUpload);
});

// Function to send message to Gemini API
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessageToChat('user', message);
    userInput.value = '';
    
    // Show loading indicator
    const loadingId = 'loading-' + Date.now();
    addLoadingIndicator(loadingId);

    try {
        // Call Cloudflare Worker endpoint which will call Gemini API
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

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        // Remove loading indicator
        removeLoadingIndicator(loadingId);
        
        // Process Gemini response
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            addMessageToChat('assistant', aiResponse);
            saveToChatHistory(currentChatId, message, aiResponse);
        } else {
            throw new Error('Invalid response format from API');
        }
    } catch (error) {
        console.error('Error:', error);
        removeLoadingIndicator(loadingId);
        addMessageToChat('assistant', `Error: ${error.message}`);
    }
}

// Function to add message to chat UI
function addMessageToChat(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';
    messageBubble.textContent = content;
    
    messageDiv.appendChild(messageBubble);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to add loading indicator
function addLoadingIndicator(id) {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant-message';
    loadingDiv.id = id;
    
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'message-bubble loading-bubble';
    loadingBubble.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
    
    loadingDiv.appendChild(loadingBubble);
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to remove loading indicator
function removeLoadingIndicator(id) {
    const loadingElement = document.getElementById(id);
    if (loadingElement) {
        loadingElement.remove();
    }
}

// Function to start a new chat
function startNewChat() {
    if (chatMessages.children.length > 0) {
        if (confirm('Are you sure you want to start a new chat? The current chat will be lost.')) {
            currentChatId = Date.now().toString();
            chatMessages.innerHTML = '';
        }
    }
}

// Function to handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.match('image.*')) {
        alert('Please upload an image file only.');
        return;
    }

    // Process the image (you can extend this to send to Gemini Vision API)
    const reader = new FileReader();
    reader.onload = function(e) {
        addImageToChat(e.target.result);
    };
    reader.readAsDataURL(file);
}

// Function to add image to chat
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
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Chat history functions
function loadChatHistory() {
    const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
    chatHistory.innerHTML = '';
    
    history.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.textContent = chat.preview || 'New Chat';
        chatItem.addEventListener('click', () => loadChat(chat.id));
        chatHistory.appendChild(chatItem);
    });
}

function saveToChatHistory(chatId, userMessage, aiResponse) {
    let history = JSON.parse(localStorage.getItem('chatHistory')) || [];
    
    // Check if this chat already exists
    const existingChatIndex = history.findIndex(chat => chat.id === chatId);
    
    const preview = userMessage.length > 30 
        ? userMessage.substring(0, 30) + '...' 
        : userMessage;
    
    if (existingChatIndex >= 0) {
        // Update existing chat
        history[existingChatIndex].preview = preview;
        history[existingChatIndex].timestamp = Date.now();
    } else {
        // Add new chat
        history.unshift({
            id: chatId,
            preview: preview,
            timestamp: Date.now()
        });
        
        // Keep only the last 10 chats
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
    }
    
    localStorage.setItem('chatHistory', JSON.stringify(history));
    loadChatHistory();
}

function loadChat(chatId) {
    // In a real app, you would load the chat messages from storage
    // This is a simplified version
    currentChatId = chatId;
    chatMessages.innerHTML = '';
    addMessageToChat('assistant', 'Previous chat loaded. This is a simplified demo - actual chat history would be implemented with proper storage.');
}

// Make startNewChat available globally for the refresh button
window.startNewChat = startNewChat;
