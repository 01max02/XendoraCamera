// Animation on load
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.dashboard').classList.add('fade-in');
});

// Confirmation functions
function confirmLogout() {
    return confirm("Are you sure you want to logout?");
}

function confirmApprove(firstName, lastName) {
    return confirm(`Are you sure you want to approve ${firstName} ${lastName} as a seller?`);
}

// Modal handling
let currentUserId = null;

function toggleCustomReason(select) {
    const customReason = document.getElementById("customReason");
    customReason.style.display = select.value === "Others" ? "block" : "none";
    if (select.value !== "Others") {
        customReason.value = "";
    }
}

function showRejectionModal(button) {
    const userId = button.getAttribute("data-user-id");
    const firstName = button.getAttribute("data-first-name");
    const lastName = button.getAttribute("data-last-name");
    
    currentUserId = userId;
    document.getElementById("rejectionModal").style.display = "flex";
    document.getElementById("modalTitle").textContent = `Reject ${firstName} ${lastName}'s Application`;
    
    // Reset form
    document.getElementById("reasonSelect").value = "";
    document.getElementById("customReason").style.display = "none";
    document.getElementById("customReason").value = "";
    
    // Add fade-in animation
    document.getElementById("rejectionModal").classList.add('fade-in');
}

function closeRejectionModal() {
    const modal = document.getElementById("rejectionModal");
    modal.classList.add('fade-out');
    
    setTimeout(() => {
        modal.style.display = "none";
        modal.classList.remove('fade-out');
    }, 300);
}

function submitRejection() {
    const selectedReason = document.getElementById("reasonSelect").value;
    const customReason = document.getElementById("customReason").value;

    let finalReason = selectedReason;
    if (selectedReason === "Others") {
        if (!customReason.trim()) {
            showNotification("Please provide a custom reason.", "error");
            return;
        }
        finalReason = customReason;
    }

    if (!finalReason) {
        showNotification("Please select or provide a reason for rejection.", "error");
        return;
    }

    // Submit the rejection form
    const form = document.getElementById(`reject-form-${currentUserId}`);
    document.getElementById(`reason-input-${currentUserId}`).value = finalReason;
    form.submit();
    closeRejectionModal();
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

// Document preview
function previewDocument(url) {
    window.open(url, '_blank', 'width=800,height=600');
} 