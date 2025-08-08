// src/assets/js/main.js

// Import necessary modules
import { initAIEngine } from './ai-engine.js';
import { initAnimations, animateMessage } from './animations.js';
import { loadKnowledgeBase } from '../engine/y-npl/knowledge-connector.js';
import { processInput } from '../engine/y-npl/response-generator.js';

// Constants
const LOCAL_STORAGE_KEY = 'wayne-ai-chat-history';
const MOBILE_BREAKPOINT = 768;
const MAX_MESSAGE_LENGTH = 2000;

// DOM Elements
const elements = {
    chatContainer: document.getElementById('chat-container'),
    userInput: document.getElementById('user-input'),
    sendBtn: document.getElementById('send-btn'),
    newChatBtn: document.getElementById('new-chat-btn'),
    clearBtn: document.getElementById('clear-btn'),
    uploadBtn: document.getElementById('upload-btn'),
    fileInput: document.getElementById('file-input'),
    typingIndicator: document.getElementById('typing-indicator'),
    sidebar: document.querySelector('.sidebar'),
    sidebarToggle: document.getElementById('sidebar-toggle'),
    overlay: document.getElementById('overlay'),
    historyList: document.getElementById('history-list'),
    themeToggle: document.getElementById('theme-toggle'),
    exportBtn: document.getElementById('export-btn'),
    loader: document.querySelector('.loader')
};

// App State
const state = {
    chatHistory: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [],
    currentChatId: null,
    isMobileView: window.innerWidth <= MOBILE_BREAKPOINT,
    sidebarOpen: window.innerWidth > MOBILE_BREAKPOINT,
    isTyping: false,
    aiEngine: null,
    knowledgeBase: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    // Show loader while initializing
    elements.loader.style.display = 'flex';
    
    try {
        // Initialize modules
        await initModules();
        initUI();
        setupEventListeners();
        
        // Load initial chat
        if (state.chatHistory.length > 0) {
            loadChat(state.chatHistory[0].id);
        } else {
            startNewChat();
        }
    } catch (error) {
        console.error("Initialization error:", error);
        showError("Failed to initialize application. Please refresh the page.");
    } finally {
        // Hide loader
        elements.loader.style.display = 'none';
    }
});

// Module Initialization
async function initModules() {
    // Initialize AI Engine
    state.aiEngine = await initAIEngine();
    
    // Load knowledge base
    state.knowledgeBase = await loadKnowledgeBase();
    
    // Initialize animations
    initAnimations();
}

// UI Initialization
function initUI() {
    // Apply theme from localStorage
    const savedTheme = localStorage.getItem('wayne-ai-theme') || 'light';
    document.body.classList.add(savedTheme);
    elements.themeToggle.innerHTML = savedTheme === 'light' ? 
        '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    
    // Setup sidebar
    elements.sidebar.classList.toggle('sidebar-open', state.sidebarOpen);
    elements.overlay.classList.toggle('active', state.sidebarOpen && state.isMobileView);
    
    // Render chat history
    renderChatHistory();
}

// Event Listeners
function setupEventListeners() {
    // Chat functionality
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.userInput.addEventListener('input', handleTextareaInput);
    elements.userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Chat management
    elements.newChatBtn.addEventListener('click', startNewChat);
    elements.clearBtn.addEventListener('click', clearHistory);
    elements.uploadBtn.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileUpload);
    
    // UI interactions
    elements.sidebarToggle.addEventListener('click', toggleSidebar);
    elements.overlay.addEventListener('click', toggleSidebar);
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.exportBtn.addEventListener('click', exportChat);
    
    // Window resize
    window.addEventListener('resize', debounce(updateMobileView, 200));
}

// Core Chat Functions
async function sendMessage() {
    const message = elements.userInput.value.trim();
    if (!message || message.length > MAX_MESSAGE_LENGTH || state.isTyping) return;
    
    addMessage('user', message);
    elements.userInput.value = '';
    elements.userInput.style.height = 'auto';
    
    showTypingIndicator();
    state.isTyping = true;
    
    try {
        // Process input through the AI engine
        const response = await state.aiEngine.processInput(message);
        addMessage('ai', response);
        saveToHistory(message, response);
    } catch (error) {
        console.error("Error processing message:", error);
        addMessage('ai', "I encountered an error processing your request. Please try again.");
    } finally {
        hideTypingIndicator();
        state.isTyping = false;
    }
}

// Message Handling
function addMessage(sender, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    // Apply animation
    animateMessage(messageDiv);
    
    // Format content based on sender
    if (sender === 'ai') {
        messageDiv.innerHTML = formatAIResponse(content);
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">${escapeHtml(content)}</div>
            <div class="message-time">${formatTime(new Date())}</div>
        `;
    }
    
    elements.chatContainer.appendChild(messageDiv);
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
}

function formatAIResponse(content) {
    // Process markdown and code blocks
    let formatted = marked.parse(content);
    
    // Add syntax highlighting to code blocks
    formatted = formatted.replace(/<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g, 
        (match, lang, code) => {
            return `<pre><code class="language-${lang}">${hljs.highlight(code, { language: lang }).value}</code></pre>`;
        });
    
    return `
        <div class="message-content">${formatted}</div>
        <div class="message-time">${formatTime(new Date())}</div>
    `;
}

// File Handling
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        if (file.type.startsWith('image/')) {
            const imageUrl = await readFileAsDataURL(file);
            addMessage('user', `<img src="${imageUrl}" class="message-image" alt="Uploaded image">`);
            
            showTypingIndicator();
            const analysis = await analyzeImage(file);
            addMessage('ai', analysis);
        } else {
            // Handle text files
            const text = await readFileAsText(file);
            addMessage('user', `<div class="file-message">Uploaded file: ${file.name}<pre>${escapeHtml(text)}</pre></div>`);
            
            showTypingIndicator();
            const summary = await summarizeText(text);
            addMessage('ai', summary);
        }
    } catch (error) {
        console.error("File processing error:", error);
        addMessage('ai', "I couldn't process that file. Please try another one.");
    } finally {
        hideTypingIndicator();
        elements.fileInput.value = '';
    }
}

// Utility Functions
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Initialize the application
export function initWayneAI() {
    // This function can be called from other modules if needed
    document.addEventListener('DOMContentLoaded', async () => {
        await initModules();
        initUI();
        setupEventListeners();
    });
}
