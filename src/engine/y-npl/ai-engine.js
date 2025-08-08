import KnowledgeConnector from './knowledge-connector.js';
import ResponseGenerator from './response-generator.js';
import Parser from './parser.js';

class AIEngine {
    constructor() {
        this.knowledgeConnector = new KnowledgeConnector();
        this.responseGenerator = new ResponseGenerator();
        this.parser = new Parser();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            await Promise.all([
                this.knowledgeConnector.initialize(),
                this.parser.loadModels()
            ]);
            this.initialized = true;
        } catch (error) {
            console.error('AI Engine initialization failed:', error);
            throw error;
        }
    }

    async process(input, context = {}) {
        await this.initialize();
        
        try {
            // Step 1: Parse the input
            const parsedInput = await this.parser.parse(input);
            
            // Step 2: Find relevant knowledge
            const knowledgeType = this.determineKnowledgeType(parsedInput);
            const knowledgeItems = await this.knowledgeConnector.searchKnowledge(
                parsedInput.text, 
                knowledgeType
            );
            
            // Step 3: Generate response
            const response = await this.responseGenerator.generate(parsedInput, knowledgeItems);
            
            return {
                ...response,
                context: {
                    ...context,
                    ...response.context
                }
            };
        } catch (error) {
            console.error("AI processing error:", error);
            return this.getFallbackResponse(error);
        }
    }

    async processImage(imageData, context = {}) {
        await this.initialize();
        
        try {
            // Step 1: Analyze image
            const analysis = await this.analyzeImage(imageData);
            
            // Step 2: Find relevant image knowledge
            const knowledgeItems = await this.knowledgeConnector.searchKnowledge(
                analysis.tags.join(' '), 
                'image'
            );
            
            // Step 3: Generate image response
            const response = await this.responseGenerator.generateImageResponse(analysis, knowledgeItems);
            
            return {
                ...response,
                context: {
                    ...context,
                    ...response.context
                }
            };
        } catch (error) {
            console.error("Image processing error:", error);
            return this.getImageFallbackResponse();
        }
    }

    // Helper methods
    determineKnowledgeType(parsedInput) {
        switch (parsedInput.intent) {
            case 'coding_help': return 'code';
            case 'image_analysis': return 'image';
            default: return null; // Search all types
        }
    }

    async analyzeImage(imageData) {
        // In a real implementation, integrate with computer vision API
        return {
            tags: ['image', 'uploaded'],
            description: 'User uploaded image',
            dominantColors: [],
            objects: []
        };
    }

    getFallbackResponse(error) {
        return {
            text: "တောင်းပန်ပါသည်၊ အချက်အလက်ရယူရာတွင် အခက်အခဲတစ်ခုဖြစ်ပေါ်နေပါသည်။",
            code: null
        };
    }

    getImageFallbackResponse() {
        return {
            text: "ဓာတ်ပုံဆန်းစစ်ရာတွင် အခက်အခဲတစ်ခုဖြစ်ပေါ်နေပါသည်။",
            image: null
        };
    }

    async refreshKnowledge() {
        return this.knowledgeConnector.refreshKnowledge();
    }
}

// Singleton instance
const instance = new AIEngine();
export default instance;
