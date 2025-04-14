

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

    document.getElementById('itinerary-search-form').addEventListener('submit', async function (e) {
      e.preventDefault();
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
        const container = document.getElementById('results-container');
        container.innerHTML = '';
        
        if (data.error) {
          container.innerHTML = `<p class="no-results">${data.error}</p>`;
          showModal('Error', data.error, 'error');
          return;
        }
        
        const itineraries = data.results;
        if (!itineraries || !itineraries.length) {
          container.innerHTML = `<p class="no-results">No itineraries found for this location.</p>`;
          showModal('No Results', 'No itineraries found for this location.', 'info');
          return;
        }
        
        // Build table
        let html = '<div class="table-container"><table><thead><tr>'
          + '<th>Description</th>'
          + '<th>Location</th>'
          + '<th>Duration</th>'
          + '<th>Nights</th>'
          + '<th>Price</th>'
          + '<th>Actions</th>'
          + '</tr></thead><tbody>';
          
        itineraries.forEach(t => {
          html += `<tr>
            <td>${t.description}</td>
            <td>${t.destination_city}, ${t.destination_state}, ${t.destination_country}</td>
            <td>${t.duration_day} days, ${t.duration_night} nights</td>
            <td>₹${t.price}</td>
            <td>
              <a href="/booking?type=itinerary&itinerary_id=${encodeURIComponent(t.itinerary_id)}&user_id=${encodeURIComponent(user_id)}" class="btn-book">Book</a>
            </td>
          </tr>`;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
        
        showModal('Success', 'Search completed successfully!', 'success');
      } catch (error) {
        console.error('Error:', error);
        showModal('Error', 'An error occurred while searching for itineraries. Please try again.', 'error');
      }
    });