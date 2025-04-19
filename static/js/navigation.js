document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    const megaMenus = document.querySelectorAll('.mega-menu');

    // Function to close all mega menus
    function closeAllMegaMenus() {
        megaMenus.forEach(menu => {
            menu.style.opacity = '0';
            menu.style.visibility = 'hidden';
            menu.style.transform = 'translateY(10px)';
        });
    }

    // Handle mouse interactions for each nav item
    navItems.forEach(item => {
        const megaMenu = item.querySelector('.mega-menu');

        // Show mega menu on hover
        item.addEventListener('mouseenter', function() {
            closeAllMegaMenus();
            if (megaMenu) {
                megaMenu.style.opacity = '1';
                megaMenu.style.visibility = 'visible';
                megaMenu.style.transform = 'translateY(0)';
            }
        });

        // Hide mega menu when mouse leaves
        item.addEventListener('mouseleave', function() {
            if (megaMenu) {
                megaMenu.style.opacity = '0';
                megaMenu.style.visibility = 'hidden';
                megaMenu.style.transform = 'translateY(10px)';
            }
        });

        // Handle click for mobile devices
        item.addEventListener('click', function(e) {
            if (window.innerWidth <= 992) { // Mobile breakpoint
                e.preventDefault();
                
                if (megaMenu) {
                    const isVisible = megaMenu.style.visibility === 'visible';
                    
                    closeAllMegaMenus();
                    
                    if (!isVisible) {
                        megaMenu.style.opacity = '1';
                        megaMenu.style.visibility = 'visible';
                        megaMenu.style.transform = 'translateY(0)';
                    }
                }
            }
        });
    });

    // Close mega menus when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-item')) {
            closeAllMegaMenus();
        }
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            closeAllMegaMenus();
        }, 250);
    });
});
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');

    // Handle mouse interactions
    navItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            // Close all other open menus
            navItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Open this menu
            item.classList.add('active');
        });

        // Optional: Close on mouse leave
        item.addEventListener('mouseleave', function() {
            item.classList.remove('active');
        });
    });

    // Handle touch interactions for mobile
    navItems.forEach(item => {
        const link = item.querySelector('.nav-link');
        
        link.addEventListener('click', function(e) {
            if (window.innerWidth <= 992) { // Mobile breakpoint
                e.preventDefault();
                
                // Close other menus
                navItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Toggle this menu
                item.classList.toggle('active');
            }
        });
    });

    // Close menus when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-item')) {
            navItems.forEach(item => {
                item.classList.remove('active');
            });
        }
    });
});