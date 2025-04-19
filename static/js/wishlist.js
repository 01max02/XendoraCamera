document.addEventListener('DOMContentLoaded', function() {
    // Initialize counts
    updateCartCount();
    updateWishlistCount();

    // Add event listeners for checkboxes
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', toggleSelectAll);
    }

    // Initialize item checkboxes
    document.querySelectorAll('.wishlist-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedItemsCount);
    });
});

// Toggle all checkboxes
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('select-all');
    const isChecked = selectAllCheckbox.checked;
    
    document.querySelectorAll('.wishlist-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = isChecked;
    });
    
    updateSelectedItemsCount();
}

// Update selected items count
function updateSelectedItemsCount() {
    const selectedCount = document.querySelectorAll('.wishlist-item input[type="checkbox"]:checked').length;
    const deleteBtn = document.querySelector('.delete-btn');
    
    if (deleteBtn) {
        deleteBtn.textContent = selectedCount > 0 ? 
            `Delete Selected (${selectedCount})` : 'Delete Selected';
    }
}

// Move item to cart
function moveToCart(productId) {
    showLoadingSpinner();
    
    fetch('/move-to-cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_id: productId })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingSpinner();
        if (data.success) {
            removeWishlistItem(productId);
            updateCartCount();
            updateWishlistCount();
            showNotification('Item moved to cart successfully!', 'success');
        } else {
            showNotification(data.message || 'Error moving item to cart', 'error');
        }
    })
    .catch(error => {
        hideLoadingSpinner();
        console.error('Error:', error);
        showNotification('Error moving item to cart', 'error');
    });
}

// Remove item from wishlist
function removeFromWishlist(productId) {
    if (!confirm('Are you sure you want to remove this item from your wishlist?')) {
        return;
    }

    showLoadingSpinner();
    
    fetch('/remove-from-wishlist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_id: productId })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingSpinner();
        if (data.success) {
            removeWishlistItem(productId);
            updateWishlistCount();
            showNotification('Item removed from wishlist', 'success');
        } else {
            showNotification(data.message || 'Error removing item from wishlist', 'error');
        }
    })
    .catch(error => {
        hideLoadingSpinner();
        console.error('Error:', error);
        showNotification('Error removing item from wishlist', 'error');
    });
}

// Remove selected items
function removeSelectedItems() {
    const selectedIds = [];
    document.querySelectorAll('.wishlist-item input[type="checkbox"]:checked').forEach(checkbox => {
        selectedIds.push(parseInt(checkbox.closest('.wishlist-item').dataset.itemId));
    });

    if (selectedIds.length === 0) {
        showNotification('Please select items to remove', 'error');
        return;
    }

    if (!confirm(`Are you sure you want to remove ${selectedIds.length} item(s) from your wishlist?`)) {
        return;
    }

    showLoadingSpinner();

    fetch('/remove-selected-wishlist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedIds })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingSpinner();
        if (data.success) {
            selectedIds.forEach(removeWishlistItem);
            updateWishlistCount();
            showNotification('Selected items removed successfully', 'success');
        } else {
            showNotification(data.message || 'Error removing selected items', 'error');
        }
    })
    .catch(error => {
        hideLoadingSpinner();
        console.error('Error:', error);
        showNotification('Error removing selected items', 'error');
    });
}

// Helper Functions
function removeWishlistItem(productId) {
    const item = document.querySelector(`.wishlist-item[data-item-id="${productId}"]`);
    if (item) {
        item.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => item.remove(), 300);
    }
}

function updateCartCount() {
    fetch('/get_cart_count')
    .then(response => response.json())
    .then(data => {
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = data.count;
        }
    })
    .catch(error => console.error('Error updating cart count:', error));
}

function updateWishlistCount() {
    fetch('/get_wishlist_count')
    .then(response => response.json())
    .then(data => {
        const wishlistCountElement = document.querySelector('.wishlist-count');
        if (wishlistCountElement) {
            wishlistCountElement.textContent = data.count;
        }
    })
    .catch(error => console.error('Error updating wishlist count:', error));
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showLoadingSpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    document.body.appendChild(spinner);
}

function hideLoadingSpinner() {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

function updateWishlistDisplay() {
    fetch('/get_wishlist_items')
        .then(response => response.json())
        .then(data => {
            const wishlistContainer = document.querySelector('.wishlist-container');
            let html = '';

            data.items.forEach(item => {
                html += `
                    <div class="wishlist-item" data-item-id="${item.product_id}">
                        <div class="item-select">
                            <input type="checkbox">
                        </div>
                        <div class="item-image">
                            <img src="/static/uploads/${item.image}" alt="${item.name}">
                        </div>
                        <div class="item-details">
                            <h3>${item.name}</h3>
                            <p>${item.description}</p>
                            <div class="seller-info">
                                <p>Seller: ${item.seller_name}</p>
                                <p>Contact: ${item.seller_email}</p>
                            </div>
                        </div>
                        <div class="item-price">
                            <p>₱${item.price.toFixed(2)}</p>
                        </div>
                        <div class="item-actions">
                            <button onclick="moveToCart(${item.product_id})" class="move-to-cart-btn">
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                            <button onclick="removeFromWishlist(${item.product_id})" class="remove-btn">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });

            wishlistContainer.innerHTML = html;
            updateWishlistCount();
        });
}

function updateWishlistCount() {
    fetch('/get_wishlist_count')
        .then(response => response.json())
        .then(data => {
            const wishlistCount = document.querySelector('.wishlist-count');
            if (wishlistCount) {
                wishlistCount.textContent = data.count;
            }
        });
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}
