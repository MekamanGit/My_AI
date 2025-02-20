class VoiceChat {
    constructor() {
        this.startBtn = document.getElementById('startBtn');
        this.muteBtn = document.getElementById('muteBtn');
        this.messages = document.getElementById('messages');
        this.status = document.getElementById('status');
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.synthesis = window.speechSynthesis;
        this.isMuted = false;
        
        this.setupRecognition();
        this.setupEventListeners();
        this.setupDotsFace();
        this.soundWaves = document.querySelector('.sound-waves');
    }

    setupRecognition() {
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            this.addMessage(text, 'user-message');
            this.sendToServer(text);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.status.textContent = 'Error: ' + event.error;
        };
    }

    setupEventListeners() {
        this.startBtn.addEventListener('mousedown', () => {
            this.startListening();
        });

        this.startBtn.addEventListener('mouseup', () => {
            this.stopListening();
        });

        this.startBtn.addEventListener('mouseleave', () => {
            this.stopListening();
        });

        this.muteBtn.addEventListener('click', () => {
            this.toggleMute();
        });
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        const icon = this.muteBtn.querySelector('i');
        icon.className = this.isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    }

    startListening() {
        this.recognition.start();
        this.status.innerHTML = '<i class="fas fa-circle status-icon"></i><span>Listening...</span>';
        this.status.classList.add('listening');
        this.startBtn.classList.add('recording');
    }

    stopListening() {
        this.recognition.stop();
        this.status.innerHTML = '<i class="fas fa-circle status-icon"></i><span>Idle</span>';
        this.status.classList.remove('listening');
        this.startBtn.classList.remove('recording');
    }

    addMessage(text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${className}`;
        messageDiv.textContent = text;
        this.messages.appendChild(messageDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
        
        // Remove welcome message if present
        const welcome = this.messages.querySelector('.welcome-message');
        if (welcome) {
            welcome.remove();
        }
    }

    async sendToServer(text) {
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: text }),
            });

            const data = await response.json();
            if (data.response) {
                this.addMessage(data.response, 'ai-message');
                this.speak(data.response);
            }
        } catch (error) {
            console.error('Error:', error);
            this.status.textContent = 'Error: Failed to get response';
        }
    }

    setupDotsFace() {
        const face = document.querySelector('.dots-face');
        const numDots = 200;
        const radius = 80;
        const centerX = 100;
        const centerY = 100;

        for (let i = 0; i < numDots; i++) {
            const angle = (i / numDots) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            const dot = document.createElement('div');
            dot.className = 'dot';
            dot.style.left = `${x}px`;
            dot.style.top = `${y}px`;
            face.appendChild(dot);
        }
    }

    speak(text) {
        if (!this.isMuted) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1;
            utterance.pitch = 1;
            
            // Activate sound waves
            this.soundWaves.classList.add('active');
            
            utterance.onend = () => {
                this.soundWaves.classList.remove('active');
            };
            
            // Animate dots while speaking
            const dots = document.querySelectorAll('.dot');
            dots.forEach(dot => {
                dot.style.transform = 'scale(1.5)';
                dot.style.opacity = '0.8';
            });
            
            utterance.onend = () => {
                this.soundWaves.classList.remove('active');
                dots.forEach(dot => {
                    dot.style.transform = 'scale(1)';
                    dot.style.opacity = '0.5';
                });
            };
            
            this.synthesis.speak(utterance);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new VoiceChat();
}); 