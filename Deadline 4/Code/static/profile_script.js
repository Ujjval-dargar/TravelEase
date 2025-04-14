

// --- Appended from HTML ---
// Get current page URL path
        const currentPath = window.location.pathname;
        
        // Find all nav links
        const navLinks = document.querySelectorAll('.nav-link');
        
        // Check which nav link matches current path and add active class
        navLinks.forEach(link => {
            const linkPath = new URL(link.href).pathname;
            if (currentPath === linkPath) {
                link.classList.add('active');
            }
        });