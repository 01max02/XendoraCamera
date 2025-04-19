document.addEventListener('DOMContentLoaded', function() {
    const confirmOrderBtn = document.getElementById('confirmOrderBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');

    confirmOrderBtn.addEventListener('click', async function() {
        // Show loading overlay
        loadingOverlay.style.display = 'flex';

        // Get all order items
        const orderItems = Array.from(document.querySelectorAll('.order-item')).map(item => ({
            id: item.dataset.id,
            name: item.querySelector('h3').textContent,
            quantity: parseInt(item.dataset.quantity),
            itemTotal: parseFloat(item.dataset.price) * parseInt(item.dataset.quantity)
        }));

        // Get selected payment method
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

        // Calculate total price
        const totalPrice = orderItems.reduce((sum, item) => sum + item.itemTotal, 0);

        try {
            // Send order data to server
            const response = await fetch('/confirm_order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: orderItems,
                    total_price: totalPrice,
                    payment_method: paymentMethod
                })
            });

            const result = await response.json();

            if (result.success) {
                // Hide loading overlay
                loadingOverlay.style.display = 'none';
                
                // Show success message and redirect to orders page
                alert('Order placed successfully!');
                window.location.href = '/orders';
            } else {
                throw new Error(result.error || 'Failed to place order');
            }
        } catch (error) {
            // Hide loading overlay
            loadingOverlay.style.display = 'none';
            
            // Show error message
            alert('Error placing order: ' + error.message);
        }
    });
}); 