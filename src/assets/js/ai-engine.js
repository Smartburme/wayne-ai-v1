class AIEngine {
  constructor() {
    this.apiBase = '/engine/y-npl';
    this.conversationHistory = [];
    this.contextWindow = 5; // Remember last 5 messages
  }

  async processQuery(query) {
    // Add to conversation history
    this.updateHistory({ role: 'user', content: query });

    try {
      const response = await this.sendToAPI(query);
      this.updateHistory({ role: 'ai', content: response.text });
      return response;
    } catch (error) {
      console.error('AI Processing Error:', error);
      return {
        text: "I'm having trouble processing that request. Please try again later.",
        error: true
      };
    }
  }

  async sendToAPI(query) {
    const response = await fetch(`${this.apiBase}/parser.py`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Conversation-Hash': this.getConversationHash()
      },
      body: JSON.stringify({
        query,
        context: this.getContext()
      })
    });

    if (!response.ok) throw new Error('API request failed');
    return await response.json();
  }

  updateHistory(message) {
    this.conversationHistory.push(message);
    // Maintain context window
    if (this.conversationHistory.length > this.contextWindow * 2) {
      this.conversationHistory.shift();
    }
  }

  getContext() {
    return this.conversationHistory.slice(-this.contextWindow);
  }

  getConversationHash() {
    // Simple hash for conversation tracking
    return btoa(JSON.stringify(this.conversationHistory)).slice(0, 16);
  }
}

// Singleton instance
const aiEngine = new AIEngine();

// For chat interface integration
window.processAIQuery = async (query) => {
  return await aiEngine.processQuery(query);
};
