import KnowledgeConnector from './knowledge-connector.js';
import { analyzeSentiment, detectLanguage } from './nlp-utils.js';

class ResponseGenerator {
  constructor() {
    this.connector = new KnowledgeConnector();
    this.cache = new Map();
    this.loadKnowledge();
  }

  async loadKnowledge() {
    try {
      await this.connector.loadAllKnowledge();
      console.log('Knowledge base loaded successfully');
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
      throw new Error('Knowledge initialization failed');
    }
  }

  async generateResponse(userInput, context = {}) {
    if (!userInput || typeof userInput !== 'string') {
      throw new Error('Invalid input: must be a non-empty string');
    }

    // Initialize response structure
    const response = {
      text: [],
      images: [],
      code: [],
      metadata: {
        language: detectLanguage(userInput),
        sentiment: analyzeSentiment(userInput),
        timestamp: new Date().toISOString()
      }
    };

    try {
      // Check cache first
      const cacheKey = this._createCacheKey(userInput, context);
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Analyze input and get resources
      const { primaryType, secondaryTypes } = this.analyzeInputType(userInput);
      const resourcePromises = [];

      // Prioritize based on input type
      resourcePromises.push(
        this._getResourcesByType(primaryType, userInput, context)
      );

      // Include secondary types if needed
      if (context.includeSecondary !== false) {
        secondaryTypes.forEach(type => {
          resourcePromises.push(
            this._getResourcesByType(type, userInput, context)
          );
        });
      }

      // Execute all queries in parallel
      const results = await Promise.all(resourcePromises);

      // Merge results
      results.forEach(resources => {
        if (resources) {
          response[resources.type] = resources.data;
        }
      });

      // Format and cache response
      const formattedResponse = this.formatResponse(response, userInput);
      this.cache.set(cacheKey, formattedResponse);

      return formattedResponse;
    } catch (error) {
      console.error('Error generating response:', error);
      return this._createErrorResponse(userInput, error);
    }
  }

  async _getResourcesByType(type, input, context) {
    try {
      let data;
      switch (type) {
        case 'text':
          data = await this.connector.getTextResources(input, context);
          break;
        case 'image':
          data = await this.connector.getImageResources(input, context);
          break;
        case 'code':
          data = await this.connector.getCoderResources(input, context);
          break;
        default:
          return null;
      }
      return { type, data };
    } catch (error) {
      console.warn(`Failed to get ${type} resources:`, error);
      return null;
    }
  }

  analyzeInputType(input) {
    const lowerInput = input.toLowerCase();
    const codingKeywords = ['code', 'program', 'script', 'algorithm', 'function', 'debug'];
    const imageKeywords = ['image', 'photo', 'picture', 'visual', 'graphic'];
    const textKeywords = ['text', 'word', 'language', 'meaning', 'define'];

    const codingMatch = codingKeywords.some(kw => lowerInput.includes(kw));
    const imageMatch = imageKeywords.some(kw => lowerInput.includes(kw));
    const textMatch = textKeywords.some(kw => lowerInput.includes(kw));

    // Determine primary and secondary types
    if (codingMatch && !imageMatch && !textMatch) {
      return { primaryType: 'code', secondaryTypes: [] };
    }
    if (imageMatch && !codingMatch && !textMatch) {
      return { primaryType: 'image', secondaryTypes: [] };
    }
    if (textMatch && !codingMatch && !imageMatch) {
      return { primaryType: 'text', secondaryTypes: [] };
    }

    // Mixed types - prioritize based on keyword position
    const types = [];
    if (codingMatch) types.push('code');
    if (imageMatch) types.push('image');
    if (textMatch) types.push('text');

    return {
      primaryType: types[0] || 'text',
      secondaryTypes: types.slice(1)
    };
  }

  formatResponse(response, userInput) {
    // Create markdown sections only for non-empty resource types
    const sections = [];
    const { text, images, code, metadata } = response;

    if (text.length > 0) {
      sections.push(this._formatSection('Text Resources', text));
    }

    if (images.length > 0) {
      sections.push(this._formatSection('Image Resources', images, true));
    }

    if (code.length > 0) {
      sections.push(this._formatSection('Coding Resources', code));
    }

    // Fallback if no resources found
    if (sections.length === 0) {
      return {
        content: "I couldn't find specific information about your query. Could you please provide more details?",
        suggestions: this._generateSuggestions(userInput),
        metadata
      };
    }

    return {
      content: sections.join('\n\n'),
      metadata,
      quickReplies: this._generateQuickReplies(response)
    };
  }

  _formatSection(title, items, isImages = false) {
    let section = `## ${title}\n`;
    
    items.forEach((item, index) => {
      section += `${index + 1}. **${item.name}**\n`;
      
      if (isImages) {
        section += `![${item.name}](${item.thumbnailUrl || item.url})\n`;
      }
      
      if (item.description) {
        section += `   ${item.description}\n`;
      }
      
      if (item.metadata) {
        section += `   \`${JSON.stringify(item.metadata)}\`\n`;
      }
      
      if (item.url) {
        section += `   [View Resource](${item.url})\n\n`;
      }
    });

    return section;
  }

  _generateSuggestions(input) {
    const suggestions = [
      "Try rephrasing your question",
      "Be more specific about what you're looking for",
      "Check your spelling"
    ];

    if (input.length < 5) {
      suggestions.unshift("Your query seems very short - could you elaborate?");
    }

    return suggestions;
  }

  _generateQuickReplies(response) {
    const quickReplies = [];
    
    if (response.text.length > 0) {
      quickReplies.push({
        title: 'More text resources',
        action: 'load_more_text'
      });
    }
    
    if (response.code.length > 0) {
      quickReplies.push({
        title: 'View code examples',
        action: 'show_code_examples'
      });
    }

    return quickReplies.length > 0 ? quickReplies : null;
  }

  _createCacheKey(input, context) {
    const contextString = JSON.stringify(context);
    return `${input}-${contextString}`;
  }

  _createErrorResponse(input, error) {
    return {
      content: "I'm having trouble processing your request right now. Please try again later.",
      error: error.message,
      input,
      timestamp: new Date().toISOString()
    };
  }

  clearCache() {
    this.cache.clear();
  }
}

export default ResponseGenerator;
