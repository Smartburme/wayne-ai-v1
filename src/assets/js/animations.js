// Grok-style loader animation
export function initLoader() {
    const loader = document.querySelector('.grok-loader');
    const circles = document.querySelectorAll('.loader-circle');
    
    let scale = 1;
    let direction = -0.02;
    
    setInterval(() => {
        scale += direction;
        if (scale <= 0.8 || scale >= 1.2) {
            direction *= -1;
        }
        
        circles.forEach(circle => {
            circle.style.transform = `scale(${scale})`;
            circle.style.opacity = scale > 1 ? scale - 0.2 : scale;
        });
    }, 50);
}

// Chat message entrance animation
export function animateMessage(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        element.style.transition = 'all 0.3s ease-out';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    }, 10);
}
