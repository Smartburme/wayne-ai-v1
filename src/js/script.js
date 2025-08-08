document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const fileUpload = document.getElementById('file-upload');

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
                // You can add your image-to-AI logic here
                appendMessage('bot', '🧠 ဓာတ်ပုံအတွက် အကြောင်းအရာဖော်ပြနေပါသည်... (AI Integration Needed)');
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
        simulateAIResponse(message); // Replace with real API call
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

    // Simulated AI Response (Replace with actual API logic)
    function simulateAIResponse(prompt) {
        setTimeout(() => {
            const reply = `🤖 Wayne AI: "${prompt}" ကို ချက်ချင်း မေးမြန်းသည့်အဖြစ်သုံးထားသည်။ (API logic မထည့်ရသေးပါ)`;
            appendMessage('bot', reply);
        }, 1000);
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
