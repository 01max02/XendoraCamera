document.addEventListener('DOMContentLoaded', function() {
    // Initialize shop statistics
    updateShopStats();
    
    // Initialize product filters
    initializeFilters();
    
    // Add hover effects for product cards
    initializeProductCards();
    
    // New initializations
    initializeSearchBar();
    initializeWishlist();
    initializeQuickView();
});

function updateShopStats() {
    // Animate statistics numbers
    const stats = document.querySelectorAll('.stat-card p');
    stats.forEach(stat => {
        const finalValue = parseFloat(stat.textContent.replace(/[^0-9.]/g, ''));
        animateValue(stat, 0, finalValue, 1000);
    });
}

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = Math.floor(progress * (end - start) + start);
        
        if (element.classList.contains('price')) {
            element.textContent = `₱${currentValue.toFixed(2)}`;
        } else {
            element.textContent = currentValue;
        }
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function initializeFilters() {
    // Add filter section to DOM
    const filterSection = document.createElement('div');
    filterSection.className = 'filter-section';
    filterSection.innerHTML = `
        <div class="filter-group">
            <select class="filter-select" id="categoryFilter">
                <option value="">All Categories</option>
                <option value="cameras">Cameras</option>
                <option value="lenses">Lenses</option>
                <option value="audio">Audio Equipment</option>
                <option value="lighting">Lighting</option>
            </select>
            <select class="filter-select" id="priceFilter">
                <option value="">Price Range</option>
                <option value="0-1000">₱0 - ₱1,000</option>
                <option value="1000-5000">₱1,000 - ₱5,000</option>
                <option value="5000-10000">₱5,000 - ₱10,000</option>
                <option value="10000+">₱10,000+</option>
            </select>
        </div>
        <div class="filter-group">
            <select class="filter-select" id="sortFilter">
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
            </select>
        </div>
    `;
    
    const productGrid = document.querySelector('.product-grid');
    productGrid.parentNode.insertBefore(filterSection, productGrid);
    
    // Add filter event listeners
    document.getElementById('categoryFilter').addEventListener('change', filterProducts);
    document.getElementById('priceFilter').addEventListener('change', filterProducts);
    document.getElementById('sortFilter').addEventListener('change', sortProducts);
}

function filterProducts() {
    const category = document.getElementById('categoryFilter').value;
    const priceRange = document.getElementById('priceFilter').value;
    const products = document.querySelectorAll('.product-card');
    
    products.forEach(product => {
        let show = true;
        
        // Category filter
        if (category && product.querySelector('.product-info p').textContent.toLowerCase() !== category) {
            show = false;
        }
        
        // Price filter
        if (priceRange) {
            const price = parseFloat(product.querySelector('.price').textContent.replace(/[^0-9.]/g, ''));
            const [min, max] = priceRange.split('-').map(Number);
            
            if (max && (price < min || price > max)) {
                show = false;
            } else if (!max && price < min) {
                show = false;
            }
        }
        
        product.style.display = show ? 'block' : 'none';
    });
}

function sortProducts() {
    const sortBy = document.getElementById('sortFilter').value;
    const productGrid = document.querySelector('.product-grid');
    const products = Array.from(document.querySelectorAll('.product-card'));
    
    products.sort((a, b) => {
        switch(sortBy) {
            case 'price-low':
                return getPriceFromProduct(a) - getPriceFromProduct(b);
            case 'price-high':
                return getPriceFromProduct(b) - getPriceFromProduct(a);
            case 'name':
                return getNameFromProduct(a).localeCompare(getNameFromProduct(b));
            default: // newest
                return getDateFromProduct(b) - getDateFromProduct(a);
        }
    });
    
    products.forEach(product => productGrid.appendChild(product));
}

function getPriceFromProduct(product) {
    return parseFloat(product.querySelector('.price').textContent.replace(/[^0-9.]/g, ''));
}

function getNameFromProduct(product) {
    return product.querySelector('h3').textContent;
}

function getDateFromProduct(product) {
    // Assuming there's a data-date attribute on the product card
    return new Date(product.dataset.date || 0).getTime();
}

function initializeProductCards() {
    const products = document.querySelectorAll('.product-card');
    
    products.forEach(product => {
        // Add hover effect
        product.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        product.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
        
        // Add click event to view product details
        product.addEventListener('click', function() {
            const productId = this.dataset.productId;
            if (productId) {
                window.location.href = `/product/${productId}`;
            }
        });
    });
}

// Show loading spinner
function showLoading() {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    document.querySelector('.container').appendChild(spinner);
}

// Hide loading spinner
function hideLoading() {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}

function initializeSearchBar() {
    const searchInput = document.querySelector('.search-input');
    searchInput.addEventListener('input', debounce(function(e) {
        const searchTerm = e.target.value.toLowerCase();
        filterProductsBySearch(searchTerm);
    }, 300));
}

function filterProductsBySearch(searchTerm) {
    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        const productName = product.querySelector('h3').textContent.toLowerCase();
        const productCategory = product.querySelector('.product-info p').textContent.toLowerCase();
        const shouldShow = productName.includes(searchTerm) || productCategory.includes(searchTerm);
        product.style.display = shouldShow ? 'block' : 'none';
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

function initializeWishlist() {
    const wishlistButtons = document.querySelectorAll('.wishlist-btn');
    wishlistButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const productId = this.dataset.productId;
            toggleWishlist(productId, this);
        });
    });
}

function toggleWishlist(productId, button) {
    button.classList.toggle('active');
    // Add API call here to update wishlist status
}

function initializeQuickView() {
    const quickViewButtons = document.querySelectorAll('.quick-view-btn');
    quickViewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const productId = this.dataset.productId;
            showQuickViewModal(productId);
        });
    });
}

function showQuickViewModal(productId) {
    // Implementation for quick view modal
    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    // Add modal content here
}
