// WAYNE AI - Main Application Controller
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatContainer = document.getElementById('chatContainer');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const voiceButton = document.getElementById('voiceButton');
    const fileUpload = document.getElementById('fileUpload');
    
    // State Management
    let currentMode = 'general'; // Modes: general, text, image, code
    let conversationHistory = [];
    let isProcessing = false;
    
    // Initialize components
    initEventListeners();
    loadInitialState();
    
    // ===== CORE FUNCTIONS =====
    
    function initEventListeners() {
        // Send message on button click or Enter key
        sendButton.addEventListener('click', handleSendMessage);
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        
        // Voice input
        voiceButton.addEventListener('click', handleVoiceInput);
        
        // File upload handling
        fileUpload.addEventListener('change', handleFileUpload);
        
        // Mode detection based on input
        userInput.addEventListener('input', detectInputMode);
    }
    
    function loadInitialState() {
        // Load any saved conversation history
        const savedHistory = localStorage.getItem('wayneConversationHistory');
        if (savedHistory) {
            conversationHistory = JSON.parse(savedHistory);
            renderConversationHistory();
        }
    }
    
    // ===== MESSAGE HANDLING =====
    
    async function handleSendMessage() {
        const message = userInput.value.trim();
        if (!message || isProcessing) return;
        
        // Add user message to UI
        addMessageToChat('user', message);
        userInput.value = '';
        
        // Process the message
        await processUserMessage(message);
    }
    
    function addMessageToChat(sender, content, metadata = {}) {
        const messageId = Date.now();
        const message = {
            id: messageId,
            sender,
            content,
            timestamp: new Date().toISOString(),
            metadata
        };
        
        conversationHistory.push(message);
        saveConversation();
        renderMessage(message);
    }
    
    function renderMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender}-message`;
        messageDiv.dataset.messageId = message.id;
        
        // Avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        if (message.sender === 'user') {
            avatarDiv.innerHTML = '<i class="icon-user"></i>';
        } else {
            const logoImg = document.createElement('img');
            logoImg.src = './assets/images/logo.png';
            logoImg.alt = 'WAYNE AI';
            avatarDiv.appendChild(logoImg);
        }
        
        // Content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Handle different content types
        if (message.metadata.type === 'code') {
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = message.content;
            code.className = `language-${message.metadata.language || 'javascript'}`;
            pre.appendChild(code);
            contentDiv.appendChild(pre);
            
            // Add copy button
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.innerHTML = '<i class="icon-copy"></i>';
            copyBtn.title = 'Copy to clipboard';
            copyBtn.addEventListener('click', () => copyToClipboard(message.content));
            contentDiv.appendChild(copyBtn);
            
            // Highlight the code
            if (window.Prism) {
                Prism.highlightElement(code);
            }
        } else if (message.metadata.type === 'image') {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'image-result';
            
            if (typeof message.content === 'string' && message.content.startsWith('http')) {
                const img = document.createElement('img');
                img.src = message.content;
                img.alt = 'Generated image';
                imgContainer.appendChild(img);
            } else if (message.content instanceof Blob) {
                const imgUrl = URL.createObjectURL(message.content);
                const img = document.createElement('img');
                img.src = imgUrl;
                img.alt = 'Uploaded image';
                imgContainer.appendChild(img);
            }
            
            contentDiv.appendChild(imgContainer);
        } else {
            // Regular text message
            const paragraphs = message.content.split('\n');
            paragraphs.forEach(p => {
                const pElem = document.createElement('p');
                pElem.textContent = p;
                contentDiv.appendChild(pElem);
            });
        }
        
        // Action buttons
        if (message.sender === 'ai') {
            const actionDiv = document.createElement('div');
            actionDiv.className = 'message-actions';
            
            const likeBtn = document.createElement('button');
            likeBtn.className = 'like-btn';
            likeBtn.innerHTML = '<i class="icon-thumbs-up"></i>';
            likeBtn.addEventListener('click', () => rateResponse(message.id, 'like'));
            
            const dislikeBtn = document.createElement('button');
            dislikeBtn.className = 'dislike-btn';
            dislikeBtn.innerHTML = '<i class="icon-thumbs-down"></i>';
            dislikeBtn.addEventListener('click', () => rateResponse(message.id, 'dislike'));
            
            actionDiv.appendChild(likeBtn);
            actionDiv.appendChild(dislikeBtn);
            contentDiv.appendChild(actionDiv);
        }
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        chatContainer.appendChild(messageDiv);
        messageDiv.scrollIntoView({ behavior: 'smooth' });
    }
    
    // ===== PROCESSING ENGINE =====
    
    async function processUserMessage(message) {
        isProcessing = true;
        showTypingIndicator();
        
        try {
            let response;
            
            // Determine processing mode
            if (currentMode === 'code') {
                response = await processCodeRequest(message);
            } else if (currentMode === 'image') {
                response = await processImageRequest(message);
            } else {
                response = await processTextRequest(message);
            }
            
            // Add AI response to chat
            addMessageToChat('ai', response.content, response.metadata);
        } catch (error) {
            console.error('Processing error:', error);
            addMessageToChat('ai', "I encountered an error processing your request. Please try again.", {
                type: 'error'
            });
        } finally {
            hideTypingIndicator();
            isProcessing = false;
        }
    }
    
    async function processTextRequest(message) {
        // Connect to knowledge base and NLP engine
        const response = await fetch('/engine/y-npl/knowledge-connector.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: message,
                context: conversationHistory,
                knowledgeSources: ['text-knowledge.md', 'coder-knowledge.md']
            })
        });
        
        const data = await response.json();
        
        return {
            content: data.response,
            metadata: {
                type: 'text',
                sources: data.sources || [],
                confidence: data.confidence || 0.8
            }
        };
    }
    
    async function processCodeRequest(message) {
        // Check if it's a code execution request
        const executePattern = /^(run|execute):/i;
        const shouldExecute = executePattern.test(message);
        
        if (shouldExecute) {
            message = message.replace(executePattern, '').trim();
            
            // Send to code execution engine
            const response = await fetch('/engine/y-npl/response-generator.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'code_execution',
                    code: message,
                    language: detectProgrammingLanguage(message)
                })
            });
            
            const result = await response.json();
            
            return {
                content: result.output || "Code executed but produced no output.",
                metadata: {
                    type: 'code',
                    language: result.language || 'text',
                    executionTime: result.executionTime,
                    success: result.success
                }
            };
        } else {
            // Regular code generation/explanation
            const response = await fetch('/engine/y-npl/response-generator.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'code_generation',
                    prompt: message,
                    context: getCodeContext()
                })
            });
            
            const codeResponse = await response.json();
            
            return {
                content: codeResponse.code,
                metadata: {
                    type: 'code',
                    language: codeResponse.language || 'javascript',
                    explanation: codeResponse.explanation
                }
            };
        }
    }
    
    async function processImageRequest(message) {
        // Check if it's an image processing request
        if (message.startsWith('edit:') || message.startsWith('modify:')) {
            // Handle image editing
            return processImageEditRequest(message);
        } else {
            // Handle new image generation
            const response = await fetch('/engine/y-npl/response-generator.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'image_generation',
                    prompt: message,
                    style: getPreferredImageStyle(),
                    size: getPreferredImageSize()
                })
            });
            
            const imageResponse = await response.json();
            
            return {
                content: imageResponse.imageUrl,
                metadata: {
                    type: 'image',
                    prompt: message,
                    model: imageResponse.model,
                    generationTime: imageResponse.generationTime
                }
            };
        }
    }
    
    // ===== UTILITY FUNCTIONS =====
    
    function detectInputMode() {
        const text = userInput.value.toLowerCase();
        
        // Code mode detection
        const codeKeywords = ['code', 'program', 'function', 'loop', 'if statement', 'python', 'javascript'];
        if (codeKeywords.some(keyword => text.includes(keyword))) {
            currentMode = 'code';
            return;
        }
        
        // Image mode detection
        const imageKeywords = ['image', 'picture', 'photo', 'generate', 'draw', 'create'];
        if (imageKeywords.some(keyword => text.includes(keyword))) {
            currentMode = 'image';
            return;
        }
        
        // Default to text mode
        currentMode = 'general';
    }
    
    function detectProgrammingLanguage(code) {
        // Simple language detection
        if (code.includes('def ') && code.includes(':')) return 'python';
        if (code.includes('function ') && (code.includes('{') || code.includes('=>'))) return 'javascript';
        if (code.includes('<?php')) return 'php';
        if (code.includes('<html>') || code.includes('<div>')) return 'html';
        if (code.includes('SELECT ') || code.includes('FROM ')) return 'sql';
        return 'text';
    }
    
    function getCodeContext() {
        // Get relevant code from conversation history
        return conversationHistory
            .filter(msg => msg.metadata.type === 'code')
            .map(msg => msg.content)
            .join('\n\n');
    }
    
    function getPreferredImageStyle() {
        // Get from user preferences
        return localStorage.getItem('imageStylePreference') || 'digital-art';
    }
    
    function getPreferredImageSize() {
        // Get from user preferences
        return localStorage.getItem('imageSizePreference') || '1024x1024';
    }
    
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        const logoImg = document.createElement('img');
        logoImg.src = './assets/images/logo.png';
        logoImg.alt = 'WAYNE AI';
        avatarDiv.appendChild(logoImg);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const dots = document.createElement('div');
        dots.className = 'typing-dots';
        dots.innerHTML = '<span></span><span></span><span></span>';
        
        contentDiv.appendChild(dots);
        typingDiv.appendChild(avatarDiv);
        typingDiv.appendChild(contentDiv);
        
        chatContainer.appendChild(typingDiv);
        typingDiv.scrollIntoView({ behavior: 'smooth' });
    }
    
    function hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    function saveConversation() {
        // Save only the last 20 messages to prevent excessive storage
        const recentHistory = conversationHistory.slice(-20);
        localStorage.setItem('wayneConversationHistory', JSON.stringify(recentHistory));
    }
    
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }
    
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 2000);
        }, 100);
    }
    
    // ===== FILE HANDLING =====
    
    function handleFileUpload(e) {
        const files = e.target.files;
        if (!files.length) return;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (file.type.startsWith('image/')) {
                processImageUpload(file);
            } else if (file.type === 'application/pdf') {
                processPDFUpload(file);
            } else if (file.type.startsWith('text/') || 
                      file.name.endsWith('.txt') || 
                      file.name.endsWith('.md')) {
                processTextUpload(file);
            } else {
                addMessageToChat('user', `Uploaded file: ${file.name}`, {
                    type: 'file',
                    fileType: file.type
                });
                
                // Inform AI about the upload
                setTimeout(() => {
                    addMessageToChat('ai', `I've noted your file upload (${file.name}). How would you like me to process this ${file.type} file?`, {
                        type: 'text'
                    });
                }, 500);
            }
        }
        
        // Reset file input
        e.target.value = '';
    }
    
    async function processImageUpload(file) {
        // Display the image in chat
        addMessageToChat('user', `Image upload: ${file.name}`, {
            type: 'image',
            content: file
        });
        
        // Prepare for potential image processing
        setTimeout(() => {
            addMessageToChat('ai', "I've received your image. Would you like me to analyze, edit, or generate something similar?", {
                type: 'text',
                options: ['Analyze', 'Edit', 'Generate similar']
            });
        }, 500);
    }
    
    // ===== VOICE INPUT =====
    
    function handleVoiceInput() {
        if (!('webkitSpeechRecognition' in window)) {
            addMessageToChat('ai', "Your browser doesn't support speech recognition. Please try Chrome or Edge.", {
                type: 'text'
            });
            return;
        }
        
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => {
            voiceButton.classList.add('recording');
            showToast("Listening... Speak now");
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            voiceButton.classList.remove('recording');
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            voiceButton.classList.remove('recording');
            showToast("Error: " + event.error);
        };
        
        recognition.onend = () => {
            voiceButton.classList.remove('recording');
        };
        
        recognition.start();
    }
    
    // ===== RESPONSE RATING =====
    
    function rateResponse(messageId, rating) {
        const messageIndex = conversationHistory.findIndex(msg => msg.id === messageId);
        if (messageIndex === -1) return;
        
        conversationHistory[messageIndex].metadata.rating = rating;
        saveConversation();
        
        // Send feedback to server
        fetch('/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messageId,
                rating,
                conversationId: Date.now() // Simple ID for example
            })
        });
        
        showToast(`Feedback submitted: ${rating}`);
    }
});
