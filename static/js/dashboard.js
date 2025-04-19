// Profile Functions
document.addEventListener('DOMContentLoaded', function() {
    // Existing event listeners...

    // Add profile edit button listener
    const profileLink = document.querySelector('[data-profile="name"]');
    if (profileLink) {
        profileLink.addEventListener('click', showProfileModal);
    }
});

function showProfileModal() {
    // Create modal HTML
    const modalHTML = `
        <div id="profileModal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Edit Profile</h2>
                <form id="profileForm" class="profile-form">
                    <div class="form-group">
                        <label for="firstName">First Name</label>
                        <input type="text" id="firstName" name="first_name" required>
                    </div>
                    <div class="form-group">
                        <label for="lastName">Last Name</label>
                        <input type="text" id="lastName" name="last_name" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone Number</label>
                        <input type="tel" id="phone" name="phone_number" required>
                    </div>
                    <div class="form-group">
                        <label for="address">Address</label>
                        <textarea id="address" name="address" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="profileImage">Profile Image</label>
                        <input type="file" id="profileImage" name="profile_image" accept="image/*">
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="save-btn">Save Changes</button>
                        <button type="button" class="cancel-btn" onclick="closeProfileModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal elements
    const modal = document.getElementById('profileModal');
    const closeBtn = modal.querySelector('.close');
    const form = document.getElementById('profileForm');

    // Load current profile data
    loadProfileData().then(data => {
        if (data) {
            fillProfileForm(data);
        }
    });

    // Show modal
    modal.style.display = 'block';

    // Close modal events
    closeBtn.onclick = closeProfileModal;
    window.onclick = function(event) {
        if (event.target == modal) {
            closeProfileModal();
        }
    };

    // Form submission
    form.addEventListener('submit', handleProfileSubmit);
}

function fillProfileForm(data) {
    document.getElementById('firstName').value = data.first_name || '';
    document.getElementById('lastName').value = data.last_name || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('phone').value = data.phone_number || '';
    document.getElementById('address').value = data.address || '';
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    modal.remove();
}

async function handleProfileSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    try {
        const response = await fetch('/update_profile', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Profile updated successfully', 'success');
            closeProfileModal();
            loadProfileData(); // Refresh profile data
        } else {
            showNotification(result.message || 'Error updating profile', 'error');
        }
    } catch (error) {
        showNotification('Error updating profile', 'error');
        console.error('Error:', error);
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add these styles to your CSS file
const styles = `
    .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
    }

    .modal-content {
        background-color: white;
        margin: 10% auto;
        padding: 30px;
        border-radius: 15px;
        width: 80%;
        max-width: 600px;
        position: relative;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .close {
        position: absolute;
        right: 20px;
        top: 15px;
        font-size: 24px;
        cursor: pointer;
        color: #666;
    }

    .profile-form {
        display: grid;
        gap: 20px;
        margin-top: 20px;
    }

    .form-group {
        display: grid;
        gap: 8px;
    }

    .form-group label {
        font-weight: 500;
        color: #333;
    }

    .form-group input,
    .form-group textarea {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 14px;
    }

    .form-buttons {
        display: flex;
        gap: 15px;
        justify-content: flex-end;
        margin-top: 20px;
    }

    .save-btn,
    .cancel-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
    }

    .save-btn {
        background-color: var(--accent-color);
        color: white;
    }

    .cancel-btn {
        background-color: #e0e0e0;
        color: #333;
    }

    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    }

    .notification.success {
        background-color: #2ecc71;
    }

    .notification.error {
        background-color: #e74c3c;
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

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet); 