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
    + '<th>Hotel ID</th><th>Hotel Name</th><th>Location</th>'
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
          <td><a href="/booking?type=hotel&hotel_id=${encodeURIComponent(h.hotel_id)}&user_id=${encodeURIComponent(user_id)}&from_date=${from_date}&to_date=${to_date}" class="btn-book">Book</a></td>
        </tr>`;

  });
  html += '</table>';
  container.innerHTML = html;

});

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
