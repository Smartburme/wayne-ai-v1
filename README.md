# Wayne-AI Project Structure Explanation 
```
wayne-ai/
├── index.html                 # Grok-style animated loader
├── src/
│   ├── chatpage.html          # Main chat interface
│   ├── assets/
│   │   ├── images/
│   │   │   ├── logo.png       # Animated SVG logo
│   │   │   ├── bg-pattern.svg # Dynamic background
│   │   ├── js/
│   │   │   ├── main.js      # Chat functionality
│   │   │   ├── animations.js  # UI animations
│   │   │   └── ai-engine.js   # Core AI processing
│   ├── styles/
│   │   ├── main.css           # Base styles
│   │   ├── dark-theme.css     # Grok-inspired dark theme
│   │   └── responsive.css     # Mobile adaptations
│   ├── docs/
│   │   └── knowledge/
│   │       ├── text-knowledge.md
│   │       ├── image-knowledge.md
│   │       └── coder-knowledge.md
│   └── engine/
│       └── y-npl/             # Custom NLP engine
│           ├── parser.py
│           ├── knowledge-connector.js
│           └── response-generator.js
├── README.md
└── LICENSE
```

## ပရောဂျက်ဖိုင်တွဲများ အကြမ်းဖော်ပြချက်

### 1. အဓိက ဖိုင်များ
- **index.html** - Grok-style အန်နီမယ်ရှင်းပြထားသော loader ပါဝင်သည် (ပထမဆုံးမြင်ရမည့်စာမျက်နှာ)
- **README.md** - ပရောဂျက်အကြောင်း လမ်းညွှန်ချက်များ
- **LICENSE** - ဆော့ဖ်ဝဲလိုင်စင်ဖိုင်လ်

### 2. src/ ဖိုလ်ဒါအတွင်းရှိအရာများ

#### 2.1 chatpage.html
- အဓိက chat interface စာမျက်နှာ
- သီးသန့်ဒီဇိုင်းနှင့် အပြန်အလှန်ပြောဆိုနိုင်သော UI

#### 2.2 assets/ (အရင်းအမြစ်များ)
- **images/**
  - `logo.png` - အန်နီမယ်ရှင်းထားသော SVG လိုဂို
  - `bg-pattern.svg` - နောက်ခံဒီဇိုင်း
- **js/**
  - `script.js` - chat ၏ အဓိက function များ
  - `animations.js` - UI animation များ
  - `ai-engine.js` - AI နည်းပညာ core processing

#### 2.3 styles/ (စတိုင်များ)
- `main.css` - အခြေခံစတိုင်များ
- `dark-theme.css` - Grok စတိုင်အမှောင် theme
- `responsive.css` - mobile စက်များအတွက် ချိန်ညှိချက်များ

#### 2.4 docs/ (မှတ်တမ်းများ)
- **knowledge/**
  - `text-knowledge.md` - စာသားအချက်အလက်များ
  - `image-knowledge.md` - ရုပ်ပုံဆိုင်ရာအချက်အလက်များ
  - `coder-knowledge.md` - ကုဒ်ရေးသားခြင်းဆိုင်ရာအချက်အလက်များ

#### 2.5 engine/ (AI engine)
- **y-npl/** (ကိုယ်ပိုင် NLP engine)
  - `parser.py` - စာကြောင်းများကိုဖြေရှင်းခြင်း
  - `knowledge-connector.js` - အသိပညာများနှင့်ချိတ်ဆက်ခြင်း
  - `response-generator.js` - အဖြေများထုတ်လုပ်ခြင်း

## Code နမူနာများ

### index.html (Grok-style loader)
```html
<!DOCTYPE html>
<html>
<head>
    <title>Wayne-AI Loading...</title>
    <link rel="stylesheet" href="src/styles/main.css">
</head>
<body>
    <div class="grok-loader">
        <div class="loader-circle"></div>
        <div class="loader-text">Initializing Wayne-AI...</div>
    </div>
    <script src="src/js/animations.js"></script>
</body>
</html>
```

### script.js (Chat Functionality)
```javascript
// Chat message များကိုလက်ခံခြင်းနှင့်ပြသခြင်း
document.getElementById('chat-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const userInput = document.getElementById('user-input').value;
    displayMessage(userInput, 'user');
    
    // AI ထံမှအဖြေတောင်းခံရန်
    getAIResponse(userInput).then(response => {
        displayMessage(response, 'ai');
    });
});

function displayMessage(message, sender) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
}
```

### dark-theme.css (Grok-inspired theme)
```css
:root {
    --primary-bg: #1a1a2e;
    --secondary-bg: #16213e;
    --accent-color: #0f3460;
    --text-color: #e94560;
    --highlight: #f9f9f9;
}

body {
    background-color: var(--primary-bg);
    color: var(--text-color);
    font-family: 'Segoe UI', sans-serif;
}

.chat-box {
    background-color: var(--secondary-bg);
    border: 1px solid var(--accent-color);
}

.message.ai {
    background-color: var(--accent-color);
    color: var(--highlight);
}
```

### parser.py (NLP Engine)
```python
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
```

မှတ်ချက်: ဤပရောဂျက်သည် AI chat interface တစ်ခုကိုတည်ဆောက်ထားပြီး Grok စတိုင်ဒီဇိုင်းများ၊ custom NLP engine နှင့် အသိပညာစီမံခန့်ခွဲမှုစနစ်များပါဝင်သည်။
