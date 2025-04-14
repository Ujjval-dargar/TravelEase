const params = new URLSearchParams(window.location.search);
const user_id = params.get("user_id");

document.getElementById('hotel-search-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const arr_loc = document.getElementById('arrival_location').value;
  const from_date = document.getElementById('from_date').value;
  const to_date = document.getElementById('to_date').value;

  const res = await fetch('/api/search_hotels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ arrival_location: arr_loc, from_date: from_date ,to_date:to_date})
  });

  const data = await res.json();
  const container = document.getElementById('results-container');
  container.innerHTML = '';

  if (data.error) {
    container.innerHTML = `<p class="no-results">${data.error}</p>`;
    return;
  }
  const hotels = data.results;
  if (!hotels.length) {
    container.innerHTML = `<p class="no-results">No Hotel found.</p>`;
    return;
  }

  // Build table
  let html = '<table><tr>'
    + '<th>Hotel Name</th><th>Location</th>'
    + '<th>Email</th><th>Mobile Number</th><th>Hotel Description</th><th>Available Rooms</th>'
    + '<th>Price Per Night</th><th>Rating</th>'
    + '<th>Actions</th>'
    + '</tr>';
  hotels.forEach(h => {
    console.log(h);
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
                        <a href="/booking?type=hotel&hotel_id=${encodeURIComponent(h.hotel_id)}&user_id=${encodeURIComponent(user_id)}&from_date=${encodeURIComponent(from_date)}&to_date=${encodeURIComponent(to_date)}" class="btn-book">Book</a>
                        <button class="btn-show-reviews" data-hotel-id="${h.hotel_id}">Show Reviews</button>
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

});

// Handle "Show Reviews" button clicks
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('btn-show-reviews')) {
      const button = e.target;
      const hotelId = button.getAttribute('data-hotel-id');
      const reviewsRow = document.getElementById(`reviews-${hotelId}`);
      const reviewsContainer = reviewsRow.querySelector('.reviews-container');

      if (reviewsRow.classList.contains('hidden')) {
          // Show reviews
          if (!reviewsContainer.innerHTML.trim()) {
              // Load reviews if not already loaded
              loadReviews(hotelId, reviewsContainer);
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
