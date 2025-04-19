document.addEventListener('DOMContentLoaded', function() {
    const sortSelect = document.getElementById('sortBy');
    const brandSelect = document.getElementById('brandFilter');
    const searchInput = document.getElementById('searchInput');
    const productsGrid = document.querySelector('.products-grid');
    const loadingSpinner = document.getElementById('loading');

    let debounceTimer;

    // Function to update products based on filters
    function updateProducts() {
        const sort = sortSelect.value;
        const brand = brandSelect.value;
        const search = searchInput.value;

        loadingSpinner.style.display = 'block';

        // Build query string
        const params = new URLSearchParams({
            sort_by: sort,
            brand: brand,
            search: search
        });

        fetch(`/api/lighting-products?${params}`)
            .then(response => response.json())
            .then(products => {
                productsGrid.innerHTML = ''; // Clear existing products
                
                products.forEach(product => {
                    const productCard = createProductCard(product);
                    productsGrid.appendChild(productCard);
                });
            })
            .catch(error => console.error('Error:', error))
            .finally(() => {
                loadingSpinner.style.display = 'none';
            });
    }

    // Function to create product card
    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        card.innerHTML = `
            <img src="${product.image_url || '/static/images/products/no-image.png'}" 
                 alt="${product.name}" 
                 class="product-image"
                 onerror="this.src='/static/images/products/no-image.png'">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">₱${parseFloat(product.price).toLocaleString('en-PH', {minimumFractionDigits: 2})}</p>
                <div class="product-actions">
                    <button onclick="addToCart(${product.id})" class="action-button add-to-cart">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <button onclick="addToWishlist(${product.id})" class="action-button add-to-wishlist">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }

    // Event listeners
    sortSelect.addEventListener('change', updateProducts);
    brandSelect.addEventListener('change', updateProducts);
    
    searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updateProducts, 300);
    });

    // Initial load
    updateProducts();
});

// Cart functionality
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

// Wishlist functionality
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

// Update cart count
function updateCartCount() {
    fetch('/get_cart_count')
        .then(response => response.json())
        .then(data => {
            document.querySelector('.cart-count').textContent = data.count;
        });
}

// Update wishlist count
function updateWishlistCount() {
    fetch('/get_wishlist_count')
        .then(response => response.json())
        .then(data => {
            document.querySelector('.wishlist-count').textContent = data.count;
        });
} 