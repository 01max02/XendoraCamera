function enableEditing() {
    // Enable all input fields with class 'editable'
    var inputs = document.querySelectorAll('input:not([type="file"])');
    inputs.forEach(function(input) {
        input.disabled = false;
        input.classList.add('active');
    });

    // Show action buttons with animation
    document.getElementById('editActions').classList.add('active');
    
    // Hide floating edit button
    document.querySelector('.floating-edit-btn').style.opacity = '0';
    document.querySelector('.floating-edit-btn').style.pointerEvents = 'none';
}

function cancelEditing() {
    // Reset form to original values
    document.getElementById('profileForm').reset();

    // Disable all input fields
    var inputs = document.querySelectorAll('input:not([type="file"])');
    inputs.forEach(function(input) {
        input.disabled = true;
        input.classList.remove('active');
    });

    // Hide action buttons
    document.getElementById('editActions').classList.remove('active');
    
    // Show floating edit button
    document.querySelector('.floating-edit-btn').style.opacity = '1';
    document.querySelector('.floating-edit-btn').style.pointerEvents = 'auto';
}

// Profile image upload handling
function uploadProfilePic() {
    const fileInput = document.getElementById('profilePicInput');
    if (fileInput.files && fileInput.files[0]) {
        // Validate file size and type
        const file = fileInput.files[0];
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

        if (file.size > maxSize) {
            alert('File size must be less than 5MB');
            return;
        }

        if (!allowedTypes.includes(file.type)) {
            alert('Only JPEG, PNG, and GIF images are allowed');
            return;
        }

        // Show preview with loading state
        const reader = new FileReader();
        reader.onload = function(e) {
            const profileImage = document.getElementById('profileImage');
            profileImage.style.opacity = '0.7';
            profileImage.src = e.target.result;
            
            // Add loading animation
            profileImage.parentElement.classList.add('loading');
        }
        reader.readAsDataURL(file);

        // Submit form
        const formData = new FormData();
        formData.append('profile_image', file);
        
        fetch('/update_profile_pic', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const profileImage = document.getElementById('profileImage');
                profileImage.style.opacity = '1';
                profileImage.parentElement.classList.remove('loading');
                
                // Show success animation
                showNotification('Profile picture updated successfully!', 'success');
            } else {
                throw new Error('Upload failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const profileImage = document.getElementById('profileImage');
            profileImage.style.opacity = '1';
            profileImage.parentElement.classList.remove('loading');
            showNotification('Error uploading image. Please try again.', 'error');
        });
    }
}

// Form validation
document.getElementById('profileForm').addEventListener('submit', function(event) {
    var phoneNumber = document.getElementById('phone_number').value;
    if (!/^\d{11}$/.test(phoneNumber)) {
        event.preventDefault();
        showNotification('Phone number must be exactly 11 digits', 'error');
    }
});

// Notification system
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add loading animation styles
const style = document.createElement('style');
style.textContent = `
    .profile-image.loading::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 50%;
        border: 3px solid rgba(52, 152, 219, 0.3);
        border-top-color: var(--primary-color);
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 10px;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        z-index: 1000;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification.success i {
        color: var(--success-color);
    }
    
    .notification.error i {
        color: var(--danger-color);
    }
`;

document.head.appendChild(style);
