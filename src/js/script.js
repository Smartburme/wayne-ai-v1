document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const fileUpload = document.getElementById('file-upload');
    
    // Initialize chat
    initChat();
    
    // Event Listeners
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    fileUpload.addEventListener('change', handleFileUpload);
    
    // Functions
    function initChat() {
        // Load any previous chat history
        // Add welcome message
        addAIMessage("ဟယ်လို! Wayne AI မှကြိုဆိုပါသည်။ ကျွန်ုပ်ကိုဘာတွေမေးမြန်းချင်ပါသလဲ?");
    }
    
    function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            addUserMessage(message);
            userInput.value = '';
            
            // Process message and get AI response
            processUserMessage(message);
        }
    }
    
    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    addUserMessage("", event.target.result);
                    // Process image with AI
                    processImageMessage(event.target.result);
                };
                reader.readAsDataURL(file);
            } else {
                addAIMessage("ကျေးဇူးပြု၍ ဓာတ်ပုံဖိုင်ကိုသာ အပ်လုဒ်လုပ်ပါ။");
            }
        }
    }
    
    function addUserMessage(text, image = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        
        if (text) {
            messageDiv.textContent = text;
        }
        
        if (image) {
            const imgElement = document.createElement('img');
            imgElement.src = image;
            imgElement.className = 'message-image';
            messageDiv.appendChild(imgElement);
        }
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }
    
    function addAIMessage(text, code = null, image = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai-message';
        
        if (text) {
            messageDiv.innerHTML = marked.parse(text); // Using marked.js for markdown support
        }
        
        if (code) {
            const codeBlock = document.createElement('pre');
            codeBlock.className = 'code-block';
            codeBlock.textContent = code;
            messageDiv.appendChild(codeBlock);
        }
        
        if (image) {
            const imgElement = document.createElement('img');
            imgElement.src = image;
            imgElement.className = 'message-image';
            messageDiv.appendChild(imgElement);
        }
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }
    
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    async function processUserMessage(message) {
        // Show loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message ai-message';
        loadingDiv.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
        chatMessages.appendChild(loadingDiv);
        scrollToBottom();
        
        try {
            // Connect to Y-NPL engine
            const response = await YNPLProcessor.process(message);
            
            // Remove loading indicator
            chatMessages.removeChild(loadingDiv);
            
            // Display response
            if (response.code) {
                addAIMessage(response.text, response.code);
            } else {
                addAIMessage(response.text);
            }
        } catch (error) {
            chatMessages.removeChild(loadingDiv);
            addAIMessage("တောင်းပန်ပါသည်၊ အမှားတစ်ခုဖြစ်ပေါ်ခဲ့သည်။ ကျေးဇူးပြု၍ နောက်မှထပ်ကြိုးစားပါ။");
            console.error("Error processing message:", error);
        }
    }
    
    async function processImageMessage(imageData) {
        // Similar to processUserMessage but for images
        // Implementation would connect to image processing part of Y-NPL
    }
});

// Y-NPL Engine Integration
const YNPLProcessor = {
    async process(input) {
        // Connect to the various Y-NPL engine components
        const parsed = await Parser.parse(input);
        const knowledge = await KnowledgeConnections.findRelevant(parsed);
        const response = await ResponseGenerator.generate(parsed, knowledge);
        
        return {
            text: response.text,
            code: response.code || null
        };
    }
};
