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
        body: JSON.stringify({
            destination_city: dest_city,
            destination_state: dest_state,
            destination_country: dest_country
        })
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

    let html = '<table><tr>'
        + '<th>Itinerary ID</th>'
        + '<th>Description</th>'
        + '<th>City</th>'
        + '<th>State</th>'
        + '<th>Country</th>'
        + '<th>Days</th>'
        + '<th>Nights</th>'
        + '<th>Price</th>'
        + '<th>Rating</th>'
        + '<th>Actions</th>'
        + '</tr>';

    itineraries.forEach(t => {
        const itineraryId = t.itinerary_id;
        html += `<tr>
            <td>${itineraryId}</td>
            <td>${t.description}</td>
            <td>${t.destination_city}</td>
            <td>${t.destination_state}</td>
            <td>${t.destination_country}</td>
            <td>${t.duration_day}</td>
            <td>${t.duration_night}</td>
            <td>${t.price}</td>
            <td>${renderStars(t.avg_rating)} <span class="rating-count">(${t.num_rating})</span></td>
            <td>
                <div class="button-group">
                    <button class="btn-book" onclick="window.location.href='/booking?type=itinerary&itinerary_id=${encodeURIComponent(t.itinerary_id)}&user_id=${encodeURIComponent(user_id)}'">Book</button>
                    <button class="btn-show-reviews" data-itinerary-id="${t.itinerary_id}">Show Reviews</button>
                </div>
            </td>

        </tr>
        <tr class="reviews-row" id="reviews-${itineraryId}" style="display: none;">
            <td colspan="10"><div class="review-container">Loading...</div></td>
        </tr>`;
    });

    html += '</table>';
    container.innerHTML = html;

    document.querySelectorAll('.btn-show-reviews').forEach(button => {
        button.addEventListener('click', async () => {
            const itineraryId = button.dataset.itineraryId;
            const reviewRow = document.getElementById(`reviews-${itineraryId}`);
            const reviewContainer = reviewRow.querySelector('.review-container');

            // Toggle display
            if (reviewRow.style.display === 'none') {
                reviewRow.style.display = 'table-row';
                // If not already loaded, fetch reviews
                if (!reviewContainer.dataset.loaded) {
                    const res = await fetch('/api/get_reviews', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ item_id: itineraryId, item_type: 'Itinerary' })
                    });

                    const reviewsData = await res.json();

                    if (reviewsData.results.length) {
                        reviewContainer.innerHTML = reviewsData.results.map(review => {
                            return `
                              <div class="review-card">
                                ${review.comment}
                              </div>`;
                        }).join('');

                    } else {
                        reviewContainer.innerHTML = '<em>No reviews available.</em>';
                    }

                    reviewContainer.dataset.loaded = 'true';
                }
                button.textContent = 'Hide Reviews';
            } else {
                reviewRow.style.display = 'none';
                button.textContent = 'Show Reviews';
            }
        });
    });
});

function renderStars(rating) {
    const fullStar = '★';
    const emptyStar = '☆';
    const maxStars = 5;
    const rounded = Math.round(rating);
    return fullStar.repeat(rounded) + emptyStar.repeat(maxStars - rounded);
}
