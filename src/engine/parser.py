import re
from typing import List, Dict

class TextParser:
    def __init__(self):
        self.keywords = {
            'greeting': ['hello', 'hi', 'hey'],
            'question': ['what', 'how', 'why']
        }
    
    def parse_input(self, text: str) -> Dict:
        result = {'intent': 'unknown', 'entities': []}
        text_lower = text.lower()
        
        # Check for greetings
        if any(word in text_lower for word in self.keywords['greeting']):
            result['intent'] = 'greeting'
        
        # Check for questions
        elif any(word in text_lower for word in self.keywords['question']):
            result['intent'] = 'question'
            result['entities'] = re.findall(r'\b(what|how|why)\b', text_lower)
        
        return result
