document.addEventListener('DOMContentLoaded', function() {
    // Form Handling
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Testimonials Slider
    initTestimonialsSlider();

    // Smooth Scroll for Register Button
    const registerButton = document.querySelector('a[href="#register-section"]');
    if (registerButton) {
        registerButton.addEventListener('click', function(e) {
            e.preventDefault();
            const registerSection = document.getElementById('register-section');
            registerSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Form Input Animation
    const formInputs = document.querySelectorAll('.form-group input');
    formInputs.forEach(input => {
        input.addEventListener('focus', handleInputFocus);
        input.addEventListener('blur', handleInputBlur);
    });
});

// Form Submission Handler
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        userType: document.getElementById('userType').value
    };

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Registration successful!', 'success');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            showNotification(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showNotification('An error occurred. Please try again.', 'error');
    }
}

// Testimonials Slider
function initTestimonialsSlider() {
    const testimonials = document.querySelectorAll('.testimonial-card');
    const dotsContainer = document.querySelector('.slider-dots');
    let currentSlide = 0;

    // Create dots
    testimonials.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('slider-dot');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    function goToSlide(index) {
        testimonials[currentSlide].classList.remove('active');
        testimonials[index].classList.add('active');
        updateDots(index);
        currentSlide = index;
    }

    function updateDots(index) {
        const dots = document.querySelectorAll('.slider-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    // Auto-advance slides
    setInterval(() => {
        const nextSlide = (currentSlide + 1) % testimonials.length;
        goToSlide(nextSlide);
    }, 5000);

    // Initialize first slide
    goToSlide(0);
}

// Form Input Animations
function handleInputFocus(e) {
    const label = e.target.nextElementSibling;
    label.classList.add('active');
}

function handleInputBlur(e) {
    const label = e.target.nextElementSibling;
    if (!e.target.value) {
        label.classList.remove('active');
    }
}

// Notification System
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add this to your CSS for notifications
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 5px;
        color: white;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        z-index: 1000;
    }

    .notification.show {
        opacity: 1;
        transform: translateY(0);
    }

    .notification.success {
        background-color: #2ecc71;
    }

    .notification.error {
        background-color: #e74c3c;
    }
`;
document.head.appendChild(style);
