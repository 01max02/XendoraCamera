
        document.addEventListener('DOMContentLoaded', function() {
            loadProducts();

            // Event listeners for filters
            document.getElementById('sortBy').addEventListener('change', loadProducts);
            document.getElementById('brandFilter').addEventListener('change', loadProducts);
            document.getElementById('searchInput').addEventListener('input', debounce(loadProducts, 300));
        });

        function loadProducts() {
            const loading = document.getElementById('loading');
            const productsGrid = document.getElementById('productsGrid');
            const sortBy = document.getElementById('sortBy').value;
            const brand = document.getElementById('brandFilter').value;
            const search = document.getElementById('searchInput').value;

            loading.style.display = 'block';
            productsGrid.innerHTML = '';

            // Fetch products from your backend
            fetch(`/api/products/lenses?sort=${sortBy}&brand=${brand}&search=${search}`)
                .then(response => response.json())
                .then(products => {
                    loading.style.display = 'none';
                    displayProducts(products);
                })
                .catch(error => {
                    console.error('Error:', error);
                    loading.style.display = 'none';
                });
        }

        function displayProducts(products) {
            const productsGrid = document.getElementById('productsGrid');
            
            products.forEach(product => {
                const productCard = createProductCard(product);
                productsGrid.appendChild(productCard);
            });
        }

        function createProductCard(product) {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            card.innerHTML = `
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-rating">
                        ${getStarRating(product.rating)}
                    </div>
                    <p class="product-price">₱${product.price.toLocaleString()}</p>
                    <div class="product-actions">
                        <button class="action-button add-to-cart" onclick="addToCart(${product.id})">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                        <button class="action-button add-to-wishlist" onclick="addToWishlist(${product.id})">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            `;
            
            return card;
        }

        function getStarRating(rating) {
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 >= 0.5;
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

        function addToCart(productId) {
            fetch('/add-to-cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ product_id: productId, quantity: 1 })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Product added to cart!');
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
                body: JSON.stringify({ product_id: productId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Product added to wishlist!');
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error adding product to wishlist');
            });
        }

        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
