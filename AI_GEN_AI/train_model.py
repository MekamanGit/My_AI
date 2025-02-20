from conversation_logger import ConversationLogger
import json
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer
import logging

logging.basicConfig(level=logging.INFO)

def train():
    # Get conversation data
    logger = ConversationLogger()
    training_examples = logger.get_training_data()
    
    if not training_examples:
        print("No training data found. Please use the chat interface to generate some conversations first.")
        return
    
    print(f"Found {len(training_examples)} conversations for training")
    
    # Prepare data for training
    model_name = "mistralai/Mistral-7B-v0.1"  # You can change this to a smaller model for testing
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name)
    
    # Format data for training
    def format_conversation(example):
        return f"User: {example['input']}\nAssistant: {example['output']}"
    
    formatted_data = [format_conversation(ex) for ex in training_examples]
    
    # Tokenize the data
    tokenized_data = tokenizer(
        formatted_data,
        padding=True,
        truncation=True,
        max_length=512,
        return_tensors="pt"
    )
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir="./trained_model",
        num_train_epochs=3,
        per_device_train_batch_size=4,
        save_steps=100,
        save_total_limit=2,
        logging_dir="./logs",
        logging_steps=10,
    )
    
    # Create Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_data,
    )
    
    # Train the model
    print("Starting training...")
    trainer.train()
    
    # Save the trained model
    print("Saving model...")
    model.save_pretrained("./trained_model")
    tokenizer.save_pretrained("./trained_model")
    
    print("Training complete! Model saved to ./trained_model")

if __name__ == "__main__":
    train() 