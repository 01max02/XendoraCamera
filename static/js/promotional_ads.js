document.addEventListener('DOMContentLoaded', function() {
    const track = document.querySelector('.promo-carousel-track');
    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.promo-carousel-button.next');
    const prevButton = document.querySelector('.promo-carousel-button.prev');
    const dotsNav = document.querySelector('.promo-carousel-nav');
    const dots = Array.from(dotsNav.children);

    let currentSlide = 0;

    function updateSlidePosition() {
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    function moveToSlide(targetIndex) {
        currentSlide = targetIndex;
        updateSlidePosition();
    }

    // Next button click
    nextButton.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % slides.length;
        updateSlidePosition();
    });

    // Previous button click
    prevButton.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateSlidePosition();
    });

    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            moveToSlide(index);
        });
    });

    // Auto-advance slides every 5 seconds
    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        updateSlidePosition();
    }, 5000);
}); 