// DOM Elements
const sideMenu = document.getElementById('sideMenu');
const mainContent = document.getElementById('mainContent');
const menuToggle = document.getElementById('menuToggle');
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const imageUploadBtn = document.getElementById('imageUploadBtn');
const imageUpload = document.getElementById('imageUpload');
const imagePreviewModal = document.getElementById('imagePreviewModal');
const previewImage = document.getElementById('previewImage');
const sendImageBtn = document.getElementById('sendImageBtn');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettings = document.getElementById('closeSettings');
const themeSelect = document.getElementById('themeSelect');
const fontSize = document.getElementById('fontSize');
const animationsToggle = document.getElementById('animationsToggle');
const notificationToggle = document.getElementById('notificationToggle');

// State variables
let isMenuOpen = false;
let currentChatId = generateChatId();
let uploadedImage = null;

// Initialize the app
function init() {
    setupEventListeners();
    loadSettings();
    checkMobileView();
}

// Set up event listeners
function setupEventListeners() {
    // Menu toggle
    menuToggle.addEventListener('click', toggleMenu);
    
    // Click outside to close menu
    document.addEventListener('click', (e) => {
        if (isMenuOpen && !sideMenu.contains(e.target) && !menuToggle.contains(e.target)) {
            closeMenu();
        }
    });
    
    // Send message
    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Image upload
    imageUploadBtn.addEventListener('click', () => imageUpload.click());
    imageUpload.addEventListener('change', handleImageUpload);
    sendImageBtn.addEventListener('click', sendImageMessage);
    
    // Settings
    document.querySelector('.menu-item[data-section="settings"]').addEventListener('click', openSettings);
    closeSettings.addEventListener('click', closeSettingsPanel);
    
    // Theme selector
    themeSelect.addEventListener('change', changeTheme);
    
    // Font size
    fontSize.addEventListener('input', updateFontSize);
    
    // Animations toggle
    animationsToggle.addEventListener('change', toggleAnimations);
    
    // Notifications toggle
    notificationToggle.addEventListener('change', toggleNotifications);
    
    // Window resize
    window.addEventListener('resize', checkMobileView);
}

// Menu functions
function toggleMenu() {
    if (isMenuOpen) {
        closeMenu();
    } else {
        openMenu();
    }
}

function openMenu() {
    sideMenu.classList.add('open');
    mainContent.classList.add('menu-open');
    isMenuOpen = true;
}

function closeMenu() {
    sideMenu.classList.remove('open');
    mainContent.classList.remove('menu-open');
    isMenuOpen = false;
}

// Chat functions
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        addMessageToChat('user', message);
        messageInput.value = '';
        
        // Simulate AI response
        setTimeout(() => {
            const aiResponse = generateAIResponse(message);
            addMessageToChat('ai', aiResponse);
        }, 1000);
    }
}

function sendImageMessage() {
    if (uploadedImage) {
        addImageMessageToChat('user', uploadedImage);
        imagePreviewModal.style.display = 'none';
        uploadedImage = null;
        
        // Simulate AI response to image
        setTimeout(() => {
            const aiResponse = "This is an interesting image. I can analyze it for you if you enable image processing in settings.";
            addMessageToChat('ai', aiResponse);
        }, 1500);
    }
}

function addMessageToChat(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    
    const avatar = sender === 'user' 
        ? '<div class="avatar"><i class="fas fa-user"></i></div>' 
        : '<div class="avatar"><img src="../assets/images/logo.png" alt="AI"></div>';
    
    messageElement.innerHTML = `
        ${avatar}
        <div class="message-content">
            <div class="message-text">${message}</div>
            <div class="message-time">${getCurrentTime()}</div>
        </div>
    `;
    
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addImageMessageToChat(sender, imageData) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    
    const avatar = sender === 'user' 
        ? '<div class="avatar"><i class="fas fa-user"></i></div>' 
        : '<div class="avatar"><img src="../assets/images/logo.png" alt="AI"></div>';
    
    messageElement.innerHTML = `
        ${avatar}
        <div class="message-content">
            <div class="message-image">
                <img src="${imageData}" alt="Uploaded image">
            </div>
            <div class="message-time">${getCurrentTime()}</div>
        </div>
    `;
    
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Image handling
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            uploadedImage = event.target.result;
            previewImage.src = uploadedImage;
            imagePreviewModal.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Settings functions
function openSettings() {
    settingsPanel.style.display = 'block';
    closeMenu();
}

function closeSettingsPanel() {
    settingsPanel.style.display = 'none';
    saveSettings();
}

function changeTheme() {
    document.body.className = `${themeSelect.value}-theme`;
}

function updateFontSize() {
    document.documentElement.style.setProperty('--base-font-size', `${fontSize.value}px`);
}

function toggleAnimations() {
    document.body.classList.toggle('animations-disabled', !animationsToggle.checked);
}

function toggleNotifications() {
    // Implementation would depend on Notification API
    console.log('Notifications toggled:', notificationToggle.checked);
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('wayneAISettings')) || {};
    
    if (settings.theme) {
        themeSelect.value = settings.theme;
        changeTheme();
    }
    
    if (settings.fontSize) {
        fontSize.value = settings.fontSize;
        updateFontSize();
    }
    
    if (settings.animations !== undefined) {
        animationsToggle.checked = settings.animations;
        toggleAnimations();
    }
    
    if (settings.notifications !== undefined) {
        notificationToggle.checked = settings.notifications;
    }
}

function saveSettings() {
    const settings = {
        theme: themeSelect.value,
        fontSize: fontSize.value,
        animations: animationsToggle.checked,
        notifications: notificationToggle.checked
    };
    
    localStorage.setItem('wayneAISettings', JSON.stringify(settings));
}

// Utility functions
function generateChatId() {
    return 'chat-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function generateAIResponse(message) {
    // This would be replaced with actual AI engine calls
    const responses = [
        "I understand you're asking about: " + message,
        "That's an interesting question. Let me think about " + message,
        "Here's what I found about " + message + ": ...",
        "I can help with that. " + message + " is related to...",
        "Thanks for your message. Let me analyze " + message
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function checkMobileView() {
    if (window.innerWidth <= 768) {
        document.body.classList.add('mobile-view');
        if (isMenuOpen) {
            mainContent.classList.add('menu-open');
        }
    } else {
        document.body.classList.remove('mobile-view');
        mainContent.classList.remove('menu-open');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
