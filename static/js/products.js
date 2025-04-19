// Move these declarations to the top of the file, outside any functions
let loadMoreBtn;
let isLoading = false;
let currentPage = 1;

// Function to check if a product is new (within last 7 days)
function isNewProduct(createdDate) {
    const now = new Date();
    const productDate = new Date(createdDate);
    const diffTime = Math.abs(now - productDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
}

// Function to add new product to new releases section
function addToNewReleases(product) {
    const newReleasesGrid = document.querySelector('.new-releases .products-grid');
    
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.dataset.productId = product.id;
    
    productCard.innerHTML = `
        <div class="product-image">
            <img src="${product.image_url}" alt="${product.name}">
            <div class="product-badge">New</div>
            <div class="product-actions">
                <button class="action-btn wishlist-btn" onclick="addToWishlist(${product.id})">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="action-btn view-btn" onclick="viewProduct(${product.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn cart-btn" onclick="addToCart(${product.id})">
                    <i class="fas fa-shopping-cart"></i>
                </button>
            </div>
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <p class="price">₱${product.price.toFixed(2)}</p>
            <p class="release-date">Just added</p>
        </div>
    `;
    
    // Add with animation
    productCard.style.opacity = '0';
    newReleasesGrid.insertBefore(productCard, newReleasesGrid.firstChild);
    
    // Trigger animation
    setTimeout(() => {
        productCard.style.opacity = '1';
        productCard.style.transform = 'translateY(0)';
    }, 100);
}

// Function to handle new product submission
function handleNewProduct(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    fetch('/api/products/add', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Add to new releases section
            addToNewReleases(data.product);
            
            // Show success notification
            showNotification('Product added successfully!', 'success');
            
            // Clear form
            event.target.reset();
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        showNotification('Error adding product', 'error');
        console.error('Error:', error);
    });
}

// Function to load new releases
function loadNewReleases() {
    fetch('/api/products/new-releases')
        .then(response => response.json())
        .then(data => {
            const newReleasesGrid = document.querySelector('.new-releases .products-grid');
            newReleasesGrid.innerHTML = ''; // Clear existing content
            
            data.products.forEach(product => {
                addToNewReleases(product);
            });
        })
        .catch(error => {
            console.error('Error loading new releases:', error);
        });
}

// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
    loadNewReleases();
    
    // Refresh new releases every 5 minutes
    setInterval(loadNewReleases, 300000);
});

// Filtering functions
function filterByRating(minRating) {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        const rating = parseFloat(card.dataset.rating);
        card.style.display = rating >= minRating ? 'block' : 'none';
    });
}

function filterByCategory(category) {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        const productCategory = card.dataset.category;
        card.style.display = category === 'all' || productCategory === category ? 'block' : 'none';
    });
}

// Product Modal Functions
function openProductModal(productId) {
    fetch(`/api/product/${productId}`)
        .then(response => response.json())
        .then(product => {
            document.getElementById('modalImage').src = product.image_url;
            document.getElementById('modalTitle').textContent = product.name;
            document.getElementById('modalPrice').textContent = `₱${product.price.toFixed(2)}`;
            document.getElementById('modalDescription').textContent = product.description;
            document.getElementById('modalRating').textContent = `${product.rating}/5`;
            document.getElementById('modalReviews').innerHTML = generateReviewsHTML(product.reviews);
            
            const modal = document.getElementById('productModal');
            modal.style.display = 'block';
        });
}

function generateReviewsHTML(reviews) {
    return reviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <span class="review-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</span>
                <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
            </div>
            <p class="review-text">${review.comment}</p>
            <p class="review-author">- ${review.author}</p>
        </div>
    `).join('');
}

// Load Featured Products
function loadFeaturedProducts() {
    fetch('/api/featured-products')
        .then(response => response.json())
        .then(products => {
            const container = document.querySelector('.featured-products .products-grid');
            container.innerHTML = products.map(product => generateProductCard(product)).join('');
        });
}

// Load New Releases
function loadNewReleases() {
    fetch('/api/new-releases')
        .then(response => response.json())
        .then(products => {
            const container = document.querySelector('.new-releases .products-grid');
            container.innerHTML = products.map(product => generateProductCard(product, true)).join('');
        });
}

// Load Categories
function loadCategories() {
    fetch('/api/categories')
        .then(response => response.json())
        .then(categories => {
            const container = document.querySelector('.category-grid');
            container.innerHTML = categories.map(category => generateCategoryCard(category)).join('');
        });
}

// Generate Product Card HTML
function generateProductCard(product, isNew = false) {
    return `
        <div class="product-card" data-rating="${product.rating}" data-category="${product.category}">
            <div class="product-image">
                <img src="${product.image_url}" alt="${product.name}">
                ${isNew ? '<div class="product-badge">New</div>' : ''}
                <div class="product-actions">
                    <button class="action-btn wishlist-btn" onclick="addToWishlist(${product.id})">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="action-btn view-btn" onclick="openProductModal(${product.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn cart-btn" onclick="addToCart(${product.id})">
                        <i class="fas fa-shopping-cart"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">₱${product.price.toFixed(2)}</p>
                <div class="rating">
                    ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))}
                    <span class="review-count">(${product.review_count} reviews)</span>
                </div>
            </div>
        </div>
    `;
}

// Generate Category Card HTML
function generateCategoryCard(category) {
    return `
        <div class="category-card" onclick="filterByCategory('${category.id}')">
            <img src="${category.image_url}" alt="${category.name}">
            <div class="category-content">
                <h3>${category.name}</h3>
                <p>${category.product_count} Products</p>
            </div>
        </div>
    `;
}

// Initialize everything when document loads
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedProducts();
    loadNewReleases();
    loadCategories();
});

// Add this function to your products.js
function toggleFilter() {
    const filterPanel = document.querySelector('.filter-panel');
    filterPanel.classList.toggle('active');
}

// Optional: Close filter panel when clicking outside
document.addEventListener('click', function(event) {
    const filterPanel = document.querySelector('.filter-panel');
    const filterToggle = document.querySelector('.filter-toggle');
    
    if (!filterPanel.contains(event.target) && !filterToggle.contains(event.target)) {
        filterPanel.classList.remove('active');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('quickViewModal');
    const closeModal = document.querySelector('.close-modal');
    const quickViewBtns = document.querySelectorAll('.quick-view-btn');
    loadMoreBtn = document.getElementById('loadMoreBtn');
    
    // Quick View functionality
    quickViewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.dataset.productId;
            // Here you would typically fetch product details from your backend
            // For now, we'll use dummy data
            const productData = {
                name: 'Professional DSLR Camera',
                category: 'Cameras',
                price: '₱29,999.99',
                rating: '4.5 (250 reviews)',
                description: 'High-quality professional DSLR camera with advanced features...',
                image: '/static/images/product1.jpg'
            };
            
            // Update modal content
            document.getElementById('modalProductName').textContent = productData.name;
            document.getElementById('modalProductCategory').textContent = productData.category;
            document.getElementById('modalProductPrice').textContent = productData.price;
            document.getElementById('modalProductRating').textContent = productData.rating;
            document.getElementById('modalProductDescription').textContent = productData.description;
            document.getElementById('modalProductImage').src = productData.image;
            
            modal.style.display = 'block';
        });
    });
    
    // Close modal
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
    
    // Load More functionality
    loadMoreBtn.addEventListener('click', function() {
        if (isLoading) return;
        isLoading = true;
        loadMoreBtn.textContent = 'Loading...';

        // Simulate loading delay
        setTimeout(() => {
            // Example product data for additional 4 products
            const moreProducts = [
                {
                    id: 5,
                    name: 'Camera Tripod Pro',
                    category: 'Accessories',
                    price: '₱12,999.99',
                    rating: '4.4 (120 reviews)',
                    image: '/static/images/cameraaccessories.jpg',
                    discount: '-15%'
                },
                {
                    id: 6,
                    name: 'Studio Backdrop Kit',
                    category: 'Studio Equipment',
                    price: '₱8,999.99',
                    rating: '4.3 (90 reviews)',
                    image: '/static/images/lightningandstudio.jpg',
                    discount: '-10%'
                },
                {
                    id: 7,
                    name: 'Wireless Microphone Set',
                    category: 'Audio Equipment',
                    price: '₱15,999.99',
                    rating: '4.6 (200 reviews)',
                    image: '/static/images/Mixer.jpg',
                    discount: 'New'
                },
                {
                    id: 8,
                    name: 'Professional DSLR Camera',
                    category: 'Cameras',
                    price: '₱45,999.99',
                    rating: '4.8 (180 reviews)',
                    image: '/static/images/canon.jpg',
                    discount: '-20%'
                }
            ];

            // Add new products to the grid
            moreProducts.forEach(product => {
                const productCard = createProductCard(product);
                document.querySelector('.product-grid').appendChild(productCard);

                // Add event listeners to the new card's buttons
                const newCard = document.querySelector('.product-grid').lastElementChild;
                initializeProductCardFunctionality(newCard, product);
            });

            isLoading = false;
            loadMoreBtn.textContent = 'Load More';
            
            // Hide load more button if no more products
            if (currentPage >= 2) {
                loadMoreBtn.style.display = 'none';
            }
            currentPage++;
        }, 1000);
    });

    // Function to initialize functionality for a single product card
    function initializeProductCardFunctionality(card, product) {
        // Quick view button
        const quickViewBtn = card.querySelector('.quick-view-btn');
        quickViewBtn.addEventListener('click', () => openProductModal(product));

        // Wishlist button
        const wishlistBtn = card.querySelector('.wishlist-btn');
        wishlistBtn.addEventListener('click', () => addToWishlist(product.id));

        // Cart button
        const cartBtn = card.querySelector('.cart-btn');
        cartBtn.addEventListener('click', () => addToCart(product.id));
    }

    // Helper function to create product cards
    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.innerHTML = `
            <div class="product-badge">${product.discount}</div>
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
                <div class="product-actions">
                    <button class="action-btn wishlist-btn">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="action-btn cart-btn">
                        <i class="fas fa-shopping-cart"></i>
                    </button>
                    <button class="action-btn quick-view-btn" data-product-id="${product.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-category">${product.category}</p>
                <div class="product-details">
                    <span class="product-price">${product.price}</span>
                    <div class="product-rating">
                        <i class="fas fa-star"></i>
                        <span>${product.rating}</span>
                    </div>
                </div>
            </div>
        `;
        return card;
    }

    // Function to open product modal with actual product data
    function openProductModal(product) {
        const modal = document.getElementById('quickViewModal');
        
        // Update modal content with actual product data
        document.getElementById('modalProductName').textContent = product.name;
        document.getElementById('modalProductCategory').textContent = product.category;
        document.getElementById('modalProductPrice').textContent = product.price;
        document.getElementById('modalProductRating').textContent = product.rating;
        document.getElementById('modalProductDescription').textContent = 
            `High-quality ${product.category.toLowerCase()} with advanced features. Perfect for professional use.`;
        document.getElementById('modalProductImage').src = product.image;
        
        modal.style.display = 'block';
    }

    // Function to add to wishlist and navigate
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
                showNotification('Product added to wishlist!');
                updateWishlistCount();
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error adding to wishlist', 'error');
        });
    }

    function updateWishlistCount() {
        fetch('/get_wishlist_count')
            .then(response => response.json())
            .then(data => {
                document.querySelector('.wishlist-count').textContent = data.count;
            });
    }

    // Add click event listener for wishlist icon in header
    document.addEventListener('DOMContentLoaded', function() {
        const wishlistIcon = document.querySelector('.wishlist-container a');
        if (wishlistIcon) {
            wishlistIcon.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent default link behavior
                window.location.href = '/wishlist'; // Navigate to wishlist page
            });
        }

        // Add click event listeners for wishlist buttons on products
        const wishlistBtns = document.querySelectorAll('.wishlist-btn');
        wishlistBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const productId = this.closest('.product-card').querySelector('.quick-view-btn').dataset.productId;
                addToWishlist(productId);
            });
        });
    });

    // Function to add to cart
    function addToCart(productId) {
        fetch('/add_to_cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product_id: productId,
                quantity: 1
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Product added to cart!');
                updateCartCount();
            } else {
                showNotification(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error adding to cart', 'error');
        });
    }

    // Initialize animations when page loads
    document.addEventListener('DOMContentLoaded', function() {
        initializeProductCardAnimations();
    });
    
    // Quantity selector functionality
    const minusBtn = document.querySelector('.minus');
    const plusBtn = document.querySelector('.plus');
    const qtyInput = document.querySelector('.qty-input');
    
    minusBtn.addEventListener('click', function() {
        let currentValue = parseInt(qtyInput.value);
        if (currentValue > 1) {
            qtyInput.value = currentValue - 1;
        }
    });
    
    plusBtn.addEventListener('click', function() {
        let currentValue = parseInt(qtyInput.value);
        qtyInput.value = currentValue + 1;
    });
}); 
document.addEventListener('DOMContentLoaded', function() {
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.carousel-button.next');
    const prevButton = document.querySelector('.carousel-button.prev');
    const dotsNav = document.querySelector('.carousel-nav');
    const dots = Array.from(dotsNav.children);

    let slideIndex = 0;
    const slideWidth = slides[0].getBoundingClientRect().width;

    // Arrange slides next to each other
    slides.forEach((slide, index) => {
        slide.style.left = slideWidth * index + 'px';
    });

    // Move slide function
    const moveToSlide = (currentSlide, targetSlide) => {
        track.style.transform = 'translateX(-' + targetSlide.style.left + ')';
        currentSlide.classList.remove('active');
        targetSlide.classList.add('active');
    };

    // Update dots
    const updateDots = (currentDot, targetDot) => {
        currentDot.classList.remove('active');
        targetDot.classList.add('active');
    };

    // Next button click
    nextButton.addEventListener('click', () => {
        const currentSlide = track.querySelector('.active');
        const nextSlide = currentSlide.nextElementSibling || slides[0];
        const currentDot = dotsNav.querySelector('.active');
        const nextDot = currentDot.nextElementSibling || dots[0];
        
        moveToSlide(currentSlide, nextSlide);
        updateDots(currentDot, nextDot);
    });

    // Previous button click
    prevButton.addEventListener('click', () => {
        const currentSlide = track.querySelector('.active');
        const prevSlide = currentSlide.previousElementSibling || slides[slides.length - 1];
        const currentDot = dotsNav.querySelector('.active');
        const prevDot = currentDot.previousElementSibling || dots[dots.length - 1];
        
        moveToSlide(currentSlide, prevSlide);
        updateDots(currentDot, prevDot);
    });

    // Dot click
    dotsNav.addEventListener('click', e => {
        const targetDot = e.target.closest('button');
        if (!targetDot) return;

        const currentSlide = track.querySelector('.active');
        const currentDot = dotsNav.querySelector('.active');
        const targetIndex = dots.findIndex(dot => dot === targetDot);
        const targetSlide = slides[targetIndex];

        moveToSlide(currentSlide, targetSlide);
        updateDots(currentDot, targetDot);
    });

    // Auto slide every 5 seconds
    setInterval(() => {
        nextButton.click();
    }, 5000);
});

// Quick View Modal functionality
function openProductModal(product) {
    const modal = document.getElementById('quickViewModal');
    if (!modal) return;

    // Update modal content with product details
    document.getElementById('modalProductName').textContent = product.name;
    document.getElementById('modalProductCategory').textContent = product.category;
    document.getElementById('modalProductPrice').textContent = product.price;
    document.getElementById('modalProductRating').textContent = product.rating;
    document.getElementById('modalProductImage').src = product.image;
    
    // Show modal
    modal.style.display = 'block';

    // Close modal when clicking the close button or outside the modal
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
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
            showNotification('Product added to wishlist!');
            updateWishlistCount();
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error adding to wishlist', 'error');
    });
}

function updateWishlistCount() {
    fetch('/get_wishlist_count')
        .then(response => response.json())
        .then(data => {
            document.querySelector('.wishlist-count').textContent = data.count;
        });
}

// Cart functionality
function addToCart(productId) {
    fetch('/add_to_cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            product_id: productId,
            quantity: 1
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Product added to cart!');
            updateCartCount();
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error adding to cart', 'error');
    });
}

// Helper function to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Initialize all product card functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for quick view buttons
    document.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.dataset.productId;
            const productCard = this.closest('.product-card');
            const product = {
                id: productId,
                name: productCard.querySelector('.product-name').textContent,
                category: productCard.querySelector('.product-category').textContent,
                price: productCard.querySelector('.product-price').textContent,
                rating: productCard.querySelector('.product-rating span').textContent,
                image: productCard.querySelector('.product-image img').src
            };
            openProductModal(product);
        });
    });

    // Add event listeners for wishlist buttons
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.closest('.product-card').querySelector('.quick-view-btn').dataset.productId;
            addToWishlist(productId);
        });
    });

    // Add event listeners for cart buttons
    document.querySelectorAll('.cart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.closest('.product-card').querySelector('.quick-view-btn').dataset.productId;
            addToCart(productId);
        });
    });

    // Initialize quantity selector in modal
    const minusBtn = document.querySelector('.minus');
    const plusBtn = document.querySelector('.plus');
    const qtyInput = document.querySelector('.qty-input');

    if (minusBtn && plusBtn && qtyInput) {
        minusBtn.addEventListener('click', function() {
            let currentValue = parseInt(qtyInput.value);
            if (currentValue > 1) {
                qtyInput.value = currentValue - 1;
            }
        });

        plusBtn.addEventListener('click', function() {
            let currentValue = parseInt(qtyInput.value);
            qtyInput.value = currentValue + 1;
        });
    }
});

function addToCart(productId) {
    fetch('/add_to_cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            product_id: productId,
            quantity: 1
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Product added to cart successfully!');
            updateCartCount();
        } else {
            showNotification(data.message || 'Error adding to cart', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error adding to cart', 'error');
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
            showNotification('Product added to wishlist successfully!');
            updateWishlistCount();
        } else {
            showNotification(data.message || 'Error adding to wishlist', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error adding to wishlist', 'error');
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
