import { MarkdownProcessor } from './markdown-processor.js';

class KnowledgeConnector {
    constructor() {
        this.knowledgeBases = {
            text: new Map(),
            image: new Map(),
            code: new Map()
        };
        this.cache = {
            lastUpdated: null,
            etags: {}
        };
        this.baseUrl = 'https://raw.githubusercontent.com/Smartburme/wayne-ai-v1/main/src/docs/knowledge';
    }

    async initialize() {
        try {
            await this.loadAllKnowledge();
            console.log('Knowledge bases initialized successfully');
            return true;
        } catch (error) {
            console.error('Knowledge initialization failed:', error);
            throw error;
        }
    }

    async loadAllKnowledge() {
        const [textData, imageData, codeData] = await Promise.all([
            this.fetchKnowledge('text-knowledge.md'),
            this.fetchKnowledge('image-knowledge.md'),
            this.fetchKnowledge('coder-knowledge.md')
        ]);

        this.processKnowledge(textData, 'text');
        this.processKnowledge(imageData, 'image');
        this.processKnowledge(codeData, 'code');
    }

    async fetchKnowledge(filename) {
        try {
            const url = `${this.baseUrl}/${filename}`;
            const cacheKey = filename;
            
            // Check cache first
            if (this.cache.etags[cacheKey]) {
                const response = await fetch(url, {
                    headers: { 'If-None-Match': this.cache.etags[cacheKey] }
                });
                
                if (response.status === 304) {
                    console.log(`Using cached version of ${filename}`);
                    return null; // No update needed
                }
            }

            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
            
            // Update cache
            this.cache.etags[cacheKey] = response.headers.get('ETag');
            this.cache.lastUpdated = new Date();
            
            return await response.text();
        } catch (error) {
            console.error(`Failed to fetch ${filename}:`, error);
            throw error;
        }
    }

    processKnowledge(markdownContent, type) {
        if (!markdownContent) return; // Skip if no update
        
        const sections = MarkdownProcessor.splitSections(markdownContent);
        sections.forEach(section => {
            const { title, content, tags, codeBlocks } = MarkdownProcessor.parseSection(section);
            this.knowledgeBases[type].set(title, { 
                content, 
                tags,
                codeBlocks,
                lastUpdated: new Date()
            });
        });
    }

    async searchKnowledge(query, type = null) {
        // If type is specified, search only that knowledge base
        const typesToSearch = type ? [type] : ['text', 'image', 'code'];
        const results = [];
        
        for (const knowledgeType of typesToSearch) {
            for (const [title, data] of this.knowledgeBases[knowledgeType]) {
                const relevance = this.calculateRelevance(query, title, data);
                if (relevance > 0) {
                    results.push({
                        type: knowledgeType,
                        title,
                        ...data,
                        relevance
                    });
                }
            }
        }
        
        return results.sort((a, b) => b.relevance - a.relevance);
    }

    calculateRelevance(query, title, { content, tags }) {
        const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
        if (queryTerms.length === 0) return 0;
        
        let score = 0;
        
        // Title matches
        const titleLower = title.toLowerCase();
        queryTerms.forEach(term => {
            if (titleLower.includes(term)) score += 5;
        });
        
        // Tag matches
        if (tags) {
            queryTerms.forEach(term => {
                if (tags.some(tag => tag.toLowerCase() === term)) score += 3;
            });
        }
        
        // Content matches
        const contentLower = content.toLowerCase();
        queryTerms.forEach(term => {
            const termCount = (contentLower.match(new RegExp(term, 'g')) || []).length;
            score += termCount * 0.5;
        });
        
        return score;
    }

    async getRelatedKnowledge(title, type, count = 3) {
        const baseEntry = this.knowledgeBases[type]?.get(title);
        if (!baseEntry) return [];
        
        const related = [];
        const baseTags = baseEntry.tags || [];
        
        for (const [otherTitle, data] of this.knowledgeBases[type]) {
            if (otherTitle === title) continue;
            
            const commonTags = (data.tags || []).filter(tag => 
                baseTags.includes(tag)
            ).length;
            
            if (commonTags > 0) {
                related.push({
                    title: otherTitle,
                    ...data,
                    relevance: commonTags
                });
            }
        }
        
        return related
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, count);
    }

    async refreshKnowledge() {
        try {
            await this.loadAllKnowledge();
            return true;
        } catch (error) {
            console.error('Failed to refresh knowledge:', error);
            return false;
        }
    }
}

// Singleton instance
const knowledgeConnector = new KnowledgeConnector();
export default knowledgeConnector;
