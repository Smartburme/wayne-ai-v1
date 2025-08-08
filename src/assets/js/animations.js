// Logo Animation Controller
class LogoAnimation {
  constructor(selector) {
    this.logo = document.querySelector(selector);
    this.init();
  }

  init() {
    this.logo.addEventListener('mouseenter', this.startPulse.bind(this));
    this.logo.addEventListener('mouseleave', this.stopPulse.bind(this));
  }

  startPulse() {
    this.logo.style.animation = 'logo-pulse 1.5s ease-in-out infinite';
  }

  stopPulse() {
    this.logo.style.animation = 'none';
    setTimeout(() => {
      this.logo.style.animation = 'logo-pulse 4s ease-in-out infinite';
    }, 50);
  }
}

// Message Animation Manager
class MessageAnimator {
  static fadeIn(element, duration = 300) {
    element.style.opacity = 0;
    element.style.transform = 'translateY(10px)';
    element.style.transition = `all ${duration}ms ease-out`;
    
    requestAnimationFrame(() => {
      element.style.opacity = 1;
      element.style.transform = 'translateY(0)';
    });
  }

  static typingDots(container) {
    const dots = container.querySelectorAll('.typing-dots span');
    dots.forEach((dot, index) => {
      dot.style.animationDelay = `${index * 0.2}s`;
    });
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  new LogoAnimation('.logo');
  
  // Animate existing messages
  document.querySelectorAll('.message').forEach(msg => {
    MessageAnimator.fadeIn(msg);
  });
});

// Export for module usage (if bundled)
export { LogoAnimation, MessageAnimator };
