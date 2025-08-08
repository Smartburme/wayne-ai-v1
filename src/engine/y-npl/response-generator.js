export function generateResponse(intent, entities, context) {
    switch(intent) {
        case 'greeting':
            return getRandomGreeting();
        case 'question':
            return `That's an interesting question about ${entities[0]}. Let me think...`;
        default:
            return "Could you rephrase that? I want to make sure I understand.";
    }
}

function getRandomGreeting() {
    const greetings = [
        "Hello! How can I assist you today?",
        "Hi there! What's on your mind?",
        "Greetings! Ready to explore some ideas?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
}
