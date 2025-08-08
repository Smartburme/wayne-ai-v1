document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const fileUpload = document.getElementById('file-upload');

    const WORKER_API_URL = 'https://wayne-ai-v1.mysvm.workers.dev';

    // Load previous chat from localStorage
    const saved = localStorage.getItem('wayne-chat-history');
    if (saved) {
        chatMessages.innerHTML = saved;
        scrollToBottom();
    }

    // Send message
    sendBtn.addEventListener('click', () => {
        handleUserInput();
    });

    // Enter key to send
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleUserInput();
        }
    });

    // File upload (optional image preview)
    fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                appendMessage('user', `<img src="${event.target.result}" class="chat-image" />`);
                appendMessage('bot', '📷 ဓာတ်ပုံ input များကို မဖော်ပြနိုင်သေးပါ (Gemini vision မပါ)');
            };
            reader.readAsDataURL(file);
        }
    });

    function handleUserInput() {
        const prompt = userInput.value.trim();
        if (!prompt) return;

        appendMessage('user', prompt);
        userInput.value = '';
        sendToGeminiWorker(prompt);
    }

    function appendMessage(sender, content) {
        const msg = document.createElement('div');
        msg.className = `message ${sender}`;
        msg.innerHTML = content;
        chatMessages.appendChild(msg);
        saveChat();
        scrollToBottom();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function saveChat() {
        localStorage.setItem('wayne-chat-history', chatMessages.innerHTML);
    }

    // Show loading indicator message
    function showLoading() {
        appendMessage('bot', '<span class="loading">🤖 Wayne AI စဉ်းစားနေသည်...</span>');
    }

    // Replace last bot message with AI response
    function updateLastBotMessage(content) {
        const botMessages = document.querySelectorAll('.message.bot');
        const last = botMessages[botMessages.length - 1];
        if (last) {
            last.innerHTML = content;
        }
        saveChat();
        scrollToBottom();
    }

    // Communicate with Cloudflare Worker (Gemini)
    async function sendToGeminiWorker(prompt) {
        showLoading();

        try {
            const response = await fetch(WORKER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const data = await response.json();

            if (data.reply) {
                updateLastBotMessage(data.reply);
            } else {
                updateLastBotMessage('❓ Gemini မှပြန်လာသည့် data မှာ `reply` မပါရှိပါ။');
            }
        } catch (err) {
            updateLastBotMessage(`❌ ပြဿနာရှိနေပါတယ်: ${err.message}`);
            console.error('Gemini worker error:', err);
        }
    }

    // New chat reset
    window.startNewChat = () => {
        chatMessages.innerHTML = '';
        localStorage.removeItem('wayne-chat-history');
    };
});
