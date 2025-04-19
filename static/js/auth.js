document.addEventListener('DOMContentLoaded', function() {
    // Handle Registration Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('.btn-register');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> Processing...';

            try {
                const formData = new FormData(this);
                const response = await fetch('/register', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    // Show success message in a modal
                    const modalHtml = `
                        <div class="modal fade" id="registrationModal" tabindex="-1">
                            <div class="modal-dialog modal-dialog-centered">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title">Registration Successful</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                    </div>
                                    <div class="modal-body text-center">
                                        <i class="fas fa-check-circle text-success" style="font-size: 48px;"></i>
                                        <p class="mt-3">${result.message}</p>
                                        ${formData.get('user_type') === 'Seller' ? 
                                            '<p class="text-muted">Please wait for admin approval. We will notify you via email.</p>' : 
                                            ''}
                                    </div>
                                    <div class="modal-footer">
                                        <button type="button" class="btn btn-primary" onclick="window.location.href='/otp_verification'">
                                            Continue
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>`;

                    // Add modal to document
                    document.body.insertAdjacentHTML('beforeend', modalHtml);
                    
                    // Show modal
                    const modal = new bootstrap.Modal(document.getElementById('registrationModal'));
                    modal.show();

                } else {
                    showAlert('error', result.error || 'Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('error', 'An error occurred. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Sign up';
            }
        });
    }

    // Handle Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('.btn-login');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> Logging in...';

            try {
                const formData = new FormData(this);
                const response = await fetch('/login', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    window.location.href = result.redirect;
                } else {
                    // Show error in a modal for pending seller
                    if (result.error.includes('pending approval')) {
                        const modalHtml = `
                            <div class="modal fade" id="pendingApprovalModal" tabindex="-1">
                                <div class="modal-dialog modal-dialog-centered">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <h5 class="modal-title">Account Pending Approval</h5>
                                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                        </div>
                                        <div class="modal-body text-center">
                                            <i class="fas fa-clock text-warning" style="font-size: 48px;"></i>
                                            <p class="mt-3">Your seller account is pending approval.</p>
                                            <p class="text-muted">Please wait for admin verification. We will notify you via email once your account is approved.</p>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                        </div>
                                    </div>
                                </div>
                            </div>`;

                        // Add modal to document
                        document.body.insertAdjacentHTML('beforeend', modalHtml);
                        
                        // Show modal
                        const modal = new bootstrap.Modal(document.getElementById('pendingApprovalModal'));
                        modal.show();
                    } else {
                        showAlert('error', result.error || 'Login failed. Please try again.');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('error', 'An error occurred. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Login';
            }
        });
    }

    // User type selection handling
    const userTypeSelect = document.getElementById('user_type');
    if (userTypeSelect) {
        userTypeSelect.addEventListener('change', function() {
            const sellerFields = document.querySelectorAll('.seller-only');
            const validIdField = document.getElementById('valid_id');
            const birField = document.getElementById('bir');

            sellerFields.forEach(field => {
                field.style.display = this.value === 'Seller' ? 'block' : 'none';
            });

            if (this.value === 'Seller') {
                validIdField.setAttribute('required', '');
                if (birField) birField.setAttribute('required', '');
            } else {
                validIdField.removeAttribute('required');
                if (birField) birField.removeAttribute('required');
            }
        });
    }

    // Helper function to show alerts
    function showAlert(type, message) {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>`;

        const alertContainer = document.querySelector('.alert-container') || document.createElement('div');
        alertContainer.className = 'alert-container';
        alertContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1050;';
        
        if (!document.body.contains(alertContainer)) {
            document.body.appendChild(alertContainer);
        }

        alertContainer.insertAdjacentHTML('beforeend', alertHtml);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            const alerts = alertContainer.getElementsByClassName('alert');
            if (alerts.length) {
                const alert = alerts[0];
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 150);
            }
        }, 5000);
    }

    // Add custom styles
    const style = document.createElement('style');
    style.textContent = `
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
            margin-right: 10px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .alert {
            margin-bottom: 10px;
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}); 