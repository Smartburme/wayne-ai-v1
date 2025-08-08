// Chat message များကိုလက်ခံခြင်းနှင့်ပြသခြင်း
document.getElementById('chat-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const userInput = document.getElementById('user-input').value;
    displayMessage(userInput, 'user');
    
    // AI ထံမှအဖြေတောင်းခံရန်
    getAIResponse(userInput).then(response => {
        displayMessage(response, 'ai');
    });
});

function displayMessage(message, sender) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
}
