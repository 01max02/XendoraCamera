// Modal handling
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('productModal');
    const closeModalBtn = document.querySelector('.close-modal');
    let currentProductId = null;

    // Close modal with animation
    function closeModalWithAnimation() {
        modal.style.animation = 'modalFadeOut 0.3s ease forwards';
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.animation = '';
        }, 300);
    }

    // Close modal when clicking the close button
    closeModalBtn.addEventListener('click', closeModalWithAnimation);

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModalWithAnimation();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            closeModalWithAnimation();
        }
    });

    // Quantity handling
    window.incrementQuantity = function() {
        const quantityInput = document.getElementById('quantity');
        const currentValue = parseInt(quantityInput.value);
        const maxStock = parseInt(document.getElementById('modalStock').querySelector('span').textContent);
        if (currentValue < maxStock) {
            quantityInput.value = currentValue + 1;
        } else {
            showNotification('Maximum stock reached', 'error');
        }
    };

    window.decrementQuantity = function() {
        const quantityInput = document.getElementById('quantity');
        if (parseInt(quantityInput.value) > 1) {
            quantityInput.value = parseInt(quantityInput.value) - 1;
        }
    };

    // View product details
    window.viewProduct = function(productId) {
        currentProductId = productId;
        fetch(`/api/product/${productId}`)
            .then(response => response.json())
            .then(product => {
                if (product.error) {
                    showNotification(product.error, 'error');
                    return;
                }

                // Update modal content
                document.getElementById('modalImage').src = `/static/uploads/${product.image}`;
                document.getElementById('modalTitle').textContent = product.name;
                document.getElementById('modalPrice').textContent = `₱${product.price.toLocaleString()}`;
                document.getElementById('modalDescription').textContent = product.description;
                document.getElementById('modalStock').querySelector('span').textContent = 
                    `${product.stock_quantity} items available`;
                
                // Update store link
                const storeLink = document.getElementById('viewStore');
                storeLink.href = `/store/${product.seller_id}`;

                // Reset quantity input
                document.getElementById('quantity').value = 1;

                // Show modal with animation
                modal.style.display = 'block';
                modal.style.animation = 'modalFadeIn 0.3s ease forwards';

                // Load reviews if available
                loadReviews(productId);
            })
            .catch(error => {
                showNotification('Error loading product details', 'error');
                console.error('Error:', error);
            });
    };

    // Load product reviews
    function loadReviews(productId) {
        fetch(`/api/product/${productId}/reviews`)
            .then(response => response.json())
            .then(reviews => {
                const reviewsContainer = document.querySelector('.reviews-container');
                reviewsContainer.innerHTML = '';

                if (!reviews || reviews.length === 0) {
                    reviewsContainer.innerHTML = '<p class="no-reviews">No reviews yet</p>';
                    return;
                }

                reviews.forEach(review => {
                    const reviewElement = createReviewElement(review);
                    reviewsContainer.appendChild(reviewElement);
                });
            })
            .catch(error => {
                console.error('Error loading reviews:', error);
                const reviewsContainer = document.querySelector('.reviews-container');
                reviewsContainer.innerHTML = '<p class="no-reviews">Error loading reviews</p>';
            });
    }

    // Create review element
    function createReviewElement(review) {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-item';
        reviewDiv.innerHTML = `
            <div class="review-header">
                <span class="reviewer-name">${review.user_name || 'Anonymous'}</span>
                <span class="review-date">${formatDate(review.date_added)}</span>
            </div>
            <div class="review-rating">
                ${createStarRating(review.rating)}
            </div>
            <p class="review-text">${review.comment || ''}</p>
        `;
        return reviewDiv;
    }

    // Create star rating
    function createStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    // Format date
    function formatDate(dateString) {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Show notification
    window.showNotification = function(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };
});

// Add these keyframe animations to your CSS
document.head.insertAdjacentHTML('beforeend', `
    <style>
        @keyframes modalFadeIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes modalFadeOut {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-20px);
            }
        }

        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: white;
            z-index: 1000;
            transform: translateX(120%);
            transition: transform 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .notification.show {
            transform: translateX(0);
        }

        .notification.success {
            background-color: #4CAF50;
        }

        .notification.error {
            background-color: #f44336;
        }
    </style>
`); 