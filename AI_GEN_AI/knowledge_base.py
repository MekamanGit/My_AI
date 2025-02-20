import chromadb
from chromadb.utils import embedding_functions

class CustomKnowledgeBase:
    def __init__(self):
        self.client = chromadb.Client()
        self.ef = embedding_functions.DefaultEmbeddingFunction()
        self.collection = self.client.create_collection(
            name="custom_knowledge",
            embedding_function=self.ef
        )
    
    def add_knowledge(self, texts, metadata=None):
        # Add documents to your knowledge base
        if not metadata:
            # Create default metadata if none provided
            metadata = [{"source": "default", "type": "general_knowledge"} for _ in texts]
        
        self.collection.add(
            documents=texts,
            metadatas=metadata,
            ids=[f"id{i}" for i in range(len(texts))]
        )
    
    def query(self, question, n_results=3):
        # Retrieve relevant context
        results = self.collection.query(
            query_texts=[question],
            n_results=n_results
        )
        return results['documents'][0] 