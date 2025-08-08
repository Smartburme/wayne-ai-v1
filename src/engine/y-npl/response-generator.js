import KnowledgeConnector from './knowledge-connector.js';

class ResponseGenerator {
  constructor() {
    this.connector = KnowledgeConnector;
    this.connector.loadAllKnowledge();
  }

  async generateResponse(userInput) {
    const response = {
      text: [],
      images: [],
      code: []
    };

    // Analyze input type
    const inputType = this.analyzeInputType(userInput);

    // Get relevant knowledge
    if (inputType === 'text') {
      response.text = await this.connector.getTextResources(userInput);
    } 
    else if (inputType === 'image') {
      response.images = await this.connector.getImageResources(userInput);
    }
    else if (inputType === 'code') {
      response.code = await this.connector.getCoderResources(userInput);
    }
    else {
      // Mixed query
      response.text = await this.connector.getTextResources(userInput);
      response.images = await this.connector.getImageResources(userInput);
      response.code = await this.connector.getCoderResources(userInput);
    }

    return this.formatResponse(response);
  }

  analyzeInputType(input) {
    const lowerInput = input.toLowerCase();
    
    if (/(image|photo|picture|visual)/.test(lowerInput)) {
      return 'image';
    }
    if (/(code|program|script|algorithm)/.test(lowerInput)) {
      return 'code';
    }
    if (/(text|word|language|meaning)/.test(lowerInput)) {
      return 'text';
    }
    return 'mixed';
  }

  formatResponse(response) {
    let formatted = '';
    
    if (response.text.length > 0) {
      formatted += '## Text Resources\n';
      response.text.forEach((item, i) => {
        formatted += `${i+1}. [${item.name}](${item.url})\n`;
        formatted += `   ${JSON.stringify(item.metadata)}\n\n`;
      });
    }

    if (response.images.length > 0) {
      formatted += '## Image Resources\n';
      response.images.forEach((item, i) => {
        formatted += `${i+1}. [${item.name}](${item.url})\n`;
        formatted += `   ${JSON.stringify(item.metadata)}\n\n`;
      });
    }

    if (response.code.length > 0) {
      formatted += '## Coding Resources\n';
      response.code.forEach((item, i) => {
        formatted += `${i+1}. [${item.name}](${item.url})\n`;
        formatted += `   ${JSON.stringify(item.metadata)}\n\n`;
      });
    }

    return formatted || 'No relevant knowledge found.';
  }
}

export default new ResponseGenerator();
