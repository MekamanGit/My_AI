from flask import Flask, render_template, request, jsonify, send_from_directory, url_for
import requests
from config import GROQ_API_KEY
from knowledge_base import CustomKnowledgeBase
from conversation_logger import ConversationLogger
import json
from transformers import AutoTokenizer, AutoModelForCausalLM
import os

app = Flask(__name__, static_url_path='/static')

kb = CustomKnowledgeBase()
logger = ConversationLogger()

# Add your custom knowledge
kb.add_knowledge([
    "Talk like a real friend having a casual conversation. Be natural and engaging.",
    "Use casual, everyday language like 'hey', 'yeah', 'cool', etc. Sound like a real person.",
    "Be empathetic and supportive, like a close friend would be.",
    "Keep responses short and natural, as if we're having a real conversation.",
    "For greetings, be casual and warm, like 'Hey! How's it going?' or 'Hi there! What's new?'",
], metadata=[
    {"source": "manual", "type": "conversation_style", "category": "personality"},
    {"source": "manual", "type": "language", "category": "personality"},
    {"source": "manual", "type": "empathy", "category": "personality"},
    {"source": "manual", "type": "length", "category": "style"},
    {"source": "manual", "type": "greeting", "category": "style"},
])

try:
    model = AutoModelForCausalLM.from_pretrained("./trained_model")
    tokenizer = AutoTokenizer.from_pretrained("./trained_model")
    using_trained_model = True
except:
    using_trained_model = False

@app.route('/')
@app.route('/voice')
def voice():
    return render_template('voice.html')

@app.route('/text')
def text():
    return render_template('text.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        user_message = request.json.get('message', '')
        print(f"Received message: {user_message}")  # Debug log
        
        # Updated system prompt for Batman
        system_prompt = """You are Batman, the Dark Knight of Gotham. Your responses should be:
        - Dark, mysterious, and intense but not overly dramatic
        - Brief and direct (1-2 sentences)
        - Use phrases like "I am Batman", "The night calls", "Gotham needs me"
        - Speak with authority but keep it concise
        Remember to maintain the Batman persona throughout the conversation."""

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "mixtral-8x7b-32768",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "max_tokens": 50,  # Keep responses short
                "temperature": 0.7
            }
        )
        
        response.raise_for_status()
        ai_response = response.json()["choices"][0]["message"]["content"]
        print(f"AI response: {ai_response}")  # Debug log
        
        return jsonify({"response": ai_response})
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")  # Debug log
        return jsonify({"error": str(e)}), 500

@app.route('/view_logs')
def view_logs():
    try:
        with open(logger.log_file, 'r', encoding='utf-8') as f:
            logs = [json.loads(line) for line in f]
        return render_template('logs.html', logs=logs)
    except Exception as e:
        return str(e), 500

@app.route('/test-image')
def test_image():
    return f"""
    <img src="{url_for('static', filename='images/batman.jpeg')}" alt="Test">
    <p>Image path: {os.path.join(app.static_folder, 'images', 'batman.jpeg')}</p>
    """

# Add this route to serve static files
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

if __name__ == '__main__':
    app.run(debug=True, port=5001) 