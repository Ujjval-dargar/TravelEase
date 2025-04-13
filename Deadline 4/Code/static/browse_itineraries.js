const params = new URLSearchParams(window.location.search);
const user_id = params.get("user_id");

document.getElementById('itinerary-search-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const dest_city = document.getElementById('destination_city').value;
    const dest_state = document.getElementById('destination_state').value;
    const dest_country = document.getElementById('destination_country').value;

    const res = await fetch('/api/search_itineraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination_city: dest_city, destination_state: dest_state, destination_country: dest_country })
    });

    const data = await res.json();
    const container = document.getElementById('results-container');
    container.innerHTML = '';

    if (data.error) {
        container.innerHTML = `<p class="no-results">${data.error}</p>`;
        return;
    }
    const itineraries = data.results;
    if (!itineraries.length) {
        container.innerHTML = `<p class="no-results">No Itineraries found.</p>`;
        return;
    }

    // Build table
    let html = '<table><tr>'
        + '<th>Itinerary ID</th>'
        + '<th>Description</th>'
        + '<th>City</th>'
        + '<th>State</th>'
        + '<th>Country</th>'
        + '<th>Days</th>'
        + '<th>Nights</th>'
        + '<th>Price</th>'
        + '<th>Actions</th>'
        + '</tr>';

    itineraries.forEach(t => {
        html += `<tr>
          <td>${t.itinerary_id}</td>
          <td>${t.description}</td>
          <td>${t.destination_city}</td>
          <td>${t.destination_state}</td>
          <td>${t.destination_country}</td>
          <td>${t.duration_day}</td>
          <td>${t.duration_night}</td>
          <td>${t.price}</td>
          <td><a href="/booking?type=itinerary&itinerary_id=${encodeURIComponent(t.itinerary_id)}&user_id=${encodeURIComponent(user_id)}" class="btn-book">Book</a></td>
        </tr>`;

    });
    html += '</table>';
    container.innerHTML = html;

});