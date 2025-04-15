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
    if (e.target.classList.contains('give-review-btn')) {
        const bookingId = e.target.getAttribute('data-booking-id');
        const itemType = e.target.getAttribute('data-item-type');
        openReviewModal(bookingId, itemType);
    }
});

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

// Handle form submission
document.getElementById('reviewForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const bookingId = this.getAttribute('data-booking-id');
    const itemType = this.getAttribute('data-item-type');
    const reviewText = document.getElementById('reviewText').value;
    const rating = document.getElementById('rating').value;
    const userId = new URLSearchParams(window.location.search).get('user_id');

    if (rating === '0') {
        alert('Please select a rating.');
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
            alert('Review submitted successfully!');
            document.getElementById('reviewModal').style.display = 'none';
            // Update the button to reflect submission
            const btn = document.querySelector(`.give-review-btn[data-booking-id="${bookingId}"]`);
            btn.textContent = 'Review Submitted';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-success');
            btn.disabled = true;
        } else {
            alert('Failed to submit review: ' + data.error);
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('An error occurred while submitting the review.');
    }
});