import { connectToKnowledge } from '../engine/y-npl/knowledge-connector.js';

export class AIEngine {
    constructor() {
        this.context = [];
        this.maxContextLength = 5;
    }

    async processInput(userInput) {
        // Add to conversation context
        this.context.push({ role: 'user', content: userInput });
        if (this.context.length > this.maxContextLength) {
            this.context.shift();
        }

        // Get relevant knowledge
        const knowledge = await connectToKnowledge(userInput);
        
        // Generate response (simplified)
        let response = "I'm not sure how to respond to that.";
        if (knowledge) {
            response = this.generateFromKnowledge(knowledge);
        }

        // Add AI response to context
        this.context.push({ role: 'ai', content: response });
        return response;
    }

    generateFromKnowledge(knowledge) {
        // Simple response generation logic
        return `Based on my knowledge: ${knowledge.slice(0, 150)}...`;
    }
}
