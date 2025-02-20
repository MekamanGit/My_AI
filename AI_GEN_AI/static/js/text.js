class TextChat {
    constructor() {
        this.messages = document.getElementById('messages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    addMessage(text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${className}`;
        messageDiv.textContent = text;
        this.messages.appendChild(messageDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
        
        const welcome = this.messages.querySelector('.welcome-message');
        if (welcome) welcome.remove();
    }

    async sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text) return;

        this.addMessage(text, 'user-message');
        this.messageInput.value = '';

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });

            const data = await response.json();
            if (data.response) {
                this.addMessage(data.response, 'ai-message');
            }
        } catch (error) {
            console.error('Error:', error);
            this.addMessage('Error: Failed to get response', 'error-message');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TextChat();
}); 