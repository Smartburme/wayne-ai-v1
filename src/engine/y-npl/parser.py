# src/engine/y-npl/parser.py

import re
import json
from typing import Dict, List, Tuple, Optional
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class NLPParser:
    def __init__(self, knowledge_base_path: str = None):
        """Initialize the NLP parser with optional knowledge base."""
        try:
            self.nlp = spacy.load("en_core_web_md")
            logger.info("Loaded spaCy language model")
        except OSError:
            logger.error("spaCy model not found. Downloading...")
            from spacy.cli import download
            download("en_core_web_md")
            self.nlp = spacy.load("en_core_web_md")
        
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
        self.knowledge_base = self._load_knowledge_base(knowledge_base_path)
        self._init_keyword_mappings()
        
        # Initialize TF-IDF matrix if knowledge base exists
        if self.knowledge_base:
            self._init_tfidf_matrix()

    def _load_knowledge_base(self, path: str) -> Optional[Dict]:
        """Load knowledge base from JSON file."""
        if not path:
            return None
            
        try:
            kb_path = Path(path)
            if not kb_path.exists():
                logger.warning(f"Knowledge base file not found: {path}")
                return None
                
            with open(kb_path, 'r', encoding='utf-8') as f:
                kb = json.load(f)
                logger.info(f"Loaded knowledge base with {sum(len(v) for v in kb.values())} entries")
                return kb
        except Exception as e:
            logger.error(f"Error loading knowledge base: {e}")
            return None

    def _init_keyword_mappings(self):
        """Initialize domain-specific keyword mappings."""
        self.domain_keywords = {
            'coding': ['code', 'program', 'algorithm', 'function', 'variable', 
                      'loop', 'python', 'javascript', 'java', 'debug'],
            'image': ['image', 'picture', 'photo', 'graphic', 'visual'],
            'general': ['what', 'how', 'why', 'explain', 'tell me', 'define']
        }

    def _init_tfidf_matrix(self):
        """Initialize TF-IDF matrix for knowledge base documents."""
        all_documents = []
        for category in self.knowledge_base.values():
            for entry in category:
                all_documents.append(f"{entry.get('title', '')} {entry.get('content', '')}")
        
        self.tfidf_matrix = self.vectorizer.fit_transform(all_documents)
        logger.info("Initialized TF-IDF matrix for knowledge base")

    def parse_input(self, text: str) -> Dict:
        """Main method to parse user input and extract structured information."""
        if not text or not isinstance(text, str):
            logger.warning("Empty or invalid input text")
            return self._empty_parse_result()
        
        try:
            doc = self.nlp(text.lower())
            
            # Extract entities and linguistic features
            entities = self._extract_entities(doc)
            intent = self._determine_intent(doc, entities)
            domain = self._determine_domain(doc, intent)
            keywords = self._extract_keywords(doc, domain)
            
            # Enhanced context analysis
            context = {
                'is_question': any(tok.tag_ == 'WP' for tok in doc),  # WH-pronouns
                'is_imperative': doc[0].tag_ == 'VB',  # Imperative verbs
                'sentiment': self._analyze_sentiment(doc),
                'complexity': len(list(doc.sents))  # Sentence count
            }
            
            return {
                'original_text': text,
                'cleaned_text': ' '.join(t.text for t in doc if not t.is_stop),
                'intent': intent,
                'domain': domain,
                'entities': entities,
                'keywords': keywords,
                'context': context,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error parsing input: {e}")
            return self._empty_parse_result(text)

    def _extract_entities(self, doc) -> Dict:
        """Extract named entities and linguistic features."""
        entities = {
            'topics': [],
            'questions': [],
            'actions': [],
            'nouns': [],
            'verbs': [],
            'spacy_entities': [(ent.text, ent.label_) for ent in doc.ents]
        }
        
        for token in doc:
            if token.pos_ == 'NOUN' and not token.is_stop:
                entities['nouns'].append(token.lemma_)
            elif token.pos_ == 'VERB':
                entities['verbs'].append(token.lemma_)
                
        # Extract questions
        if any(tok.tag_ in ['WP', 'WRB', 'WDT'] for tok in doc):  # WH-words
            entities['questions'].append(str(doc))
            
        # Extract topics using noun chunks
        entities['topics'] = [chunk.text for chunk in doc.noun_chunks 
                            if not all(t.is_stop for t in chunk)]
        
        return entities

    def _determine_intent(self, doc, entities: Dict) -> str:
        """Determine user intent based on linguistic analysis."""
        # Check for question patterns
        if entities['questions']:
            if any(kw in entities['topics'] for kw in self.domain_keywords['coding']):
                return 'code_question'
            return 'general_question'
            
        # Check for imperative statements
        if doc[0].tag_ == 'VB':  # Starts with verb (imperative)
            if any(kw in entities['topics'] for kw in self.domain_keywords['image']):
                return 'image_request'
            return 'command'
            
        # Default to information request
        return 'information'

    def _determine_domain(self, doc, intent: str) -> str:
        """Determine the most relevant domain for the query."""
        domain_scores = {
            'coding': 0,
            'image': 0,
            'general': 0
        }
        
        # Score based on keywords
        for token in doc:
            lemma = token.lemma_
            for domain, keywords in self.domain_keywords.items():
                if lemma in keywords:
                    domain_scores[domain] += 1
                    
        # Boost score for certain intents
        if intent == 'code_question':
            domain_scores['coding'] += 2
        elif intent == 'image_request':
            domain_scores['image'] += 2
            
        return max(domain_scores.items(), key=lambda x: x[1])[0]

    def _extract_keywords(self, doc, domain: str) -> List[str]:
        """Extract domain-relevant keywords from text."""
        keywords = set()
        
        # Add domain-specific important words
        for token in doc:
            if token.lemma_ in self.domain_keywords[domain]:
                keywords.add(token.lemma_)
                
        # Add named entities
        for ent in doc.ents:
            if ent.label_ in ['PERSON', 'ORG', 'PRODUCT']:
                keywords.add(ent.text)
                
        # Add noun chunks that aren't all stop words
        for chunk in doc.noun_chunks:
            if not all(t.is_stop for t in chunk):
                keywords.add(chunk.text)
                
        return sorted(keywords, key=len, reverse=True)[:10]  # Return top 10 by length

    def _analyze_sentiment(self, doc) -> float:
        """Basic sentiment analysis using word polarity."""
        sentiment = 0
        polarity_words = 0
        
        for token in doc:
            if token.sentiment != 0:  # Using spaCy's built-in sentiment if available
                sentiment += token.sentiment
                polarity_words += 1
                
        return sentiment / polarity_words if polarity_words > 0 else 0

    def find_most_relevant_knowledge(self, query: str, domain: str = None, top_n: int = 3) -> List[Dict]:
        """Find most relevant knowledge base entries for a query."""
        if not self.knowledge_base or not self.tfidf_matrix:
            return []
            
        try:
            # Transform query to TF-IDF vector
            query_vec = self.vectorizer.transform([query])
            
            # Compute cosine similarities
            similarities = np.dot(query_vec, self.tfidf_matrix.T).toarray()[0]
            
            # Get top matches across all categories or specific domain
            results = []
            if domain and domain in self.knowledge_base:
                domain_indices = range(
                    sum(len(v) for k, v in self.knowledge_base.items() if k < domain),
                    sum(len(v) for k, v in self.knowledge_base.items() if k <= domain)
                )
                top_indices = np.argsort(similarities[domain_indices])[-top_n:]
                results.extend(self.knowledge_base[domain][i] for i in top_indices)
            else:
                top_indices = np.argsort(similarities)[-top_n:]
                current_index = 0
                for category, entries in self.knowledge_base.items():
                    if top_indices[-1] < current_index + len(entries):
                        for i in top_indices:
                            if current_index <= i < current_index + len(entries):
                                results.append(entries[i - current_index])
                    current_index += len(entries)
                    
            return sorted(results, key=lambda x: x.get('score', 0), reverse=True)[:top_n]
            
        except Exception as e:
            logger.error(f"Error finding relevant knowledge: {e}")
            return []

    def _empty_parse_result(self, text: str = "") -> Dict:
        """Return an empty parse result structure."""
        return {
            'original_text': text,
            'cleaned_text': "",
            'intent': 'unknown',
            'domain': 'general',
            'entities': {},
            'keywords': [],
            'context': {},
            'timestamp': datetime.now().isoformat()
        }

# Example usage
if __name__ == "__main__":
    parser = NLPParser("../../docs/knowledge/combined-knowledge.json")
    
    test_queries = [
        "How do I implement quicksort in Python?",
        "Show me pictures of neural network architectures",
        "Explain the concept of quantum computing"
    ]
    
    for query in test_queries:
        print(f"\nQuery: {query}")
        parsed = parser.parse_input(query)
        print("Parsed Result:")
        print(json.dumps(parsed, indent=2))
        
        relevant = parser.find_most_relevant_knowledge(query)
        print("\nRelevant Knowledge:")
        for i, item in enumerate(relevant, 1):
            print(f"{i}. {item.get('title', 'No title')} (Score: {item.get('score', 0):.2f})")
