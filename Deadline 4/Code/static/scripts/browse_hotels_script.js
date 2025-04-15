const params = new URLSearchParams(window.location.search);
const user_id = params.get("user_id");

document.getElementById('hotel-search-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  
  const arrivalLocation = document.getElementById('arrival_location').value;
  const fromDate = document.getElementById('from_date').value;
  const toDate = document.getElementById('to_date').value;

  const container = document.getElementById('results-container');
  // Show searching loader
  container.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Searching for hotels...</p>
    </div>
  `;

  try {
    const res = await fetch('/api/search_hotels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ arrival_location: arrivalLocation, from_date: fromDate, to_date: toDate })
    });

    const data = await res.json();
    container.innerHTML = '';

    if (data.error) {
      container.innerHTML = `<p class="no-results">${data.error}</p>`;
      showPopup('Error', data.error, 'error');
      return;
    }
    
    const hotels = data.results;
    if (!hotels.length) {
      container.innerHTML = `<p class="no-results">No Hotel found.</p>`;
      showPopup('Info', 'No hotels found.', 'info');
      return;
    }

    // Build table with hotel results
    let html = '<table><tr>'
      + '<th>Hotel Name</th><th>Location</th>'
      + '<th>Email</th><th>Mobile Number</th><th>Hotel Description</th><th>Available Rooms</th>'
      + '<th>Price Per Night</th><th>Rating</th>'
      + '<th>Actions</th>'
      + '</tr>';
      
    hotels.forEach(h => {
      html += `<tr>
            <td>${h.name}</td>
            <td>${h.location}</td>
            <td>${h.email}</td>
            <td>${h.mobile_number}</td>
            <td>${h.hotel_description}</td>
            <td>${h.available_rooms}</td>
            <td>${h.price}</td>
            <td>${renderStars(h.avg_rating, h.num_rating)}</td>
            <td>
              <div class="actions">
                <a href="/booking?type=hotel&hotel_id=${encodeURIComponent(h.hotel_id)}&user_id=${encodeURIComponent(user_id)}&from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}" class="btn-book">
                  Book
                </a>
                <button class="btn-show-reviews" data-hotel-id="${h.hotel_id}">
                  Show Reviews
                </button>
              </div>
            </td>
          </tr>
          <tr id="reviews-${h.hotel_id}" class="reviews-row hidden">
            <td colspan="10">
              <div class="reviews-container"></div>
            </td>
          </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
    showPopup('Success', 'Hotel search completed successfully!', 'success');
  } catch (error) {
    console.error('Error during hotel search:', error);
    container.innerHTML = `<p class="no-results">An error occurred while searching for hotels.</p>`;
    showPopup('Error', 'Failed to search hotels. Please try again.', 'error');
  }
});

// Handle "Show Reviews" button clicks using event delegation
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.btn-show-reviews');
  if (btn) {
    const hotelId = btn.getAttribute('data-hotel-id');
    const reviewsRow = document.getElementById(`reviews-${hotelId}`);
    const reviewsContainer = reviewsRow.querySelector('.reviews-container');

    if (reviewsRow.classList.contains('hidden')) {
      // Show reviews - load if not already done
      if (!reviewsContainer.innerHTML.trim()) {
        loadReviews(hotelId, reviewsContainer);
      }
      reviewsRow.classList.remove('hidden');
      btn.textContent = 'Hide Reviews';
    } else {
      // Hide reviews
      reviewsRow.classList.add('hidden');
      btn.textContent = 'Show Reviews';
    }
  }
});

// Function to fetch and display reviews
async function loadReviews(hotelId, container) {
  try {
    container.innerHTML = '<p>Loading reviews...</p>';
    const res = await fetch('/api/get_reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: hotelId, item_type: 'hotel' })
    });
    const data = await res.json();

    if (data.error) {
      container.innerHTML = `<p class="error">${data.error}</p>`;
      return;
    }

    const reviews = data.results;
    if (!reviews || !reviews.length) {
      container.innerHTML = `<p class="no-reviews">No reviews yet.</p>`;
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'reviews-list';
    reviews.forEach(review => {
      const li = document.createElement('li');
      li.textContent = review.comment; // Safely set text content
      ul.appendChild(li);
    });
    container.innerHTML = ''; // Clear loading message
    container.appendChild(ul);
  } catch (error) {
    console.error('Error loading reviews:', error);
    container.innerHTML = `<p class="error">Failed to load reviews.</p>`;
  }
}

// Function to render star ratings
function renderStars(rating, numRatings = 0) {
  if (rating == null || numRatings === 0) {
    return `<span class="no-ratings">No ratings</span>`;
  }

  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  let stars = "★".repeat(fullStars);
  stars += halfStar ? "½" : "";
  stars += "☆".repeat(emptyStars);
  
  return `<span class="stars">${stars}</span> <span class="rating-count">(${numRatings})</span>`;
}

// Simple pop-up notification function (modal-style)
function showPopup(title, message, type) {
  const popup = document.createElement('div');
  popup.className = `popup ${type}`;
  popup.innerHTML = `<strong>${title}</strong><br>${message}`;
  Object.assign(popup.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
    color: '#fff',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    zIndex: '10000',
    opacity: '1',
    transition: 'opacity 0.5s ease'
  });
  document.body.appendChild(popup);
  
  setTimeout(() => {
    popup.style.opacity = '0';
  }, 2000);
  
  setTimeout(() => {
    if (popup && popup.parentNode) {
      popup.parentNode.removeChild(popup);
    }
  }, 2500);
}
