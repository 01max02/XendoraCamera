document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    updateWishlistCount();
});

function addToCart(productId) {
    fetch('/add-to-cart', {
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
            alert('Product added to cart!');
            updateCartCount();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error adding product to cart');
    });
}

function addToWishlist(productId) {
    fetch('/add-to-wishlist', {
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
            alert('Product added to wishlist!');
            updateWishlistCount();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error adding product to wishlist');
    });
}

function updateCartCount() {
    fetch('/get_cart_count')
        .then(response => response.json())
        .then(data => {
            document.querySelector('.cart-count').textContent = data.count;
        });
}

function updateWishlistCount() {
    fetch('/get_wishlist_count')
        .then(response => response.json())
        .then(data => {
            document.querySelector('.wishlist-count').textContent = data.count;
        });
}
