// Get URL parameters
const params = new URLSearchParams(window.location.search);
const user_id = params.get("user_id");

// Custom modal functions
function showModal(title, message, type = 'success') {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');
  const modalIcon = document.getElementById('modalIcon');

  modalTitle.textContent = title;
  modalContent.textContent = message;

  // Set icon based on type
  modalIcon.className = 'modal-icon ' + type;

  // Show different icon based on type
  if (type === 'success') {
    modalIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>`;
  } else if (type === 'error') {
    modalIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>`;
  } else if (type === 'warning') {
    modalIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>`;
  } else if (type === 'info') {
    modalIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`;
  }

  modalOverlay.style.display = 'flex';
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

document.getElementById('itinerary-search-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  
  // Show loading state
  const container = document.getElementById('results-container');
  container.innerHTML = `
    <div class="loading-state">
      <svg class="spinner" width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></circle>
      </svg>
      <p>Searching for itineraries...</p>
    </div>
  `;
  
  const dest_city = document.getElementById('destination_city').value;
  const dest_state = document.getElementById('destination_state').value;
  const dest_country = document.getElementById('destination_country').value;

  try {
    const res = await fetch('/api/search_itineraries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination_city: dest_city,
        destination_state: dest_state,
        destination_country: dest_country
      })
    });

    const data = await res.json();
    container.innerHTML = '';

    if (data.error) {
      container.innerHTML = `
        <div class="error-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <p class="no-results">${data.error}</p>
        </div>`;
      showModal('Error', data.error, 'error');
      return;
    }

    const itineraries = data.results;
    if (!itineraries || !itineraries.length) {
      container.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p class="no-results">No itineraries found for this location. Try a different destination.</p>
        </div>`;
      showModal('No Results', 'No itineraries found for this location.', 'info');
      return;
    }

    // Build table
    let html = `
      <div class="results-header">
        <h3>Found ${itineraries.length} itineraries for ${dest_city}, ${dest_state}, ${dest_country}</h3>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Location</th>
              <th>Duration</th>
              <th>Price</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>`;

    itineraries.forEach(t => {
      html += `<tr>
            <td>${t.description}</td>
            <td>${t.destination_city}, ${t.destination_state}, ${t.destination_country}</td>
            <td>${t.duration_day} days, ${t.duration_night} nights</td>
            <td>₹${t.price}</td>
            <td>${renderStars(t.avg_rating, t.num_rating)}</td>
            <td>
              <div class="actions">
                <a href="/booking?type=itinerary&itinerary_id=${encodeURIComponent(t.itinerary_id)}&user_id=${encodeURIComponent(user_id)}" class="btn-book">Book</a>
                <button class="btn-show-reviews" data-itinerary-id="${t.itinerary_id}">Show Reviews</button>
              </div>
            </td>
          </tr>
          <tr id="reviews-${t.itinerary_id}" class="reviews-row hidden">
            <td colspan="6">
              <div class="reviews-container"></div>
            </td>
          </tr>`;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;

    showModal('Success', 'Search completed successfully!', 'success');
  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = `
      <div class="error-message">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <p class="error">Failed to search itineraries. Please try again.</p>
      </div>`;
    showModal('Error', 'An error occurred while searching for itineraries. Please try again.', 'error');
  }
});

// Handle "Show Reviews" button clicks
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('btn-show-reviews')) {
    const button = e.target;
    const itineraryId = button.getAttribute('data-itinerary-id');
    const reviewsRow = document.getElementById(`reviews-${itineraryId}`);
    const reviewsContainer = reviewsRow.querySelector('.reviews-container');

    if (reviewsRow.classList.contains('hidden')) {
      // Show reviews
      if (!reviewsContainer.innerHTML.trim()) {
        // Load reviews if not already loaded
        loadReviews(itineraryId, reviewsContainer);
      }
      reviewsRow.classList.remove('hidden');
      button.textContent = 'Hide Reviews';
    } else {
      // Hide reviews
      reviewsRow.classList.add('hidden');
      button.textContent = 'Show Reviews';
    }
  }
});

// Function to fetch and display reviews
async function loadReviews(itineraryId, container) {
  try {
    container.innerHTML = `
      <div class="loading-reviews">
        <svg class="spinner" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></circle>
        </svg>
        <p>Loading reviews...</p>
      </div>`;
      
    const res = await fetch('/api/get_reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itineraryId, item_type: 'itinerary' })
    });
    
    const data = await res.json();

    if (data.error) {
      container.innerHTML = `<p class="error">${data.error}</p>`;
      return;
    }

    const reviews = data.results;
    if (!reviews || !reviews.length) {
      container.innerHTML = `
        <div class="empty-reviews">
          <p class="no-reviews">No reviews yet for this itinerary.</p>
        </div>`;
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
