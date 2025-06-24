// Get URL parameters
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
  
  // Set icon class based on type
  modalIcon.className = 'modal-icon ' + type;
  
  // Show different icon based on type
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

  // Set default date to today
  document.getElementById('departure_date').value = today;
});

// Form submission handler
document.getElementById('train-search-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  
  const dep_loc = document.getElementById('departure_location').value;
  const arr_loc = document.getElementById('arrival_location').value;
  const dep_date = document.getElementById('departure_date').value;
  
  // Show loading indicator in results container
  const container = document.getElementById('results-container');
  container.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Searching for trains...</p>
    </div>
  `;

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
    container.innerHTML = '';

    if (data.error) {
      container.innerHTML = `<p class="no-results">${data.error}</p>`;
      showModal('Error', data.error, 'error');
      return;
    }
    
    const trains = data.results;
    if (!trains || !trains.length) {
      container.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
          <p>No trains found for this route and date.</p>
          <p>Try different locations or dates.</p>
        </div>`;
      showModal('No Results', 'No trains found for this route and date.', 'info');
      return;
    }

    // Build table
    let html = `
      <h2 class="results-title">${trains.length} Trains Found</h2>
      <p class="results-subtitle">From ${dep_loc} to ${arr_loc} on ${formatDateForDisplay(dep_date)}</p>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Train</th>
              <th>Departure</th>
              <th>Arrival</th>
              <th>From</th>
              <th>To</th>
              <th>Seats</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>`;
          
    trains.forEach(t => {
      html += `
        <tr>
          <td>
            <div class="train-info">
              <div class="train-id">${t.train_id}</div>
              <div class="train-name">${t.name}</div>
            </div>
          </td>
          <td>${formatDateTime(t.departure_date, t.departure_time)}</td>
          <td>${formatDateTime(t.arrival_date, t.arrival_time)}</td>
          <td>${t.departure_location}</td>
          <td>${t.arrival_location}</td>
          <td>${t.available_seats}</td>
          <td>₹${t.price}</td>
          <td>
            <button class="btn-book" onclick="bookTrain(${t.trf_pkey})">
              <i class="fas fa-ticket-alt"></i> Book
            </button>
          </td>
        </tr>`;
    });
    
    html += `
          </tbody>
        </table>
      </div>`;
    
    container.innerHTML = html;
    
    // Add styling to the results title
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
    
    // Add styling to train info
    const trainInfoCells = document.querySelectorAll('.train-info');
    trainInfoCells.forEach(cell => {
      cell.style.cssText = `
        display: flex;
        flex-direction: column;
      `;
      
      cell.querySelector('.train-id').style.cssText = `
        font-weight: 600;
        color: var(--primary-dark);
      `;
      
      cell.querySelector('.train-name').style.cssText = `
        font-size: 0.9rem;
        color: var(--text-muted);
      `;
    });
    
    showModal('Success', 'Search completed successfully!', 'success');
  } catch (error) {
    showModal('Error', 'An error occurred while searching for trains. Please try again.', 'error');
    console.error('Error:', error);
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--danger); margin-bottom: 1rem;"></i>
        <p>An error occurred while searching for trains.</p>
        <p>Please try again later.</p>
      </div>`;
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
  
  return `
    <div class="datetime">
      <div class="date">${formattedDate}</div>
      <div class="time">${time}</div>
    </div>`;
}

// Helper function to format date for display in subtitle
function formatDateForDisplay(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

// Function to handle train booking
function bookTrain(trf_pkey) {
  showModal('Booking Confirmation', `Would you like to proceed with booking this train?`, 'info');
  
  // Replace modal actions with confirm/cancel
  const modalActions = document.querySelector('.modal-actions');
  modalActions.innerHTML = `
    <button class="btn btn-secondary" onclick="closeModal()">
      <i class="fas fa-times"></i> Cancel
    </button>
    <button class="btn btn-primary" onclick="confirmBooking(${trf_pkey})">
      <i class="fas fa-check"></i> Confirm
    </button>
  `;
}

// Function to confirm booking - redirects to booking page
function confirmBooking(trf_pkey) {
  window.location.href = `/booking?type=train&trf_pkey=${encodeURIComponent(trf_pkey)}&user_id=${encodeURIComponent(user_id)}`;
}

// Add CSS for loading spinner
document.addEventListener('DOMContentLoaded', function() {
  const style = document.createElement('style');
  style.textContent = `
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      background-color: var(--bg-card);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
    }
    
    .loading-spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top: 4px solid var(--primary);
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .datetime {
      display: flex;
      flex-direction: column;
    }
    
    .date {
      font-weight: 500;
    }
    
    .time {
      color: var(--text-muted);
      font-size: 0.9rem;
    }
  `;
  document.head.appendChild(style);
});