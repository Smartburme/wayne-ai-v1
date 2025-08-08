document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const themeToggle = document.getElementById('theme-toggle');
    const languageSelect = document.getElementById('language-select');
    
    // Load saved settings
    loadSettings();
    
    // Event Listeners
    themeToggle.addEventListener('change', toggleTheme);
    languageSelect.addEventListener('change', changeLanguage);
    
    // Functions
    function loadSettings() {
        // Load theme preference
        const savedTheme = localStorage.getItem('wayne-ai-theme') || 'dark';
        document.body.classList.toggle('light-theme', savedTheme === 'light');
        themeToggle.checked = savedTheme === 'light';
        
        // Load language preference
        const savedLanguage = localStorage.getItem('wayne-ai-language') || 'my';
        languageSelect.value = savedLanguage;
    }
    
    function toggleTheme() {
        const isLight = themeToggle.checked;
        document.body.classList.toggle('light-theme', isLight);
        localStorage.setItem('wayne-ai-theme', isLight ? 'light' : 'dark');
        
        // Update CSS variables
        if (isLight) {
            document.documentElement.style.setProperty('--dark-color', '#f8f9fa');
            document.documentElement.style.setProperty('--light-color', '#1a1a2e');
        } else {
            document.documentElement.style.setProperty('--dark-color', '#1a1a2e');
            document.documentElement.style.setProperty('--light-color', '#f8f9fa');
        }
    }
    
    function changeLanguage() {
        const language = languageSelect.value;
        localStorage.setItem('wayne-ai-language', language);
        
        // In a real app, you would reload the UI with the new language
        alert(`ဘာသာစကားကို ${language === 'my' ? 'မြန်မာ' : 'English'} အဖြစ်ပြောင်းလဲပြီးပါပြီ။`);
    }
});
