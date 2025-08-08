class Animator {
    /**
     * Initialize all animations
     */
    static init() {
        this.setupLogoAnimation();
        this.setupMessageAnimations();
        this.setupInputAnimations();
    }

    /**
     * Logo pulse and rotation animation
     */
    static setupLogoAnimation() {
        const logo = document.querySelector('.logo');
        if (logo) {
            logo.style.animation = 'logo-pulse 4s ease-in-out infinite, logo-rotate 8s linear infinite';
        }
    }

    /**
     * Message entry animations
     */
    static setupMessageAnimations() {
        document.addEventListener('DOMContentLoaded', () => {
            const messages = document.querySelectorAll('.message');
            messages.forEach((msg, index) => {
                msg.style.animationDelay = `${index * 0.1}s`;
            });
        });
    }

    /**
     * Input field animations
     */
    static setupInputAnimations() {
        const textarea = document.getElementById('userInput');
        if (textarea) {
            textarea.addEventListener('focus', () => {
                textarea.parentElement.classList.add('focused');
            });
            textarea.addEventListener('blur', () => {
                textarea.parentElement.classList.remove('focused');
            });
        }
    }

    /**
     * Fade in element
     * @param {HTMLElement} element 
     * @param {number} duration 
     */
    static fadeIn(element, duration = 300) {
        element.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
        element.style.opacity = '0';
        element.style.transform = 'translateY(10px)';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }

    /**
     * Create typing indicator animation
     * @param {HTMLElement} container 
     */
    static createTypingIndicator(container) {
        const dots = container.querySelectorAll('.typing-dots span');
        dots.forEach((dot, index) => {
            dot.style.animationDelay = `${index * 0.2}s`;
        });
    }
}

// Initialize animations when loaded
document.addEventListener('DOMContentLoaded', () => Animator.init());
