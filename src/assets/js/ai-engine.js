class AIEngine {
    constructor() {
        this.apiBase = '/engine/y-npl';
        this.conversationHistory = [];
        this.contextSize = 5; // Number of messages to keep in context
    }

    async process(input) {
        // Add user message to history
        this.addToHistory('user', input);
        
        try {
            const response = await this.sendToAPI(input);
            
            // Add AI response to history
            this.addToHistory('ai', response.text);
            
            return response;
        } catch (error) {
            console.error('AI Engine Error:', error);
            return {
                text: this.getFallbackResponse(),
                error: true
            };
        }
    }

    async sendToAPI(query) {
        const response = await fetch(`${this.apiBase}/parser.py`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Conversation-ID': this.getConversationId()
            },
            body: JSON.stringify({
                query,
                context: this.getContext()
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        return response.json();
    }

    addToHistory(role, content) {
        this.conversationHistory.push({
            role,
            content,
            timestamp: new Date().toISOString()
        });
        
        // Maintain context window
        if (this.conversationHistory.length > this.contextSize * 2) {
            this.conversationHistory.shift();
        }
    }

    getContext() {
        return this.conversationHistory.slice(-this.contextSize);
    }

    getConversationId() {
        // Generate a simple ID based on conversation start time
        if (!this.conversationHistory[0]) {
            return `conv-${Date.now()}`;
        }
        return `conv-${new Date(this.conversationHistory[0].timestamp).getTime()}`;
    }

    getFallbackResponse() {
        const fallbacks = [
            "I'm having trouble understanding. Could you rephrase that?",
            "My AI engine is currently overloaded. Please try again in a moment.",
            "I don't have a response for that. Maybe ask me something else?"
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
}
