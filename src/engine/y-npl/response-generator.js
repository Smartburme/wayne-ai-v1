import { marked } from 'marked';

class ResponseGenerator {
    constructor() {
        this.templates = {
            text: {
                single: (knowledge) => this.formatTextResponse(knowledge),
                multiple: (knowledgeItems) => this.formatMultipleTextResponse(knowledgeItems)
            },
            image: {
                single: (knowledge) => this.formatImageResponse(knowledge),
                multiple: (knowledgeItems) => this.formatMultipleImageResponse(knowledgeItems)
            },
            code: {
                single: (knowledge) => this.formatCodeResponse(knowledge),
                multiple: (knowledgeItems) => this.formatMultipleCodeResponse(knowledgeItems)
            }
        };
    }

    async generate(parsedInput, knowledgeItems) {
        if (!knowledgeItems || knowledgeItems.length === 0) {
            return this.generateNoKnowledgeResponse(parsedInput);
        }

        const primaryType = this.determinePrimaryType(parsedInput, knowledgeItems);
        const template = knowledgeItems.length > 1 ? 
            this.templates[primaryType].multiple : 
            this.templates[primaryType].single;

        return {
            text: marked.parse(template(knowledgeItems)),
            code: primaryType === 'code' ? knowledgeItems[0].codeBlocks[0]?.code : null,
            context: {
                relatedKnowledge: await this.getRelatedKnowledge(knowledgeItems[0], 
                knowledgeType: primaryType
            }
        };
    }

    async generateImageResponse(analysis, knowledgeItems) {
        if (!knowledgeItems || knowledgeItems.length === 0) {
            return {
                text: marked.parse(this.getNoImageKnowledgeResponse(analysis)),
                image: null
            };
        }

        const response = knowledgeItems.length > 1 ?
            this.templates.image.multiple(knowledgeItems) :
            this.templates.image.single(knowledgeItems[0]);

        return {
            text: marked.parse(response),
            image: null,
            context: {
                relatedKnowledge: await this.getRelatedKnowledge(knowledgeItems[0], 
                knowledgeType: 'image'
            }
        };
    }

    // Formatting methods
    formatTextResponse(knowledge) {
        return `**${knowledge.title}**\n\n${knowledge.content}`;
    }

    formatMultipleTextResponse(knowledgeItems) {
        return `အောက်ပါအချက်အလက်များကို တွေ့ရှိပါသည်:\n\n${
            knowledgeItems.map(k => `- **${k.title}**: ${k.content.slice(0, 100)}...`).join('\n')
        }\n\nအသေးစိတ်သိလိုပါက တစ်ခုခုကိုရွေးချယ်မေးမြန်းပါ။`;
    }

    formatCodeResponse(knowledge) {
        const codeBlock = knowledge.codeBlocks?.[0];
        return `**${knowledge.title}**\n\n${knowledge.content}${
            codeBlock ? `\n\n\`\`\`${codeBlock.language || ''}\n${codeBlock.code}\n\`\`\`` : ''
        }`;
    }

    formatMultipleCodeResponse(knowledgeItems) {
        return `ကုဒ်နှင့်သက်ဆိုင်သော အချက်အလက်များ:\n\n${
            knowledgeItems.map(k => `- **${k.title}**: ${k.content.slice(0, 80)}...`).join('\n')
        }\n\nအသေးစိတ်ကြည့်ရှုရန် ခေါင်းစဉ်တစ်ခုကိုရွေးချယ်ပါ။`;
    }

    formatImageResponse(knowledge) {
        return `**${knowledge.title}**\n\n${knowledge.content}`;
    }

    formatMultipleImageResponse(knowledgeItems) {
        return `ဓာတ်ပုံနှင့်သက်ဆိုင်သော အချက်အလက်များ:\n\n${
            knowledgeItems.map(k => `- **${k.title}**: ${k.content.slice(0, 80)}...`).join('\n')
        }`;
    }

    // Helper methods
    determinePrimaryType(parsedInput, knowledgeItems) {
        if (parsedInput.intent === 'coding_help') return 'code';
        if (parsedInput.intent === 'image_analysis') return 'image';
        return knowledgeItems[0].type || 'text';
    }

    async getRelatedKnowledge(primaryKnowledge, count = 3) {
        return knowledgeConnector.getRelatedKnowledge(
            primaryKnowledge.title, 
            primaryKnowledge.type, 
            count
        );
    }

    generateNoKnowledgeResponse(parsedInput) {
        const responses = {
            coding_help: "ဤကုဒ်ပြဿနာနှင့်ပတ်သက်သော အချက်အလက်များ မတွေ့ရှိသေးပါ။ ပိုမိုရှင်းလင်းစွာ မေးမြန်းပေးပါ။",
            image_analysis: "ဤဓာတ်ပုံနှင့်ပတ်သက်သော အချက်အလက်များ မတွေ့ရှိသေးပါ။",
            default: "သင့်မေးခွန်းနှင့်ပတ်သက်သော အချက်အလက်များ မတွေ့ရှိသေးပါ။ အခြားနည်းလမ်းဖြင့် မေးမြန်းကြည့်ပါ။"
        };

        return {
            text: responses[parsedInput.intent] || responses.default,
            code: null
        };
    }

    getNoImageKnowledgeResponse(analysis) {
        return analysis.tags.length > 0 ?
            `ဤဓာတ်ပုံတွင် ${analysis.tags.join(', ')} များပါဝင်နေပါသည်။ သို့သော် ပိုမိုအထောက်အကူပြုနိုင်ရန် ပိုမိုရှင်းလင်းသော ဓာတ်ပုံတင်ပေးပါ။` :
            "ဤဓာတ်ပုံနှင့်ပတ်သက်သော အထောက်အကူပြုအချက်အလက်များ မတွေ့ရှိပါ။";
    }
}

// Singleton instance
const instance = new ResponseGenerator();
export default instance;
