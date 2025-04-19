document.addEventListener('DOMContentLoaded', function() {
    // Settings Modal Elements
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeBtn = settingsModal.querySelector('.close-btn');
    const cancelBtn = settingsModal.querySelector('.cancel-btn');
    const saveBtn = settingsModal.querySelector('.save-btn');
    const tabButtons = settingsModal.querySelectorAll('.tab-btn');
    const tabPanes = settingsModal.querySelectorAll('.tab-pane');

    // Tab Functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const tabId = button.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Open Modal
    settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        settingsModal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    });

    // Close Modal Functions
    const closeModal = () => {
        settingsModal.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
        resetForm();
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Close on outside click
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeModal();
        }
    });

    // Reset Form
    function resetForm() {
        const inputs = settingsModal.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
        
        // Reset to first tab
        tabButtons[0].click();
    }

    // Save Settings
    saveBtn.addEventListener('click', () => {
        // Collect form data
        const formData = {
            profile: {
                displayName: document.getElementById('displayName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value
            },
            notifications: {
                email: document.getElementById('emailNotif').checked,
                push: document.getElementById('pushNotif').checked
            },
            appearance: {
                darkMode: document.getElementById('darkMode').checked,
                fontSize: document.getElementById('fontSize').value
            }
        };

        // Handle password change if new password is provided
        const newPassword = document.getElementById('newPassword').value;
        if (newPassword) {
            formData.security = {
                currentPassword: document.getElementById('currentPassword').value,
                newPassword: newPassword,
                confirmPassword: document.getElementById('confirmPassword').value
            };
        }

        // Validate form data
        if (validateSettings(formData)) {
            // Show success message
            showNotification('Settings saved successfully!', 'success');
            closeModal();
        }
    });

    // Validate Settings
    function validateSettings(data) {
        // Add your validation logic here
        return true;
    }

    // Notification System
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Handle Dark Mode Toggle
    const darkModeToggle = document.getElementById('darkMode');
    darkModeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode', darkModeToggle.checked);
    });
}); 