const params = new URLSearchParams(window.location.search);
    const user_id = params.get("user_id");

    document.getElementById('train-search-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const dep_loc = document.getElementById('departure_location').value;
      const arr_loc = document.getElementById('arrival_location').value;
      const dep_date = document.getElementById('departure_date').value;

      const res = await fetch('/api/search_trains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departure_location: dep_loc, arrival_location: arr_loc, departure_date: dep_date })
      });

      const data = await res.json();
      const container = document.getElementById('results-container');
      container.innerHTML = '';

      if (data.error) {
        container.innerHTML = `<p class="no-results">${data.error}</p>`;
        return;
      }
      const trains = data.results;
      if (!trains.length) {
        container.innerHTML = `<p class="no-results">No trains found.</p>`;
        return;
      }

      // Build table
      let html = '<table><tr>'
        + '<th>Train ID</th><th>Route</th><th>Train Name</th>'
        + '<th>Departure</th><th>Arrival</th><th>Travel Time (min)</th>'
        + '<th>Price</th>'
        + '<th>Actions</th>'
        + '</tr>';
        
      trains.forEach(t => {
        html += `<tr>
          <td>${t.train_id}</td>
          <td>${t.departure_location} → ${t.arrival_location}</td>
          <td>${t.name}</td>
          <td>${t.departure_date} ${t.departure_time}</td>
          <td>${t.arrival_date} ${t.arrival_time}</td>
          <td>${t.travel_time_min}</td>
          <td>${t.price}</td>
          <td>
            <div class="button-group">
              <button class="btn-book" onclick="window.location.href='/booking?type=train&trf_pkey=${encodeURIComponent(t.trf_pkey)}&user_id=${encodeURIComponent(user_id)}'">Book</button></td>
            </div>
        </tr>`;

      });
      html += '</table>';
      container.innerHTML = html;

    });