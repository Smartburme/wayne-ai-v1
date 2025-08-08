document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const clearBtn = document.getElementById('clear-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    const typingIndicator = document.getElementById('typing-indicator');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    
    // Initialize chat history
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    let currentChatId = null;
    
    // Event Listeners
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    newChatBtn.addEventListener('click', startNewChat);
    clearBtn.addEventListener('click', clearHistory);
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
    settingsBtn.addEventListener('click', openSettings);
    closeSettings.addEventListener('click', closeSettingsModal);
    
    // Auto-resize textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
    
    // Initialize the app
    initApp();
    
    function initApp() {
        renderChatHistory();
        if (chatHistory.length > 0) {
            loadChat(chatHistory[0].id);
        } else {
            startNewChat();
        }
    }
    
    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addMessage('user', message);
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Simulate AI response (in a real app, this would be an API call)
        setTimeout(() => {
            hideTypingIndicator();
            const aiResponse = generateAIResponse(message);
            addMessage('ai', aiResponse);
            
            // Save to history
            saveToHistory(message, aiResponse);
        }, 1500);
    }
    
    function addMessage(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        // Process content for special formats (code, images, etc.)
        const processedContent = processContent(content);
        
        messageDiv.innerHTML = `
            <div class="message-content">${processedContent}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    function processContent(content) {
        // This function would process the content to detect and format:
        // 1. Code blocks (markdown)
        // 2. Images
        // 3. Text frames
        // For now, just return as plain text
        return `<p>${content}</p>`;
    }
    
    function generateAIResponse(userMessage) {
        // In a real app, this would call your AI engine
        // This is just a placeholder
        const responses = [
            "I understand your question about '" + userMessage + "'. Here's what I can tell you...",
            "That's an interesting point. Based on my knowledge, I would say...",
            "I've analyzed your input and here's my response...",
            "Let me think about that. My perspective is..."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    function showTypingIndicator() {
        typingIndicator.style.display = 'flex';
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    function hideTypingIndicator() {
        typingIndicator.style.display = 'none';
    }
    
    function startNewChat() {
        currentChatId = Date.now().toString();
        chatContainer.innerHTML = `
            <div class="welcome-message">
                <h2>New Chat Started</h2>
                <p>Ask me anything or upload an image for analysis</p>
            </div>
        `;
    }
    
    function clearHistory() {
        if (confirm('Are you sure you want to clear all chat history?')) {
            chatHistory = [];
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
            renderChatHistory();
            startNewChat();
        }
    }
    
    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.type.startsWith('image/')) {
            // Process image upload
            const reader = new FileReader();
            reader.onload = function(event) {
                addMessage('user', `<img src="${event.target.result}" class="uploaded-image" alt="Uploaded image">`);
                
                // Show typing indicator for AI response
                showTypingIndicator();
                
                setTimeout(() => {
                    hideTypingIndicator();
                    addMessage('ai', "I've received your image. Here's my analysis...");
                }, 2000);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please upload an image file.');
        }
        
        // Reset file input
        e.target.value = '';
    }
    
    function saveToHistory(userMessage, aiResponse) {
        // Implementation would save to localStorage
    }
    
    function renderChatHistory() {
        // Implementation would render the history list
    }
    
    function loadChat(chatId) {
        // Implementation would load a chat from history
    }
    
    function openSettings() {
        settingsModal.style.display = 'flex';
    }
    
    function closeSettingsModal() {
        settingsModal.style.display = 'none';
    }
});
