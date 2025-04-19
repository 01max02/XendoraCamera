document.addEventListener('DOMContentLoaded', function() {
    // Initialize all tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Price Range Slider
    const rangeMin = document.querySelector('.range-min');
    const rangeMax = document.querySelector('.range-max');
    const priceInputs = document.querySelectorAll('.price-inputs input');

    if (rangeMin && rangeMax && priceInputs.length) {
        // Update range slider values
        function updateRange() {
            const minVal = parseInt(rangeMin.value);
            const maxVal = parseInt(rangeMax.value);
            
            if (maxVal - minVal < 1000) {
                if (maxVal === parseInt(rangeMax.max)) {
                    rangeMin.value = parseInt(rangeMax.max) - 1000;
                } else {
                    rangeMax.value = minVal + 1000;
                }
            }
            
            priceInputs[0].value = rangeMin.value;
            priceInputs[1].value = rangeMax.value;
        }

        rangeMin.addEventListener('input', updateRange);
        rangeMax.addEventListener('input', updateRange);

        // Sync input fields with range sliders
        priceInputs.forEach((input, index) => {
            input.addEventListener('change', function() {
                const value = parseInt(this.value);
                if (index === 0) {
                    rangeMin.value = Math.min(value, parseInt(rangeMax.value) - 1000);
                } else {
                    rangeMax.value = Math.max(value, parseInt(rangeMin.value) + 1000);
                }
                updateRange();
            });
        });
    }

    // Apply Filters
    const applyFilterBtn = document.querySelector('#filterModal .btn-primary');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function() {
            // Get all selected filters
            const selectedFilters = {
                priceMin: parseInt(rangeMin.value),
                priceMax: parseInt(rangeMax.value),
                ratings: getSelectedRatings(),
                brands: getSelectedBrands(),
                categories: getSelectedCategories()
            };

            // Update active filters display
            updateActiveFilters(selectedFilters);
            
            // Apply filters to products
            filterProducts(selectedFilters);
            
            // Close modal
            const filterModal = document.getElementById('filterModal');
            const modal = bootstrap.Modal.getInstance(filterModal);
            if (modal) {
                modal.hide();
            }
        });
    }

    // Clear Filters
    const clearFilterBtn = document.querySelector('#filterModal .btn-secondary');
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', function() {
            resetFilters();
        });
    }

    // Remove individual filter tags
    document.querySelector('.active-filters')?.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove')) {
            const filterTag = e.target.parentElement;
            filterTag.remove();
            // Update products based on remaining filters
            const currentFilters = getCurrentFilters();
            filterProducts(currentFilters);
        }
    });
});

function getSelectedRatings() {
    const ratings = [];
    document.querySelectorAll('.ratings-filter input:checked').forEach(input => {
        ratings.push(parseInt(input.value));
    });
    return ratings;
}

function getSelectedBrands() {
    const brands = [];
    document.querySelectorAll('.brand-filter input:checked').forEach(input => {
        brands.push(input.value);
    });
    return brands;
}

function getSelectedCategories() {
    const categories = [];
    document.querySelectorAll('.category-filter input:checked').forEach(input => {
        categories.push(input.value);
    });
    return categories;
}

function updateActiveFilters(filters) {
    const activeFilters = document.querySelector('.active-filters');
    if (!activeFilters) return;

    activeFilters.innerHTML = '';

    // Add price range filter tag
    if (filters.priceMin || filters.priceMax) {
        const priceTag = document.createElement('div');
        priceTag.className = 'filter-tag';
        priceTag.innerHTML = `
            Price: ₱${filters.priceMin.toLocaleString()} - ₱${filters.priceMax.toLocaleString()}
            <span class="remove">×</span>
        `;
        activeFilters.appendChild(priceTag);
    }

    // Add rating filter tags
    filters.ratings.forEach(rating => {
        const ratingTag = document.createElement('div');
        ratingTag.className = 'filter-tag';
        ratingTag.innerHTML = `
            ${rating}+ Stars
            <span class="remove">×</span>
        `;
        activeFilters.appendChild(ratingTag);
    });

    // Add brand filter tags
    filters.brands.forEach(brand => {
        const brandTag = document.createElement('div');
        brandTag.className = 'filter-tag';
        brandTag.innerHTML = `
            ${brand}
            <span class="remove">×</span>
        `;
        activeFilters.appendChild(brandTag);
    });
}

function filterProducts(filters) {
    // Get all product cards
    const products = document.querySelectorAll('.product-card');
    
    products.forEach(product => {
        const price = parseInt(product.dataset.price);
        const rating = parseFloat(product.dataset.rating);
        const brand = product.dataset.brand;
        const category = product.dataset.category;
        
        let showProduct = true;
        
        // Check price range
        if (price < filters.priceMin || price > filters.priceMax) {
            showProduct = false;
        }
        
        // Check ratings
        if (filters.ratings.length && !filters.ratings.includes(Math.floor(rating))) {
            showProduct = false;
        }
        
        // Check brands
        if (filters.brands.length && !filters.brands.includes(brand)) {
            showProduct = false;
        }
        
        // Check categories
        if (filters.categories.length && !filters.categories.includes(category)) {
            showProduct = false;
        }
        
        // Show/hide product
        product.style.display = showProduct ? 'block' : 'none';
    });
}

function resetFilters() {
    // Reset range sliders
    const rangeMin = document.querySelector('.range-min');
    const rangeMax = document.querySelector('.range-max');
    if (rangeMin && rangeMax) {
        rangeMin.value = rangeMin.min;
        rangeMax.value = rangeMax.max;
    }

    // Reset price inputs
    const priceInputs = document.querySelectorAll('.price-inputs input');
    if (priceInputs.length) {
        priceInputs[0].value = rangeMin.min;
        priceInputs[1].value = rangeMax.max;
    }

    // Uncheck all checkboxes
    document.querySelectorAll('#filterModal input[type="checkbox"]')
        .forEach(input => input.checked = false);

    // Clear active filters
    const activeFilters = document.querySelector('.active-filters');
    if (activeFilters) {
        activeFilters.innerHTML = '';
    }

    // Show all products
    document.querySelectorAll('.product-card').forEach(product => {
        product.style.display = 'block';
    });
}

function getCurrentFilters() {
    const activeFilters = document.querySelector('.active-filters');
    const filters = {
        priceMin: 0,
        priceMax: 200000,
        ratings: [],
        brands: [],
        categories: []
    };

    if (!activeFilters) return filters;

    activeFilters.querySelectorAll('.filter-tag').forEach(tag => {
        const text = tag.textContent.trim();
        if (text.startsWith('Price:')) {
            const prices = text.match(/₱([\d,]+)/g);
            if (prices && prices.length === 2) {
                filters.priceMin = parseInt(prices[0].replace(/[₱,]/g, ''));
                filters.priceMax = parseInt(prices[1].replace(/[₱,]/g, ''));
            }
        } else if (text.includes('Stars')) {
            filters.ratings.push(parseInt(text));
        } else {
            // Assume it's a brand or category
            const value = text.replace('×', '').trim();
            if (document.querySelector(`.brand-filter input[value="${value}"]`)) {
                filters.brands.push(value);
            } else {
                filters.categories.push(value);
            }
        }
    });

    return filters;
} 