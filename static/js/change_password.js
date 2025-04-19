document.addEventListener('DOMContentLoaded', function() {
    const passwordForm = document.getElementById('passwordForm');
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    // Function to validate password requirements
    function validatePassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        return passwordRegex.test(password);
    }

    // Function to show error message
    function showError(element, message) {
        const errorDiv = element.parentElement.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    // Function to clear error message
    function clearError(element) {
        const errorDiv = element.parentElement.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    // Real-time password validation
    newPassword.addEventListener('input', function() {
        if (!validatePassword(this.value)) {
            showError(this, 'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers');
        } else {
            clearError(this);
        }
    });

    // Real-time confirm password validation
    confirmPassword.addEventListener('input', function() {
        if (this.value !== newPassword.value) {
            showError(this, 'Passwords do not match');
        } else {
            clearError(this);
        }
    });

    // Form submission handler
    passwordForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Clear any existing errors
        clearError(currentPassword);
        clearError(newPassword);
        clearError(confirmPassword);

        // Validate current password is not empty
        if (!currentPassword.value.trim()) {
            showError(currentPassword, 'Please enter your current password');
            return;
        }

        // Validate new password
        if (!validatePassword(newPassword.value)) {
            showError(newPassword, 'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers');
            return;
        }

        // Validate password confirmation
        if (newPassword.value !== confirmPassword.value) {
            showError(confirmPassword, 'Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    current_password: currentPassword.value,
                    new_password: newPassword.value,
                    confirm_password: confirmPassword.value
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message
                const flashMessage = document.createElement('div');
                flashMessage.className = 'flash-message flash-success';
                flashMessage.textContent = 'Password successfully changed!';
                passwordForm.insertBefore(flashMessage, passwordForm.firstChild);

                // Clear form
                passwordForm.reset();

                // Redirect to profile page after 2 seconds
                setTimeout(() => {
                    window.location.href = '/profile';
                }, 2000);
            } else {
                // Show error message
                const flashMessage = document.createElement('div');
                flashMessage.className = 'flash-message flash-error';
                flashMessage.textContent = data.message || 'Failed to change password';
                passwordForm.insertBefore(flashMessage, passwordForm.firstChild);
            }
        } catch (error) {
            console.error('Error:', error);
            const flashMessage = document.createElement('div');
            flashMessage.className = 'flash-message flash-error';
            flashMessage.textContent = 'An error occurred. Please try again.';
            passwordForm.insertBefore(flashMessage, passwordForm.firstChild);
        }
    });

    // Clear error messages when user starts typing
    [currentPassword, newPassword, confirmPassword].forEach(input => {
        input.addEventListener('focus', function() {
            clearError(this);
        });
    });
}); 