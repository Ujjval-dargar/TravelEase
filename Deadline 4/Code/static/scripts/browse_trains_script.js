

// --- Appended from HTML ---
const params = new URLSearchParams(window.location.search);
    const user_id = params.get("user_id");

    // Custom modal functions
    function showModal(title, message, type = 'success') {
      const modal = document.getElementById('modal');
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

    document.getElementById('train-search-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const dep_loc = document.getElementById('departure_location').value;
      const arr_loc = document.getElementById('arrival_location').value;
      const dep_date = document.getElementById('departure_date').value;

      try {
        const res = await fetch('/api/search_trains', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            departure_location: dep_loc, 
            arrival_location: arr_loc,
            departure_date: dep_date
          })
        });

        const data = await res.json();
        const container = document.getElementById('results-container');
        container.innerHTML = '';

        if (data.error) {
          container.innerHTML = `<p class="no-results">${data.error}</p>`;
          showModal('Error', data.error, 'error');
          return;
        }
        
        const trains = data.results;
        if (!trains || !trains.length) {
          container.innerHTML = `<p class="no-results">No trains found for this route and date.</p>`;
          showModal('No Results', 'No trains found for this route and date.', 'info');
          return;
        }

        // Build table
        let html = '<div class="table-container"><table><thead><tr>'
          + '<th>Train ID</th><th>Train Name</th>'
          + '<th>Departure</th><th>Arrival</th>'
          + '<th>From</th><th>To</th>'
          + '<th>Available Seats</th><th>Price (₹)</th>'
          + '<th>Actions</th>'
          + '</tr></thead><tbody>';
          
        trains.forEach(t => {
          html += `<tr>
                <td>${t.train_id}</td>
                <td>${t.name}</td>
                <td>${formatDateTime(t.departure_date, t.departure_time)}</td>
                <td>${formatDateTime(t.arrival_date, t.arrival_time)}</td>
                <td>${t.departure_location}</td>
                <td>${t.arrival_location}</td>
                <td>${t.available_seats}</td>
                <td>₹${t.price}</td>
                <td>
                  <button class="btn-book" onclick="bookTrain(${t.trf_pkey})">Book</button>
                </td>
              </tr>`;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
        
        showModal('Success', 'Search completed successfully!', 'success');
      } catch (error) {
        showModal('Error', 'An error occurred while searching for trains. Please try again.', 'error');
        console.error('Error:', error);
      }
    });

    // Helper function to format date and time
    function formatDateTime(date, time) {
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
      return `${formattedDate}<br>${time}`;
    }

    // Function to handle train booking
    function bookTrain(trf_pkey) {
      showModal('Booking', `Would you like to proceed with booking train #${trf_pkey}?`, 'info');
      
      // Replace modal actions with confirm/cancel
      const modalActions = document.querySelector('.modal-actions');
      modalActions.innerHTML = `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="confirmBooking(${trf_pkey})">Confirm</button>
      `;
    }

    // Function to confirm booking - redirects to booking page
    function confirmBooking(trf_pkey) {
      window.location.href = `/booking?type=train&trf_pkey=${encodeURIComponent(trf_pkey)}&user_id=${encodeURIComponent(user_id)}`;
    }