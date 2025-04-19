// Animation on load
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.dashboard').classList.add('fade-in');
});

// Confirmation functions
function confirmLogout() {
    return confirm("Are you sure you want to logout?");
}

function confirmRestore(userId) {
    return confirm("Are you sure you want to restore this account?");
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type} fade-in`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.querySelector('.search-form');
    const searchInput = searchForm.querySelector('input');

    searchInput.addEventListener('input', function() {
        if (this.value.length > 0) {
            this.classList.add('has-content');
        } else {
            this.classList.remove('has-content');
        }
    });
}); 