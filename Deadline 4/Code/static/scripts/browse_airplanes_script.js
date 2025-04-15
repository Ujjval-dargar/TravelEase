const params = new URLSearchParams(window.location.search);
const user_id = params.get("user_id");

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

// Mobile toggle functionality
document.getElementById('sidebarToggle')?.addEventListener('click', function() {
    document.querySelector('.sidebar').classList.toggle('show');
});

// Set today's date as the minimum date for the date picker
document.addEventListener('DOMContentLoaded', function() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('departure_date').min = today;
  document.getElementById('departure_date').value = today;
});

function showModal(title, message, type = 'success') {
  const modal = document.getElementById('modal');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');
  const modalIcon = document.getElementById('modalIcon');
  
  modalTitle.textContent = title;
  modalContent.textContent = message;
  
  // Set icon class based on type
  modalIcon.className = 'modal-icon ' + type;
  
  if (type === 'success') {
    modalIcon.innerHTML = `<i class="fas fa-check-circle"></i>`;
  } else if (type === 'error') {
    modalIcon.innerHTML = `<i class="fas fa-times-circle"></i>`;
  } else if (type === 'warning') {
    modalIcon.innerHTML = `<i class="fas fa-exclamation-triangle"></i>`;
  } else if (type === 'info') {
    modalIcon.innerHTML = `<i class="fas fa-info-circle"></i>`;
  }
  
  modalOverlay.style.display = 'flex';
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

document.getElementById('airplane-search-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const dep_loc = document.getElementById('departure_location').value;
  const arr_loc = document.getElementById('arrival_location').value;
  const dep_date = document.getElementById('departure_date').value;
  
  const container = document.getElementById('results-container');
  container.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Searching for airplanes...</p>
    </div>
  `;
  
  try {
    const res = await fetch('/api/search_airplanes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        departure_location: dep_loc,
        arrival_location: arr_loc,
        departure_date: dep_date
      })
    });
    
    const data = await res.json();
    container.innerHTML = '';
    
    if (data.error) {
      container.innerHTML = `<p class="no-results">${data.error}</p>`;
      showModal('Error', data.error, 'error');
      return;
    }
    
    const airplanes = data.results;
    if (!airplanes || !airplanes.length) {
      container.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
          <p>No airplanes found for this route and date.</p>
          <p>Try different locations or dates.</p>
        </div>
      `;
      showModal('No Results', 'No airplanes found for this route and date.', 'info');
      return;
    }
    
    let html = `
      <h2 class="results-title">${airplanes.length} Airplanes Found</h2>
      <p class="results-subtitle">From ${dep_loc} to ${arr_loc} on ${formatDateForDisplay(dep_date)}</p>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Airplane</th>
              <th>Departure</th>
              <th>Arrival</th>
              <th>From</th>
              <th>To</th>
              <th>Seats</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    airplanes.forEach(a => {
      html += `
        <tr>
          <td>
            <div class="airplane-info">
              <div class="airplane-id">${a.airplane_id}</div>
              <div class="airplane-name">${a.name}</div>
            </div>
          </td>
          <td>${formatDateTime(a.departure_date, a.departure_time)}</td>
          <td>${formatDateTime(a.arrival_date, a.arrival_time)}</td>
          <td>${a.departure_location}</td>
          <td>${a.arrival_location}</td>
          <td>${a.available_seats}</td>
          <td>₹${a.price}</td>
          <td>
            <button class="btn-book" onclick="bookAirplane(${a.arf_pkey})">
              <i class="fas fa-ticket-alt"></i> Book
            </button>
          </td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    
    container.innerHTML = html;
    
    // Style results title and subtitle
    document.querySelector('.results-title').style.cssText = `
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--primary-dark);
    `;
    document.querySelector('.results-subtitle').style.cssText = `
      color: var(--text-muted);
      margin-bottom: 1rem;
      font-size: 0.95rem;
    `;
    
    // Style airplane info cells
    const airplaneInfoCells = document.querySelectorAll('.airplane-info');
    airplaneInfoCells.forEach(cell => {
      cell.style.cssText = `
        display: flex;
        flex-direction: column;
      `;
      cell.querySelector('.airplane-id').style.cssText = `
        font-weight: 600;
        color: var(--primary-dark);
      `;
      cell.querySelector('.airplane-name').style.cssText = `
        font-size: 0.9rem;
        color: var(--text-muted);
      `;
    });
    
    showModal('Success', 'Search completed successfully!', 'success');
  } catch (error) {
    showModal('Error', 'An error occurred while searching for airplanes. Please try again.', 'error');
    console.error('Error:', error);
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--danger); margin-bottom: 1rem;"></i>
        <p>An error occurred while searching for airplanes.</p>
        <p>Please try again later.</p>
      </div>
    `;
  }
});

function formatDateTime(date, time) {
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('en-US', { 
    day: 'numeric', month: 'short', year: 'numeric' 
  });
  return `
    <div class="datetime">
      <div class="date">${formattedDate}</div>
      <div class="time">${time}</div>
    </div>
  `;
}

function formatDateForDisplay(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });
}

function bookAirplane(arf_pkey) {
  showModal('Booking Confirmation', `Would you like to proceed with booking this airplane?`, 'info');
  
  const modalActions = document.querySelector('.modal-actions');
  modalActions.innerHTML = `
    <button class="btn btn-secondary" onclick="closeModal()">
      <i class="fas fa-times"></i> Cancel
    </button>
    <button class="btn btn-primary" onclick="confirmBooking(${arf_pkey})">
      <i class="fas fa-check"></i> Confirm
    </button>
  `;
}

function confirmBooking(arf_pkey) {
  window.location.href = `/booking?type=airplane&arf_pkey=${encodeURIComponent(arf_pkey)}&user_id=${encodeURIComponent(user_id)}`;
}
