document.addEventListener('DOMContentLoaded', function() {
    // Modal elements
    const modal = document.getElementById('productModal');
    const closeBtn = document.querySelector('.close');
    let currentProductId = null;

    // View Product functionality
    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            currentProductId = productId;
            
            fetch(`/get_product_details/${productId}`)
                .then(response => response.json())
                .then(product => {
                    // Update modal content
                    document.getElementById('modalImage').src = `/static/uploads/${product.image}`;
                    document.getElementById('modalName').textContent = product.name;
                    document.getElementById('modalCategory').textContent = product.category;
                    document.getElementById('modalPrice').textContent = `₱${product.price.toFixed(2)}`;
                    document.getElementById('modalDescription').textContent = product.description;
                    document.getElementById('modalSeller').textContent = `${product.first_name} ${product.last_name}`;
                    document.getElementById('modalStock').textContent = `${product.quantity} in stock`;
                    
                    // Set max quantity
                    document.getElementById('modalQuantity').max = product.quantity;
                    
                    // Update wishlist button state
                    const wishlistBtn = document.getElementById('modalAddToWishlist');
                    wishlistBtn.querySelector('i').className = product.in_wishlist ? 'fas fa-heart' : 'far fa-heart';
                    
                    modal.style.display = 'block';
                });
        });
    });

    // Quick Add to Cart functionality
    document.querySelectorAll('.cart-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const productId = this.getAttribute('data-product-id');
            addToCart(productId, 1);
        });
    });

    // Quick Add to Wishlist functionality
    document.querySelectorAll('.wishlist-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const productId = this.getAttribute('data-product-id');
            toggleWishlist(productId, this);
        });
    });

    // Modal Add to Cart
    document.getElementById('modalAddToCart').addEventListener('click', function() {
        if (!currentProductId) return;
        const quantity = parseInt(document.getElementById('modalQuantity').value);
        addToCart(currentProductId, quantity);
    });

    // Modal Add to Wishlist
    document.getElementById('modalAddToWishlist').addEventListener('click', function() {
        if (!currentProductId) return;
        toggleWishlist(currentProductId, this);
    });

    // Quantity controls
    const quantityInput = document.getElementById('modalQuantity');
    
    document.querySelector('.qty-btn.minus').addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
        }
    });

    document.querySelector('.qty-btn.plus').addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value);
        const max = parseInt(quantityInput.max);
        if (currentValue < max) {
            quantityInput.value = currentValue + 1;
        }
    });

    // Prevent manual input of invalid values
    quantityInput.addEventListener('change', () => {
        const value = parseInt(quantityInput.value);
        const max = parseInt(quantityInput.max);
        if (value < 1) quantityInput.value = 1;
        if (value > max) quantityInput.value = max;
    });

    // Close modal
    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = 'none';
    };

    // Helper functions
    function addToCart(productId, quantity) {
        fetch('/add_to_cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update cart count
                updateCartCount();
                
                // Animate product to cart
                animateToCart();
                
                // Close modal if open
                modal.style.display = 'none';
                
                // Show success message
                showNotification('Added to cart successfully!', 'success');
                
                // Optional: Redirect to cart page after short delay
                setTimeout(() => {
                    window.location.href = '/cart';
                }, 1000); // Waits 1 second before redirecting
            } else {
                showNotification(data.message || 'Failed to add to cart', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred', 'error');
        });
    }

    // Add this new function for cart animation
    function animateToCart() {
        const cartIcon = document.querySelector('.cart-container');
        const productImage = document.querySelector('.product-image img');
        
        if (!cartIcon || !productImage) return;

        // Create flying element
        const flyingImage = document.createElement('img');
        flyingImage.src = productImage.src;
        flyingImage.style.cssText = `
            position: fixed;
            z-index: 9999;
            width: 50px;
            height: 50px;
            object-fit: cover;
            border-radius: 50%;
            pointer-events: none;
        `;

        // Get positions
        const start = productImage.getBoundingClientRect();
        const end = cartIcon.getBoundingClientRect();

        // Set initial position
        flyingImage.style.left = start.left + 'px';
        flyingImage.style.top = start.top + 'px';

        // Add to DOM
        document.body.appendChild(flyingImage);

        // Animate
        flyingImage.animate([
            {
                left: start.left + 'px',
                top: start.top + 'px',
                opacity: 1,
                transform: 'scale(1)'
            },
            {
                left: end.left + 'px',
                top: end.top + 'px',
                opacity: 0.5,
                transform: 'scale(0.5)'
            }
        ], {
            duration: 800,
            easing: 'ease-in-out'
        }).onfinish = () => {
            flyingImage.remove();
            // Add bounce animation to cart icon
            cartIcon.classList.add('bounce');
            setTimeout(() => cartIcon.classList.remove('bounce'), 1000);
        };
    }

    function toggleWishlist(productId, button) {
        fetch('/toggle_wishlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product_id: productId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const icon = button.querySelector('i');
                if (data.isInWishlist) {
                    icon.className = 'fas fa-heart';
                    icon.style.color = '#ff0000';
                } else {
                    icon.className = 'far fa-heart';
                    icon.style.color = '#000000';
                }
                updateWishlistCount();
                showNotification(data.message, 'success');
            } else {
                showNotification(data.message || 'Failed to update wishlist', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred', 'error');
        });
    }

    function showNotification(message, type) {
        // Implement your notification system here
        alert(message); // Simple alert for now
    }

    function updateCartCount() {
        fetch('/get_cart_count')
            .then(response => response.json())
            .then(data => {
                const cartCount = document.querySelector('.cart-count');
                if (cartCount) cartCount.textContent = data.count;
            });
    }

    function updateWishlistCount() {
        fetch('/get_wishlist_count')
            .then(response => response.json())
            .then(data => {
                const wishlistCount = document.querySelector('.wishlist-count');
                if (wishlistCount) wishlistCount.textContent = data.count;
            });
    }
});

function viewProduct(productId) {
    window.location.href = `/view_product/${productId}`;
}

function addToCart(productId) {
    fetch('/add_to_cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: productId })
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            alert('Product added to cart!');
        } else {
            alert(data.message || 'Error adding to cart');
        }
    });
}

function toggleWishlist(productId) {
    fetch('/toggle_wishlist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: productId })
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            updateWishlistCount();
            alert(data.message || 'Wishlist updated successfully!');
        } else {
            alert(data.message || 'Error updating wishlist');
        }
    });
}

function confirmLogout(event) {
    event.preventDefault();
    
    if (confirm('Are you sure you want to logout?')) {
        // First, make the logout request
        fetch('/logout', {
            method: 'GET',  // Changed from POST to GET
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (response.ok) {
                // Redirect to login page after successful logout
                window.location.href = '/login';
            } else {
                console.error('Logout failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}