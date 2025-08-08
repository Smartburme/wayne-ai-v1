class ChatApp {
    constructor() {
        this.chatBox = document.getElementById('chatBox');
        this.userInput = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.aiEngine = new AIEngine();
        this.messageCount = 0;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.autoResizeTextarea();
    }

    setupEventListeners() {
        // Send message on button click
        this.sendBtn.addEventListener('click', () => this.processUserInput());
        
        // Send message on Enter key (but allow Shift+Enter for new lines)
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.processUserInput();
            }
        });
        
        // Auto-focus input when page loads
        window.addEventListener('load', () => {
            this.userInput.focus();
        });
    }

    autoResizeTextarea() {
        this.userInput.addEventListener('input', () => {
            this.userInput.style.height = 'auto';
            this.userInput.style.height = `${this.userInput.scrollHeight}px`;
        });
    }

    async processUserInput() {
        const message = this.userInput.value.trim();
        if (!message) return;

        this.addMessage('user', message);
        this.userInput.value = '';
        this.userInput.style.height = 'auto';
        
        const typingIndicator = this.showTypingIndicator();
        try {
            const response = await this.aiEngine.process(message);
            this.addMessage('ai', response.text);
        } catch (error) {
            this.addMessage('ai', "I'm having trouble connecting. Please try again later.");
            console.error('Chat Error:', error);
        } finally {
            this.removeTypingIndicator(typingIndicator);
        }
    }

    addMessage(sender, content) {
        this.messageCount++;
        const messageId = `msg-${this.messageCount}`;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const messageDiv = document.createElement('div');
        messageDiv.id = messageId;
        messageDiv.className = `${sender}-message message`;
        messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-timestamp">${timestamp}</div>
        `;
        
        this.chatBox.appendChild(messageDiv);
        Animator.fadeIn(messageDiv);
        this.scrollToMessage(messageId);
    }

    showTypingIndicator() {
        const typingId = `typing-${Date.now()}`;
        const typingDiv = document.createElement('div');
        typingDiv.id = typingId;
        typingDiv.className = 'ai-message typing';
        typingDiv.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        this.chatBox.appendChild(typingDiv);
        Animator.createTypingIndicator(typingDiv);
        this.scrollToMessage(typingId);
        
        return typingId;
    }

    removeTypingIndicator(id) {
        const typingElement = document.getElementById(id);
        if (typingElement) {
            typingElement.remove();
        }
    }

    scrollToMessage(id) {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'end'
            });
        }
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => new ChatApp());
