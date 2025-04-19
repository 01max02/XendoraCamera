document.addEventListener('DOMContentLoaded', function() {
    initializeChartAnimations();
    initializeQuickActions();
    initializeThemeToggle();
    initializeDragDrop();
    initializeTooltips();
    
    // Initialize Sales Chart
    const ctx = document.getElementById('salesChart').getContext('2d');
    const salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Sales',
                data: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Chart Period Controls
    document.querySelectorAll('.chart-controls button').forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.chart-controls button').forEach(btn => {
                btn.classList.remove('active');
            });
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update chart data based on selected period
            updateChartData(this.textContent.toLowerCase());
        });
    });

    // Sidebar Toggle
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.toggle-sidebar');
    
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Add Product Modal
    const addProductModal = document.getElementById('addProductModal');
    const addProductBtns = document.querySelectorAll('.add-product-btn');
    const closeModalBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.cancel-btn');

    addProductBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            addProductModal.style.display = 'block';
        });
    });

    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === addProductModal) {
            closeModal();
        }
    });

    // Product Image Preview
    const imageInput = document.getElementById('productImage');
    const imagePreview = document.querySelector('.image-preview');

    imageInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // Add Product Form Submit
    const addProductForm = document.getElementById('addProductForm');
    addProductForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        fetch('/add_product', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Product added successfully', 'success');
                closeModal();
                // Refresh product list
                location.reload();
            } else {
                showNotification(data.message || 'Failed to add product', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred', 'error');
        });
    });

    // Product Actions (Edit/Delete)
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            editProduct(productId);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            if (confirm('Are you sure you want to delete this product?')) {
                deleteProduct(productId);
            }
        });
    });

    // Order Status Update
    document.querySelectorAll('.update-status-btn').forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            updateOrderStatus(orderId);
        });
    });

    // Helper Functions
    function closeModal() {
        addProductModal.style.display = 'none';
        addProductForm.reset();
        imagePreview.innerHTML = '';
    }

    function updateChartData(period) {
        // Show loading state
        salesChart.data.datasets[0].data = [];
        salesChart.update('none');
        
        fetch(`/get_sales_data?period=${period}`)
            .then(response => response.json())
            .then(data => {
                salesChart.data.labels = data.labels;
                salesChart.data.datasets[0].data = data.values;
                salesChart.update({
                    duration: 800,
                    easing: 'easeInOutQuart'
                });
            })
            .catch(error => console.error('Error:', error));
    }

    function editProduct(productId) {
        fetch(`/get_product/${productId}`)
            .then(response => response.json())
            .then(product => {
                // Populate form with product data
                document.getElementById('productName').value = product.name;
                document.getElementById('productDescription').value = product.description;
                document.getElementById('productPrice').value = product.price;
                document.getElementById('productStock').value = product.stock;
                document.getElementById('productCategory').value = product.category;
                
                // Show modal
                addProductModal.style.display = 'block';
                // Update form action and button text
                addProductForm.setAttribute('data-edit-id', productId);
                document.querySelector('.submit-btn').textContent = 'Update Product';
            })
            .catch(error => console.error('Error:', error));
    }

    function deleteProduct(productId) {
        fetch('/delete_product', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product_id: productId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Product deleted successfully', 'success');
                // Remove product row from table
                document.querySelector(`tr[data-product-id="${productId}"]`).remove();
            } else {
                showNotification(data.message || 'Failed to delete product', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred', 'error');
        });
    }

    function updateOrderStatus(orderId) {
        const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered'];
        const currentStatus = document.querySelector(`[data-order-id="${orderId}"]`)
            .closest('tr')
            .querySelector('.status-badge')
            .textContent.trim();
        
        const newStatus = prompt(
            `Current status: ${currentStatus}\nEnter new status:\n${statusOptions.join(', ')}`,
            currentStatus
        );

        if (newStatus && statusOptions.includes(newStatus)) {
            fetch('/update_order_status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order_id: orderId,
                    status: newStatus
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update status badge
                    const statusBadge = document.querySelector(`[data-order-id="${orderId}"]`)
                        .closest('tr')
                        .querySelector('.status-badge');
                    statusBadge.textContent = newStatus;
                    statusBadge.className = `status-badge ${newStatus.toLowerCase()}`;
                    showNotification('Order status updated successfully', 'success');
                } else {
                    showNotification(data.message || 'Failed to update order status', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('An error occurred', 'error');
            });
        }
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    function initializeChartAnimations() {
        const salesChart = document.getElementById('salesChart');
        salesChart.style.opacity = '0';
        setTimeout(() => {
            salesChart.style.opacity = '1';
            salesChart.style.transition = 'opacity 0.5s ease';
        }, 300);
    }

    function initializeQuickActions() {
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', function() {
                const action = this.querySelector('h4').textContent;
                switch(action) {
                    case 'Add Product':
                        document.querySelector('.add-product-btn').click();
                        break;
                    case 'Manage Promotions':
                        // Add promotion management logic
                        break;
                    case 'Inventory':
                        // Add inventory management logic
                        break;
                }
            });
        });
    }

    function initializeThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const currentTheme = localStorage.getItem('theme') || 'light';
        
        document.documentElement.setAttribute('data-theme', currentTheme);
        
        themeToggle.addEventListener('click', () => {
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update icon
            themeToggle.querySelector('i').classList.toggle('fa-moon');
            themeToggle.querySelector('i').classList.toggle('fa-sun');
        });
    }

    function initializeDragDrop() {
        const dropZone = document.getElementById('dragDropZone');
        const fileInput = document.getElementById('productImage');
        const preview = document.getElementById('imagePreview');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });

        function highlight() {
            dropZone.classList.add('drag-over');
        }

        function unhighlight() {
            dropZone.classList.remove('drag-over');
        }

        dropZone.addEventListener('drop', handleDrop, false);
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFiles);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        }

        function handleFiles(files) {
            files = files.target?.files || files;
            [...files].forEach(previewFile);
        }

        function previewFile(file) {
            if (!file.type.startsWith('image/')) return;
            
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = function() {
                const img = document.createElement('img');
                img.src = reader.result;
                preview.appendChild(img);
            }
        }
    }

    function showSkeletonLoader(container, count = 1) {
        const template = document.getElementById('skeletonLoader');
        container.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const clone = template.content.cloneNode(true);
            container.appendChild(clone);
        }
    }

    function initializeTooltips() {
        const tooltipTriggerList = [].slice.call(
            document.querySelectorAll('[data-bs-toggle="tooltip"]')
        );
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    // Modal Functions
    function openAddProductModal() {
        document.getElementById('addProductModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        document.getElementById('addProductModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Category Management
    function updateSubcategories() {
        const mainCategory = document.getElementById('mainCategory').value;
        const subcategorySelect = document.getElementById('subcategory');
        
        const subcategories = {
            'CAMERAS & LENSES': [
                'DSLR CAMERAS', 'MIRRORLESS CAMERAS', 'POINT & SHOOT CAMERAS',
                'ACTION CAMERAS', 'CAMERA LENSES', 'LENS FILTERS',
                'LENS ADAPTERS', 'LENS CAPS'
            ],
            'AUDIO EQUIPMENT': [
                'CAMERA MICROPHONES', 'WIRELESS MICROPHONES', 'AUDIO RECORDERS',
                'AUDIO MIXERS', 'HEADPHONES', 'AUDIO CABLES',
                'WINDSCREENS', 'MICROPHONE STANDS'
            ],
            // ... add other categories
        };

        // Clear existing options
        subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';

        // Add new options
        if (subcategories[mainCategory]) {
            subcategories[mainCategory].forEach(sub => {
                const option = document.createElement('option');
                option.value = sub;
                option.textContent = sub;
                subcategorySelect.appendChild(option);
            });
        }
    }

    // Initialize all features
    document.addEventListener('DOMContentLoaded', function() {
        initializeDragDrop();
        initializeChartAnimations();
        initializeTooltips();
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            if (event.target === document.getElementById('addProductModal')) {
                closeModal();
            }
        }
    });
}); 