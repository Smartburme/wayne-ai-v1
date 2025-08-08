const knowledgeSources = {
    coding: ['docs/knowledge/coder-knowledge.md'],
    general: ['docs/knowledge/text-knowledge.md']
};

export async function connectToKnowledge(query) {
    // Simple keyword matching to determine knowledge source
    const isCodingQuery = query.toLowerCase().includes('code') || 
                         query.toLowerCase().includes('program');
    
    const sourcePath = isCodingQuery ? 
                      knowledgeSources.coding[0] : 
                      knowledgeSources.general[0];
    
    try {
        const response = await fetch(sourcePath);
        const text = await response.text();
        return this.findRelevantSection(text, query);
    } catch (error) {
        console.error('Knowledge connection failed:', error);
        return null;
    }
}

function findRelevantSection(text, query) {
    // Simple search for query keywords in knowledge
    const lines = text.split('\n');
    for (const line of lines) {
        if (line.toLowerCase().includes(query.toLowerCase())) {
            return line;
        }
    }
    return text.substring(0, 100); // Return first 100 chars if no match
}
