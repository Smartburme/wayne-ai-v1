document.addEventListener('DOMContentLoaded', async function() {
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
    const historyList = document.getElementById('history-list');

    // ====== State Management ======
    let chatHistory = JSON.parse(localStorage.getItem('wayne-ai-chat-history')) || [];
    let currentChatId = null;
    let isMobileView = window.innerWidth <= 768;
    let sidebarOpen = !isMobileView;
    
    // Initialize NLP (using Compromise.js as lightweight NLP)
    const nlp = await initNLP();
    const knowledgeBase = await loadKnowledge();

    // ====== Initialize App ======
    function initApp() {
        setupSidebar();
        renderChatHistory();
        
        if (chatHistory.length > 0) {
            loadChat(chatHistory[0].id);
        } else {
            startNewChat();
        }
        
        setupEventListeners();
        updateMobileView();
    }

    // ====== NLP Initialization ======
    async function initNLP() {
        // Load compromise.js (lightweight NLP)
        const nlp = await import('https://cdn.jsdelivr.net/npm/compromise@latest/builds/compromise.min.js');
        return nlp.default;
    }

    // ====== Knowledge Base Loading ======
    async function loadKnowledge() {
        try {
            const response = await fetch('./src/docs/knowledge/combined-knowledge.json');
            return await response.json();
        } catch (error) {
            console.error("Failed to load knowledge base:", error);
            return {
                'coder-knowledge': [],
                'text-knowledge': [],
                'general-knowledge': []
            };
        }
    }

    // ====== Sidebar Management ======
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

    // ====== Responsive View Handling ======
    function updateMobileView() {
        isMobileView = window.innerWidth <= 768;
        if (isMobileView) {
            sidebarOpen = false;
            sidebar.classList.remove('sidebar-open');
            overlay.classList.remove('active');
        } else {
            sidebarOpen = true;
            sidebar.classList.add('sidebar-open');
        }
    }

    // ====== Event Listeners ======
    function setupEventListeners() {
        // Chat functionality
        sendBtn.addEventListener('click', sendMessage);
        userInput.addEventListener('keydown', handleTextareaInput);
        newChatBtn.addEventListener('click', startNewChat);
        clearBtn.addEventListener('click', clearHistory);
        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileUpload);
        
        // Sidebar interactions
        sidebarToggle.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', toggleSidebar);
        
        // Window resize with debounce
        window.addEventListener('resize', debounce(() => {
            updateMobileView();
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

    // ====== Core Chat Functions ======
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        
        addMessage('user', message);
        userInput.value = '';
        userInput.style.height = 'auto';
        
        showTypingIndicator();
        
        try {
            // Process with NLP and get AI response
            const aiResponse = await generateAIResponse(message);
            addMessage('ai', aiResponse);
            saveToHistory(message, aiResponse);
        } catch (error) {
            console.error("Error generating response:", error);
            addMessage('ai', "I encountered an error processing your request. Please try again.");
        } finally {
            hideTypingIndicator();
        }
    }

    async function generateAIResponse(userInput) {
        // Step 1: NLP Processing
        const doc = nlp(userInput);
        const entities = {
            topics: doc.topics().out('array'),
            questions: doc.questions().out('array'),
            verbs: doc.verbs().out('array')
        };

        // Step 2: Determine intent
        const intent = determineIntent(entities);
        
        // Step 3: Query knowledge base
        const knowledge = queryKnowledge(intent, entities.topics);
        
        // Step 4: Generate natural response
        return formatResponse(intent, knowledge);
    }

    function determineIntent(entities) {
        if (entities.questions.length > 0) {
            if (entities.topics.some(t => ['code', 'programming', 'algorithm'].includes(t))) {
                return 'coder-question';
            }
            return 'general-question';
        }
        if (entities.topics.some(t => ['image', 'photo', 'picture'].includes(t))) {
            return 'image-request';
        }
        return 'general';
    }

    function queryKnowledge(intent, topics) {
        switch(intent) {
            case 'coder-question':
                return knowledgeBase['coder-knowledge']
                    .filter(item => topics.some(topic => item.tags.includes(topic)));
            case 'general-question':
                return knowledgeBase['text-knowledge']
                    .filter(item => topics.some(topic => item.tags.includes(topic)));
            default:
                return knowledgeBase['general-knowledge'];
        }
    }

    function formatResponse(intent, knowledge) {
        if (knowledge.length === 0) {
            return "I don't have enough information about that topic. Could you please provide more details?";
        }

        // Prioritize most relevant knowledge
        const primaryResponse = knowledge[0].response;
        
        if (intent === 'coder-question') {
            return `For your coding question:\n\`\`\`${knowledge[0].language || ''}\n${primaryResponse}\n\`\`\``;
        }
        
        return primaryResponse;
    }

    // ====== Message Display Functions ======
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
        // Simple markdown formatting
        let formatted = content;
        
        // Code blocks
        formatted = formatted.replace(/```(\w*)([\s\S]*?)```/g, 
            '<div class="code-block"><span class="code-language">$1</span><pre>$2</pre></div>');
        
        // Links
        formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener">$1</a>');
            
        // Basic formatting
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        return formatted;
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

    // ====== Chat History Management ======
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
            localStorage.setItem('wayne-ai-chat-history', JSON.stringify(chatHistory));
            renderChatHistory();
            startNewChat();
        }
    }

    function saveToHistory(userMessage, aiResponse) {
        const chat = chatHistory.find(c => c.id === currentChatId) || {
            id: currentChatId,
            title: userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : ''),
            messages: [],
            timestamp: Date.now()
        };
        
        chat.messages.push({
            user: userMessage,
            ai: aiResponse,
            timestamp: Date.now()
        });
        
        if (!chatHistory.some(c => c.id === currentChatId)) {
            chatHistory.unshift(chat);
        }
        
        localStorage.setItem('wayne-ai-chat-history', JSON.stringify(chatHistory));
        renderChatHistory();
    }

    function renderChatHistory() {
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

    // ====== File Upload Handling ======
    async function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = async function(event) {
                addMessage('user', `<img src="${event.target.result}" class="message-image" alt="Uploaded image">`);
                showTypingIndicator();
                
                try {
                    // Simulate image analysis
                    const analysis = await analyzeImage(event.target.result);
                    addMessage('ai', analysis);
                } catch (error) {
                    addMessage('ai', "I couldn't analyze that image. Please try another one.");
                } finally {
                    hideTypingIndicator();
                }
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please upload an image file.');
        }
        
        e.target.value = '';
    }

    async function analyzeImage(imageData) {
        // In a real app, this would call a computer vision API
        return "This appears to be an image. For detailed analysis, please provide more context.";
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
