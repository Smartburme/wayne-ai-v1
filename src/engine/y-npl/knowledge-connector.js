class KnowledgeConnector {
  constructor() {
    this.knowledgeBases = {
      text: [],
      image: [],
      code: [],
      _meta: {
        lastUpdated: null,
        version: '1.0'
      }
    };
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour cache expiry
  }

  async loadAllKnowledge() {
    try {
      const loadStart = performance.now();
      
      await Promise.all([
        this._loadKnowledgeBase('text', '../docs/knowledge/text-knowledge.md'),
        this._loadKnowledgeBase('image', '../docs/knowledge/image-knowledge.md'),
        this._loadKnowledgeBase('code', '../docs/knowledge/coder-knowledge.md')
      ]);

      this.knowledgeBases._meta.lastUpdated = new Date();
      console.log(`Knowledge bases loaded in ${(performance.now() - loadStart).toFixed(2)}ms`);
    } catch (error) {
      console.error('Failed to load knowledge bases:', error);
      throw new Error('Knowledge initialization failed');
    }
  }

  async _loadKnowledgeBase(type, path) {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const md = await response.text();
      this.knowledgeBases[type] = this._parseEnhancedMarkdown(md);
      console.log(`Loaded ${type} knowledge base with ${this.knowledgeBases[type].length} entries`);
    } catch (error) {
      console.error(`Error loading ${type} knowledge:`, error);
      throw error;
    }
  }

  _parseEnhancedMarkdown(mdContent) {
    const resources = [];
    const lines = mdContent.split('\n');
    let currentResource = null;
    let inMetadata = false;
    let inDescription = false;
    let descriptionLines = [];

    lines.forEach(line => {
      // Match resource entries with optional priority
      const resourceMatch = line.match(/^(\d+)\.\s\[(.+?)\]\((.+?)\)(?:\s*\{\s*priority:\s*(\d+)\s*\})?/);
      if (resourceMatch) {
        if (currentResource) {
          if (descriptionLines.length > 0) {
            currentResource.description = descriptionLines.join('\n').trim();
            descriptionLines = [];
          }
          resources.push(currentResource);
        }
        
        currentResource = {
          name: resourceMatch[2],
          url: resourceMatch[3],
          priority: parseInt(resourceMatch[4]) || 0,
          metadata: {},
          tags: []
        };
        inMetadata = false;
        inDescription = false;
        return;
      }

      // Match metadata section
      if (line.trim() === '```metadata') {
        inMetadata = true;
        return;
      }
      if (inMetadata && line.trim() === '```') {
        inMetadata = false;
        return;
      }

      // Process metadata
      if (inMetadata && currentResource) {
        const metaMatch = line.match(/^-\s(.+?):\s(.+)$/);
        if (metaMatch) {
          currentResource.metadata[metaMatch[1]] = metaMatch[2];
        }
        return;
      }

      // Match tags
      const tagMatch = line.match(/^tags:\s(.+)$/);
      if (tagMatch && currentResource) {
        currentResource.tags = tagMatch[1].split(',').map(t => t.trim());
        return;
      }

      // Capture description (lines after resource until empty line or next item)
      if (currentResource && line.trim() && !line.match(/^\d+\./) && !line.match(/^```/)) {
        inDescription = true;
        descriptionLines.push(line);
      } else if (inDescription && !line.trim()) {
        inDescription = false;
      }
    });

    // Add the last resource if exists
    if (currentResource) {
      if (descriptionLines.length > 0) {
        currentResource.description = descriptionLines.join('\n').trim();
      }
      resources.push(currentResource);
    }

    // Sort by priority (higher first) then by name
    return resources.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.name.localeCompare(b.name);
    });
  }

  async getTextResources(query, options = {}) {
    return this._getResources('text', query, options);
  }

  async getImageResources(query, options = {}) {
    return this._getResources('image', query, options);
  }

  async getCoderResources(query, options = {}) {
    return this._getResources('code', query, options);
  }

  async _getResources(type, query, options = {}) {
    const cacheKey = this._createCacheKey(type, query, options);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      let resources = this.knowledgeBases[type];
      
      if (query) {
        resources = this._filterResources(resources, query, options);
      }

      if (options.limit) {
        resources = resources.slice(0, options.limit);
      }

      const result = {
        data: resources,
        meta: {
          total: resources.length,
          type,
          query
        }
      };

      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error(`Error getting ${type} resources:`, error);
      return {
        data: [],
        meta: {
          error: error.message,
          type,
          query
        }
      };
    }
  }

  _filterResources(resources, query, options = {}) {
    const queryLower = query.toLowerCase();
    const searchFields = options.searchFields || ['name', 'url', 'description', 'tags'];
    const threshold = options.threshold || 0.3;

    return resources.filter(resource => {
      // Exact matches
      if (options.exactMatch) {
        return searchFields.some(field => {
          const value = this._getResourceField(resource, field);
          return value && value.toLowerCase() === queryLower;
        });
      }

      // Fuzzy search with scoring
      let score = 0;
      searchFields.forEach(field => {
        const value = this._getResourceField(resource, field);
        if (value) {
          score += this._getMatchScore(value, queryLower, field === 'tags' ? 2 : 1);
        }
      });

      return score >= threshold;
    });
  }

  _getResourceField(resource, field) {
    if (field === 'tags') return resource.tags.join(' ');
    if (field in resource) return resource[field];
    if (field in resource.metadata) return resource.metadata[field];
    return null;
  }

  _getMatchScore(value, query, weight = 1) {
    const valueLower = value.toString().toLowerCase();
    if (valueLower.includes(query)) return 1 * weight;
    
    // Partial match scoring
    const queryWords = query.split(/\s+/);
    const valueWords = valueLower.split(/\s+/);
    
    const matches = queryWords.filter(qw => 
      valueWords.some(vw => vw.includes(qw))
    return (matches.length / queryWords.length) * 0.7 * weight;
  }

  _createCacheKey(type, query, options) {
    const optionsString = JSON.stringify(options);
    return `${type}-${query || 'all'}-${optionsString}`;
  }

  clearCache() {
    this.cache.clear();
    console.log('Knowledge cache cleared');
  }

  getStats() {
    return {
      text: this.knowledgeBases.text.length,
      image: this.knowledgeBases.image.length,
      code: this.knowledgeBases.code.length,
      lastUpdated: this.knowledgeBases._meta.lastUpdated,
      cacheSize: this.cache.size
    };
  }
}

// Export a singleton instance
const knowledgeConnector = new KnowledgeConnector();
export default knowledgeConnector;
