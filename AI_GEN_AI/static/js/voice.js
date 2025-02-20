class VoiceChat {
    constructor() {
        // Keep only voice-related functionality
        // Remove message display code
        this.startBtn = document.getElementById('startBtn');
        this.status = document.querySelector('.status');
        this.messages = document.getElementById('messages');
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.synthesis = window.speechSynthesis;
        this.soundGlow = document.querySelector('.sound-glow');
        this.audioContext = null;
        this.analyser = null;
        this.mediaStream = null;
        this.animationFrame = null;
        this.waves = document.querySelectorAll('.wave');
        this.selectedVoice = null;
        this.voices = [];
        this.currentVoice = null;
        
        this.setupRecognition();
        this.setupEventListeners();
        this.setupVoices();
        
        // Initially hide waves
        this.soundGlow.style.opacity = '0';
        
        // Initialize voices immediately and with a delay
        this.loadVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            this.loadVoices();
            // Batman's introduction
            this.speak("I am Batman. The Dark Knight of Gotham. I protect this city from the shadows - speak, and I will answer.");
        };
    }

    setupVoices() {
        // Load voices and set initial voice
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                // Try to find a male English voice
                this.selectedVoice = voices.find(voice => 
                    voice.lang.includes('en') && voice.name.includes('Male')
                ) || voices.find(voice => 
                    voice.lang === 'en-US'  // Fallback to any English voice
                ) || voices[0];  // Fallback to first available voice
                
                console.log('Available voices:', voices.map(v => v.name));
                console.log('Selected voice:', this.selectedVoice.name);
            }
        };

        // Initial load
        loadVoices();

        // Handle dynamic voice loading
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    setupEventListeners() {
        this.startBtn.addEventListener('mousedown', () => this.startListening());
        this.startBtn.addEventListener('mouseup', () => this.stopListening());
        this.startBtn.addEventListener('mouseleave', () => this.stopListening());
    }

    setupRecognition() {
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = async (event) => {
            const text = event.results[0][0].transcript;
            console.log('You said:', text);
            
            this.addMessage(text, 'user-message');
            
            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: text }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Server response:', data);

                if (data.response) {
                    console.log('AI response:', data.response);
                    this.addMessage(data.response, 'ai-message');
                    this.speakWithRetry(data.response);
                }
            } catch (error) {
                console.error('Error getting AI response:', error);
                this.status.textContent = 'Error: Failed to get response';
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.status.textContent = 'Error: ' + event.error;
        };
    }

    addMessage(text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${className}`;
        messageDiv.textContent = text;
        this.messages.appendChild(messageDiv);

        // Trigger animation
        requestAnimationFrame(() => {
            messageDiv.classList.add('show');
        });

        // Remove message after delay
        setTimeout(() => {
            messageDiv.style.animation = 'messageFade 0.3s ease-out forwards';
            setTimeout(() => {
                messageDiv.remove();
            }, 300);
        }, 5000); // Message stays visible for 5 seconds
    }

    updateGlow() {
        if (!this.analyser) return;

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);

        // Calculate average volume with more dramatic scaling
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const scale = Math.max(0.8, Math.min(average / 128 * 2.5, 3.0)); // Increased scale range
        const opacity = Math.min(average / 128 * 1.2, 1); // Increased opacity

        // Update glow effect
        this.soundGlow.style.transform = `scale(${scale})`;
        this.soundGlow.style.opacity = opacity;

        this.animationFrame = requestAnimationFrame(() => this.updateGlow());
    }

    async startListening() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 32;
            }

            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            source.connect(this.analyser);
            
            this.recognition.start();
            this.status.textContent = 'Listening...';
            this.soundGlow.classList.add('active');
            
            this.updateGlow();
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.status.textContent = 'Error: Microphone access denied';
        }
    }

    stopListening() {
        this.recognition.stop();
        this.status.textContent = 'Idle';
        this.soundGlow.classList.remove('active');
        this.soundGlow.style.transform = 'scale(1)';
        this.soundGlow.style.opacity = '0';

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
    }

    animateMouth(speaking) {
        if (speaking) {
            this.mouth.style.animation = 'speak 0.5s infinite';
        } else {
            this.mouth.style.animation = 'none';
        }
    }

    loadVoices() {
        this.voices = this.synthesis.getVoices();
        if (this.voices.length > 0) {
            // Try to find a male English voice
            this.currentVoice = this.voices.find(voice => 
                voice.lang === 'en-US' && voice.name.includes('Male')
            ) || this.voices.find(voice => 
                voice.lang === 'en-US'
            ) || this.voices[0];
            
            console.log('Available voices:', this.voices.map(v => `${v.name} (${v.lang})`));
            console.log('Selected voice:', this.currentVoice.name);
        }
    }

    speakWithRetry(text, attempts = 3) {
        if (!text) return;
        console.log('Attempting to speak:', text);
        
        const speak = () => {
            this.synthesis.cancel(); // Cancel any ongoing speech
            
            const utterance = new SpeechSynthesisUtterance(text);
            
            if (this.currentVoice) {
                utterance.voice = this.currentVoice;
            }
            
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onstart = () => {
                console.log('Speech started');
                this.soundGlow.classList.add('active');
                this.status.textContent = 'Speaking';
                this.updateGlow();
            };

            utterance.onend = () => {
                console.log('Speech ended');
                this.soundGlow.classList.remove('active');
                this.status.textContent = 'Idle';
                if (this.animationFrame) {
                    cancelAnimationFrame(this.animationFrame);
                }
            };

            utterance.onerror = (e) => {
                console.error('Speech error:', e);
                if (attempts > 1) {
                    console.log(`Retrying speech... (${attempts - 1} attempts left)`);
                    setTimeout(() => this.speakWithRetry(text, attempts - 1), 1000);
                }
            };

            try {
                this.synthesis.speak(utterance);
            } catch (error) {
                console.error('Speech synthesis error:', error);
                if (attempts > 1) {
                    setTimeout(() => this.speakWithRetry(text, attempts - 1), 1000);
                }
            }
        };

        setTimeout(speak, 100);
    }

    // Replace the old speak method with speakWithRetry
    speak(text) {
        this.speakWithRetry(text);
    }

    // ... Keep the rest of the voice-related methods ...
    // Remove message display methods
}

document.addEventListener('DOMContentLoaded', () => {
    const chat = new VoiceChat();
    
    setTimeout(() => {
        console.log('Testing speech synthesis...');
        chat.speak("I am Batman. The Dark Knight of Gotham. I protect this city from the shadows - speak, and I will answer.");
    }, 2000);
}); 