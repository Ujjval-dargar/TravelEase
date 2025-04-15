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

// Handle "Give Review" button clicks
document.querySelector('.table-container').addEventListener('click', function(e) {
    // Existing event listener for review button
    if (e.target.classList.contains('give-review-btn')) {
        const bookingId = e.target.getAttribute('data-booking-id');
        const itemType = e.target.getAttribute('data-item-type');
        openReviewModal(bookingId, itemType);
    }
    // New event handler for details button
    if (e.target.classList.contains('show-details-btn')) {
        const bookingId = e.target.getAttribute('data-booking-id');
        openDetailsModal(bookingId);
    }
});

// New function to handle showing booking details
// Function to fetch booking details and display them
// Function to fetch booking details and display them in a modal
function openDetailsModal(bookingId) {
    fetch(`/api/booking_full_details?booking_id=${bookingId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok " + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const details = data.booking_details;
                const type = data.transport_type;
                
                // Prepare modal content
                let modalContent = document.getElementById('detailsModalContent');
                modalContent.innerHTML = ''; // Clear existing content
                
                // Create header section
                const headerSection = document.createElement('div');
                headerSection.className = 'detail-section';
                headerSection.innerHTML = `
                    <h3>Booking Information</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">Type</div>
                            <div class="detail-value">
                                <span class="badge badge-info">
                                    <i class="fas fa-${getIconForType(type)}"></i> ${type}
                                </span>
                            </div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Booking ID</div>
                            <div class="detail-value">#${bookingId}</div>
                        </div>
                    </div>
                `;
                modalContent.appendChild(headerSection);
                
                // Process each detail item
                details.forEach((item, index) => {
                    const section = document.createElement('div');
                    section.className = 'detail-section';
                    
                    // Create section title based on item type or index
                    let sectionTitle = `${type} Details`;
                    if (details.length > 1) {
                        sectionTitle += ` (${index + 1})`;
                    }
                    
                    section.innerHTML = `<h3>${sectionTitle}</h3>`;
                    
                    // Create grid for details
                    const detailGrid = document.createElement('div');
                    detailGrid.className = 'detail-grid';
                    
                    // Add each property to the grid
                    for (const key in item) {
                        // Format the key for display
                        const formattedKey = key
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, l => l.toUpperCase());
                        
                        const detailItem = document.createElement('div');
                        detailItem.className = 'detail-item';
                        detailItem.innerHTML = `
                            <div class="detail-label">${formattedKey}</div>
                            <div class="detail-value">${formatValue(key, item[key])}</div>
                        `;
                        detailGrid.appendChild(detailItem);
                    }
                    
                    section.appendChild(detailGrid);
                    modalContent.appendChild(section);
                });
                
                // Show the modal
                document.getElementById('detailsModal').style.display = 'flex';
            } else {
                showNotification('Error: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            showNotification('Failed to fetch booking details', 'error');
        });
}

// Helper function to get icon for transport type
function getIconForType(type) {
    switch(type.toLowerCase()) {
        case 'train': return 'train';
        case 'airplane': return 'plane';
        case 'hotel': return 'hotel';
        case 'itinerary': return 'map-marked-alt';
        default: return 'ticket-alt';
    }
}

// Helper function to format values based on the key
function formatValue(key, value) {
    // Format dates
    if (key.includes('date') && value) {
        return new Date(value).toLocaleDateString();
    }
    
    // Format currency
    if (key.includes('amount') || key.includes('price') || key.includes('cost')) {
        return '₹' + value;
    }
    
    // Format status with badges
    if (key === 'status' || key === 'payment_status') {
        let badgeClass = 'badge';
        let icon = 'info-circle';
        
        if (value === 'Confirmed' || value === 'Paid' || value === 'Completed') {
            badgeClass += ' badge-success';
            icon = 'check-circle';
        } else if (value === 'Pending') {
            badgeClass += ' badge-warning';
            icon = 'clock';
        } else if (value === 'Cancelled' || value === 'Failed') {
            badgeClass += ' badge-danger';
            icon = 'times-circle';
        }
        
        return `<span class="${badgeClass}"><i class="fas fa-${icon}"></i> ${value}</span>`;
    }
    
    return value || 'N/A';
}

// Function to show notifications
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notificationPopup');
    const icon = document.getElementById('notificationIcon');
    const messageElement = document.getElementById('notificationMessage');
    
    // Set icon based on type
    icon.className = type === 'success' ? 'fas fa-check-circle success' : 'fas fa-exclamation-circle error';
    
    // Set message
    messageElement.textContent = message;
    
    // Show notification
    notification.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}


// Open the review modal, reset the textarea, and initialize stars
function openReviewModal(bookingId, itemType) {
    const modal = document.getElementById('reviewModal');
    modal.style.display = 'flex';
    document.getElementById('reviewText').value = '';
    document.getElementById('reviewForm').setAttribute('data-booking-id', bookingId);
    document.getElementById('reviewForm').setAttribute('data-item-type', itemType);

    // Initialize star rating
    const stars = document.querySelectorAll('.star');
    const ratingInput = document.getElementById('rating');
    let selectedRating = 0;

    // Function to update star appearance based on rating
    function setStars(rating) {
        stars.forEach((star, index) => {
            star.classList.toggle('filled', index < rating);
        });
    }

    // Function to reset stars to default state
    function resetStars() {
        selectedRating = 0;
        ratingInput.value = '0';
        setStars(0);
    }

    // Add click and hover events to each star
    stars.forEach((star, index) => {
        // Remove existing listeners to prevent duplicates
        star.removeEventListener('click', star.clickHandler);
        star.removeEventListener('mouseover', star.mouseoverHandler);
        star.removeEventListener('mouseout', star.mouseoutHandler);

        // Define new handlers
        star.clickHandler = () => {
            console.log('Star clicked:', index + 1); // Debug log
            selectedRating = index + 1;
            ratingInput.value = selectedRating;
            setStars(selectedRating);
        };
        star.mouseoverHandler = () => {
            setStars(index + 1);
        };
        star.mouseoutHandler = () => {
            setStars(selectedRating);
        };

        // Attach new listeners
        star.addEventListener('click', star.clickHandler);
        star.addEventListener('mouseover', star.mouseoverHandler);
        star.addEventListener('mouseout', star.mouseoutHandler);
    });

    // Reset stars when modal opens
    resetStars();
}

// Close the modal when clicking the close button
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('reviewModal').style.display = 'none';
});

// Close the modal when clicking outside the modal content
window.addEventListener('click', function(e) {
    if (e.target === document.getElementById('reviewModal')) {
        document.getElementById('reviewModal').style.display = 'none';
    }
});

// Handle review form submit
document.getElementById('reviewForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const bookingId = this.getAttribute('data-booking-id');
    const itemType = this.getAttribute('data-item-type');
    const reviewText = document.getElementById('reviewText').value;
    const rating = document.getElementById('rating').value;
    const userId = new URLSearchParams(window.location.search).get('user_id');

    if (rating === '0') {
        showNotification('Please select a rating', 'error');
        return;
    }

    try {
        const response = await fetch('/api/add_review', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                booking_id: bookingId,
                user_id: userId,
                comment: reviewText,
                item_type: itemType,
                rating: parseInt(rating)
            })
        });

        const data = await response.json();
        if (data.success) {
            showNotification('Review submitted successfully!', 'success');
            document.getElementById('reviewModal').style.display = 'none';
            
            // Update the button to reflect submission
            const btn = document.querySelector(`.give-review-btn[data-booking-id="${bookingId}"]`);
            btn.innerHTML = '<i class="fas fa-check"></i> Reviewed';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-success');
            btn.disabled = true;
        } else {
            showNotification('Failed to submit review: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        showNotification('An error occurred while submitting the review', 'error');
    }
});

// Global modal close functionality
document.addEventListener('click', function(e) {
    // Close button click
    if (e.target.classList.contains('close') || e.target.classList.contains('close-modal')) {
        const modalId = e.target.getAttribute('data-modal') || e.target.closest('.modal').id;
        document.getElementById(modalId).style.display = 'none';
    }
    
    // Click outside of modal content
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});