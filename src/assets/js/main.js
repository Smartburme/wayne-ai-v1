document.addEventListener('DOMContentLoaded', function() {
    // ====== DOM Elements ======
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const clearBtn = document.getElementById('clear-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    const typingIndicator = document.getElementById('typing-indicator');
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const overlay = document.getElementById('overlay');
    const deviceView = document.getElementById('device-view');

    // ====== State Management ======
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    let currentChatId = null;
    let isMobileView = window.innerWidth <= 768;
    let sidebarOpen = !isMobileView;

    // ====== Initialize App ======
    function initApp() {
        updateDeviceView();
        setupSidebar();
        renderChatHistory();
        
        if (chatHistory.length > 0) {
            loadChat(chatHistory[0].id);
        } else {
            startNewChat();
        }
        
        setupEventListeners();
    }

    // ====== Device View Detection ======
    function updateDeviceView() {
        isMobileView = window.innerWidth <= 768;
        deviceView.textContent = isMobileView ? 'Mobile View' : 'Desktop View';
        document.body.classList.toggle('mobile-view', isMobileView);
        
        if (isMobileView) {
            sidebarOpen = false;
            sidebar.classList.remove('sidebar-open');
            overlay.classList.remove('active');
        } else {
            sidebarOpen = true;
            sidebar.classList.add('sidebar-open');
        }
    }

    // ====== Sidebar Logic ======
    function setupSidebar() {
        if (isMobileView) {
            sidebar.classList.remove('sidebar-open');
            overlay.classList.remove('active');
        } else {
            sidebar.classList.add('sidebar-open');
        }
    }

    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
        sidebar.classList.toggle('sidebar-open', sidebarOpen);
        overlay.classList.toggle('active', sidebarOpen && isMobileView);
        
        if (sidebarOpen && isMobileView) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    // ====== Event Listeners ======
    function setupEventListeners() {
        // Core functionality
        sendBtn.addEventListener('click', sendMessage);
        userInput.addEventListener('keydown', handleTextareaInput);
        newChatBtn.addEventListener('click', startNewChat);
        clearBtn.addEventListener('click', clearHistory);
        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileUpload);
        
        // Sidebar interactions
        sidebarToggle.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', toggleSidebar);
        
        // Window resize for responsive design
        window.addEventListener('resize', debounce(() => {
            updateDeviceView();
            setupSidebar();
        }, 200));
    }

    function handleTextareaInput(e) {
        // Auto-resize textarea
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        
        // Send message on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    // ====== Chat Functions ======
    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        
        addMessage('user', message);
        userInput.value = '';
        userInput.style.height = 'auto';
        
        showTypingIndicator();
        
        // Simulate AI response
        setTimeout(() => {
            hideTypingIndicator();
            const aiResponse = generateAIResponse(message);
            addMessage('ai', aiResponse);
            saveToHistory(message, aiResponse);
        }, 1500);
    }

    function addMessage(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = `
            <div class="message-content">${formatContent(content)}</div>
            <div class="message-time">${formatTime(new Date())}</div>
        `;
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function formatContent(content) {
        // Simple content formatting (in a real app, use a proper markdown parser)
        let formatted = content;
        
        // Detect code blocks
        formatted = formatted.replace(/```(\w*)([\s\S]*?)```/g, 
            '<div class="code-block"><span class="code-language">$1</span><pre>$2</pre></div>');
        
        // Detect images
        if (content.startsWith('<img')) {
            return content; // Already formatted
        }
        
        // Detect URLs
        formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener">$1</a>');
        
        // Paragraphs
        return `<p>${formatted}</p>`;
    }

    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        
        if (isMobileView) {
            toggleSidebar();
        }
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
            const reader = new FileReader();
            reader.onload = function(event) {
                addMessage('user', `<img src="${event.target.result}" class="message-image" alt="Uploaded image">`);
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
        
        e.target.value = '';
    }

    function saveToHistory(userMessage, aiResponse) {
        const chat = chatHistory.find(c => c.id === currentChatId) || {
            id: currentChatId,
            title: userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : ''),
            messages: []
        };
        
        chat.messages.push({
            user: userMessage,
            ai: aiResponse,
            timestamp: Date.now()
        });
        
        if (!chatHistory.some(c => c.id === currentChatId)) {
            chatHistory.unshift(chat);
        }
        
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        renderChatHistory();
    }

    function renderChatHistory() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        
        chatHistory.forEach(chat => {
            const li = document.createElement('li');
            li.textContent = chat.title;
            li.addEventListener('click', () => {
                loadChat(chat.id);
                if (isMobileView) toggleSidebar();
            });
            historyList.appendChild(li);
        });
    }

    function loadChat(chatId) {
        const chat = chatHistory.find(c => c.id === chatId);
        if (!chat) return;
        
        currentChatId = chatId;
        chatContainer.innerHTML = '';
        
        chat.messages.forEach(msg => {
            addMessage('user', msg.user);
            addMessage('ai', msg.ai);
        });
    }

    function generateAIResponse(userMessage) {
        // In a real app, this would call your AI engine
        const responses = [
            `I understand your question about "${userMessage}". Here's what I can tell you...`,
            "That's an interesting point. Based on my knowledge, I would say...",
            "I've analyzed your input and here's my response...",
            "Let me think about that. My perspective is..."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // ====== Utility Functions ======
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Initialize the app
    initApp();
});
