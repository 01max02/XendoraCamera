document.addEventListener('DOMContentLoaded', function() {
    // Fetch and update cart and wishlist counts
    fetch('/cart-count')
        .then(response => response.json())
        .then(data => {
            document.querySelector('.cart-count').textContent = data.count;
        });

    fetch('/wishlist-count')
        .then(response => response.json())
        .then(data => {
            document.querySelector('.wishlist-count').textContent = data.count;
        });
});

function showCancelModal(orderId) {
    const modal = new bootstrap.Modal(document.getElementById('cancelOrderModal'));
    const form = document.getElementById('cancelOrderForm');
    form.action = `/delete_order/${orderId}`;
    modal.show();
}

function performSearch() {
    const searchInput = document.getElementById('search-input').value;
    // Implement search functionality here
    console.log('Searching for:', searchInput);
}
