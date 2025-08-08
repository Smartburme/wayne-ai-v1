document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const fileUpload = document.getElementById('file-upload');

    const WORKER_API_URL = 'https://wayne-ai-v1.mysvm.workers.dev';

    // Load previous chat from localStorage
    if (localStorage.getItem('wayne-chat-history')) {
        chatMessages.innerHTML = localStorage.getItem('wayne-chat-history');
        scrollToBottom();
    }

    // Send button click
    sendBtn.addEventListener('click', () => {
        handleUserInput();
    });

    // Enter key to send message
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleUserInput();
        }
    });

    // File upload handler
    fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (event) {
                appendMessage('user', `<img src="${event.target.result}" class="chat-image" />`);
                appendMessage('bot', '🧠 ဓာတ်ပုံဖော်ပြချက်များကို Cloudflare Worker မှတစ်ဆင့် မသုံးရသေးပါ။');
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle user input
    function handleUserInput() {
        const message = userInput.value.trim();
        if (message === '') return;

        appendMessage('user', message);
        userInput.value = '';
        sendToWorker(message);
    }

    // Append message to chat
    function appendMessage(sender, content) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.innerHTML = content;
        chatMessages.appendChild(msgDiv);
        saveChat();
        scrollToBottom();
    }

    // Send prompt to Cloudflare Worker
    async function sendToWorker(prompt) {
        appendMessage('bot', '🤖 Wayne AI ကိုဆက်သွယ်နေသည်...');

        try {
            const res = await fetch(WORKER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: prompt })
            });

            if (!res.ok) throw new Error('Server error');

            const data = await res.json();

            if (data && data.reply) {
                updateLastBotMessage(data.reply);
            } else {
                updateLastBotMessage('🤖 မဖြေနိုင်သေးပါ... (response မှာ reply မပါရှိပါ)');
            }
        } catch (error) {
            updateLastBotMessage('❌ Cloudflare Worker မှာ ပြဿနာဖြစ်နေပါတယ်။');
            console.error(error);
        }
    }

    // Update last bot message (loading → response)
    function updateLastBotMessage(content) {
        const allMessages = document.querySelectorAll('.message.bot');
        const lastMsg = allMessages[allMessages.length - 1];
        if (lastMsg) {
            lastMsg.innerHTML = content;
        }
        saveChat();
        scrollToBottom();
    }

    // Save chat to localStorage
    function saveChat() {
        localStorage.setItem('wayne-chat-history', chatMessages.innerHTML);
    }

    // Scroll to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // New Chat (called from refresh button)
    window.startNewChat = function () {
        chatMessages.innerHTML = '';
        localStorage.removeItem('wayne-chat-history');
    };
});
