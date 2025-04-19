document.addEventListener('DOMContentLoaded', function() {
    // Sidebar toggle functionality
    const sidebar = document.querySelector(".sidebar");
    const sidebarBtn = document.querySelector(".sidebarBtn");
    sidebarBtn.addEventListener('click', function() {
        sidebar.classList.toggle("active");
    });

    // Profile dropdown functionality
    const profileDetails = document.querySelector(".profile-details");
    const dropdownMenu = createDropdownMenu();
    
    profileDetails.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });

    // Search functionality
    const searchBox = document.querySelector(".search-box input");
    searchBox.addEventListener('input', function(e) {
        // You can implement search logic here
        console.log('Searching for:', e.target.value);
    });

    // Add hover effects to boxes
    const boxes = document.querySelectorAll('.box');
    boxes.forEach(box => {
        box.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease';
        });

        box.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });

        // Make boxes clickable to show details
        box.addEventListener('click', function() {
            const boxTopic = this.querySelector('.box-topic').textContent;
            showDetailsModal(boxTopic);
        });
    });
});

// Create dropdown menu for profile
function createDropdownMenu() {
    const dropdown = document.createElement('div');
    dropdown.className = 'profile-dropdown';
    dropdown.innerHTML = `
        <ul>
            <li><i class='bx bxs-user'></i> My Profile</li>
            <li><i class='bx bxs-edit'></i> Edit Profile</li>
            <li><i class='bx bxs-cog'></i> Settings</li>
            <li><i class='bx bxs-log-out'></i> Logout</li>
        </ul>
    `;
    
    document.querySelector('.profile-details').appendChild(dropdown);
    return dropdown;
}

// Show details modal when clicking on boxes
function showDetailsModal(boxType) {
    const modal = document.createElement('div');
    modal.className = 'details-modal';
    
    let content = '';
    switch(boxType) {
        case 'Total Orders':
            content = `
                <h2>Order Details</h2>
                <p>Recent Orders:</p>
                <ul>
                    <li>No orders yet</li>
                </ul>
            `;
            break;
        case 'Total Sales':
            content = `
                <h2>Sales Details</h2>
                <p>Recent Sales:</p>
                <ul>
                    <li>No sales yet</li>
                </ul>
            `;
            break;
        // Add other cases as needed
    }

    modal.innerHTML = `
        <div class="modal-content">
            ${content}
            <button class="close-modal">Close</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal functionality
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });
}

// Add this to your sellerdetails.html
// <script src="{{ url_for('static', filename='js/sellerdetails.js') }}"></script>
