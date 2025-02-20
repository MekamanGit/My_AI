import json
from datetime import datetime
import os

class ConversationLogger:
    def __init__(self, log_dir="conversation_logs"):
        self.log_dir = log_dir
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
        
        # Create a file for today's conversations
        self.log_file = os.path.join(
            log_dir, 
            f"conversations_{datetime.now().strftime('%Y-%m-%d')}.jsonl"
        )
    
    def log_conversation(self, user_message, ai_response, context=None):
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "user_message": user_message,
            "ai_response": ai_response,
            "context": context,
        }
        
        with open(self.log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")
    
    def get_training_data(self):
        """Convert logs to training format"""
        training_data = []
        
        for filename in os.listdir(self.log_dir):
            if not filename.endswith('.jsonl'):
                continue
                
            with open(os.path.join(self.log_dir, filename), 'r', encoding='utf-8') as f:
                for line in f:
                    entry = json.loads(line)
                    training_data.append({
                        'input': entry['user_message'],
                        'output': entry['ai_response']
                    })
        
        return training_data 