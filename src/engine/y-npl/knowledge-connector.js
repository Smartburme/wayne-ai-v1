class KnowledgeConnector {
  constructor() {
    this.textKnowledge = [];
    this.imageKnowledge = [];
    this.coderKnowledge = [];
  }

  async loadAllKnowledge() {
    await Promise.all([
      this.loadTextKnowledge(),
      this.loadImageKnowledge(),
      this.loadCoderKnowledge()
    ]);
  }

  async loadTextKnowledge() {
    try {
      const response = await fetch('../docs/knowledge/text-knowledge.md');
      const md = await response.text();
      this.textKnowledge = this.parseMarkdown(md);
    } catch (err) {
      console.error("Error loading text knowledge:", err);
    }
  }

  async loadImageKnowledge() {
    try {
      const response = await fetch('../docs/knowledge/image-knowledge.md');
      const md = await response.text();
      this.imageKnowledge = this.parseMarkdown(md);
    } catch (err) {
      console.error("Error loading image knowledge:", err);
    }
  }

  async loadCoderKnowledge() {
    try {
      const response = await fetch('../docs/knowledge/coder-knowledge.md');
      const md = await response.text();
      this.coderKnowledge = this.parseMarkdown(md);
    } catch (err) {
      console.error("Error loading coder knowledge:", err);
    }
  }

  parseMarkdown(mdContent) {
    const resources = [];
    const lines = mdContent.split('\n');
    let currentResource = null;

    lines.forEach(line => {
      // Match numbered list items with markdown links
      const resourceMatch = line.match(/^\d+\.\s\[(.+?)\]\((.+?)\)/);
      if (resourceMatch) {
        if (currentResource) resources.push(currentResource);
        currentResource = {
          name: resourceMatch[1],
          url: resourceMatch[2],
          metadata: {}
        };
      }

      // Match metadata lines
      const metaMatch = line.match(/^`(.+?)`$/);
      if (metaMatch && currentResource) {
        metaMatch[1].split('|').forEach(item => {
          const [key, value] = item.split(':').map(s => s.trim());
          if (key && value) {
            currentResource.metadata[key] = value;
          }
        });
      }
    });

    if (currentResource) resources.push(currentResource);
    return resources;
  }

  getTextResources(query) {
    return this.filterResources(this.textKnowledge, query);
  }

  getImageResources(query) {
    return this.filterResources(this.imageKnowledge, query);
  }

  getCoderResources(query) {
    return this.filterResources(this.coderKnowledge, query);
  }

  filterResources(resources, query) {
    if (!query) return resources;
    
    const queryLower = query.toLowerCase();
    return resources.filter(resource => {
      return (
        resource.name.toLowerCase().includes(queryLower) ||
        resource.url.toLowerCase().includes(queryLower) ||
        Object.values(resource.metadata).some(
          val => val.toString().toLowerCase().includes(queryLower)
        )
      );
    });
  }
}

export default new KnowledgeConnector();
