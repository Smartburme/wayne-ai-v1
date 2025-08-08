// ===== DOM ELEMENTS =====
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// ===== AUTO-RESIZE TEXTAREA =====
userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = `${userInput.scrollHeight}px`;
});

// ===== MESSAGE HANDLING =====
function addMessage(sender, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `${sender}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = content;
    
    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ===== EVENT LISTENERS =====
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// ===== CORE FUNCTION =====
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage('user', message);
    userInput.value = '';
    userInput.style.height = 'auto';

    // Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'ai-message typing';
    typingIndicator.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    chatBox.appendChild(typingIndicator);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Get AI response
    try {
        const response = await fetch('/engine/y-npl/parser.py', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: message })
        });
        
        const data = await response.json();
        chatBox.removeChild(typingIndicator);
        addMessage('ai', data.text);
    } catch (error) {
        chatBox.removeChild(typingIndicator);
        addMessage('ai', `Error: ${error.message}`);
    }
}
