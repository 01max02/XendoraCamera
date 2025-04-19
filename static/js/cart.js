function updateCartDisplay() {
    fetch('/get_cart_items')
        .then(response => response.json())
        .then(data => {
            const cartItems = document.getElementById('cartItems');
            let html = '';
            let subtotal = 0;

            data.items.forEach(item => {
                subtotal += item.price * item.quantity;
                html += `
                    <div class="cart-item row" data-item-id="${item.id}">
                        <div class="col-6">
                            <div class="d-flex align-items-center">
                                <div class="form-check me-3">
                                    <input class="form-check-input" type="checkbox" value="${item.id}">
                                </div>
                                <div class="item-image me-3">
                                    <img src="/static/uploads/${item.image}" alt="${item.name}">
                                </div>
                                <div class="item-details">
                                    <h4>${item.name}</h4>
                                    <p class="seller">Seller: ${item.seller_name}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-2">₱${item.price.toFixed(2)}</div>
                        <div class="col-2">
                            <div class="quantity-controls">
                                <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                            </div>
                        </div>
                        <div class="col-2">₱${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                `;
            });

            cartItems.innerHTML = html;
            updateCartSummary(subtotal);
        });
}

function updateCartSummary(subtotal) {
    document.getElementById('subtotal').textContent = `₱${subtotal.toFixed(2)}`;
    const discount = subtotal * 0.25;
    document.getElementById('discount').textContent = `-₱${discount.toFixed(2)}`;
    document.getElementById('total').textContent = `₱${(subtotal - discount).toFixed(2)}`;
}

function updateCartCount() {
    fetch('/get_cart_count')
        .then(response => response.json())
        .then(data => {
            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                cartCount.textContent = data.count;
            }
        });
}

document.querySelector('.checkout-btn').addEventListener('click', function(e) {
    // Check if cart is empty
    const cartItems = document.querySelectorAll('.cart-item');
    if (cartItems.length === 0) {
        e.preventDefault();
        alert('Your cart is empty. Please add items before checking out.');
        return;
    }
});

document.querySelector('form[action="/checkout"]').addEventListener('submit', function(e) {
    e.preventDefault();
    
    fetch('/confirm_order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            // Add any necessary form data here
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = data.redirect_url;
        } else {
            alert(data.message || 'Error processing order');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while processing your order');
    });
});