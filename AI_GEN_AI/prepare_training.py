def prepare_training_data(examples):
    """
    examples should be a list of dictionaries with 
    'input' and 'output' keys
    """
    return [
        {
            "messages": [
                {"role": "system", "content": "Your system prompt"},
                {"role": "user", "content": ex['input']},
                {"role": "assistant", "content": ex['output']}
            ]
        }
        for ex in examples
    ] 