

// --- Appended from HTML ---
// Form display functions
function showAddForm() {
    document.getElementById("add-form").style.display = "block";
    document.getElementById("modify-form").style.display = "none";
}

function showModifyForm() {
    document.getElementById("modify-form").style.display = "block";
    document.getElementById("add-form").style.display = "none";
}

function closeModifyForm() {
    document.getElementById("modify-form").style.display = "none";
}

function closeAddForm() {
    document.getElementById("add-form").style.display = "none";
}

// Modal functions
        function showModal(title, message, type = 'success') {
            const modal = document.getElementById('modal');
            const modalOverlay = document.getElementById('modalOverlay');
            const modalTitle = document.getElementById('modalTitle');
            const modalContent = document.getElementById('modalContent');
            const modalIcon = document.getElementById('modalIcon');
            const modalActions = document.querySelector('.modal-actions');
            
            // Reset to single OK button for success/error messages
            modalActions.innerHTML = `
                <button class="btn btn-primary" onclick="closeModal()">OK</button>
            `;
            
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
            }
            
            modalOverlay.style.display = 'flex';
        }
        
        function closeModal() {
            document.getElementById('modalOverlay').style.display = 'none';
        }
        
        function showConfirmModal(message, onConfirm) {
            const modal = document.getElementById('modal');
            const modalOverlay = document.getElementById('modalOverlay');
            const modalTitle = document.getElementById('modalTitle');
            const modalContent = document.getElementById('modalContent');
            const modalIcon = document.getElementById('modalIcon');
            const modalActions = document.querySelector('.modal-actions');
            
            modalTitle.textContent = 'Confirm Action';
            modalContent.textContent = message;
            
            // Set warning icon
            modalIcon.className = 'modal-icon warning';
            modalIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>`;
            
            // Replace actions with confirm/cancel
            modalActions.innerHTML = `
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-danger" id="confirmBtn">Confirm</button>
            `;
            
            // Add confirm event
            document.getElementById('confirmBtn').addEventListener('click', function() {
                closeModal();
                onConfirm();
            });
            
            modalOverlay.style.display = 'flex';
        }
        
        // Form submission handlers
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById("hotel-form").addEventListener("submit", async function(e) {
                e.preventDefault();
                const formData = new FormData(this);
                const jsonData = Object.fromEntries(formData.entries());
            
                const res = await fetch('/api/add_hotel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jsonData)
                });
            
                const data = await res.json();
                if (data.success) {
                    showModal('Success', 'Hotel added successfully!', 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                } else {
                    showModal('Error', 'Failed to add hotel: ' + (data.error || 'Unknown error'), 'error');
                }
            });
        
            document.getElementById("modify-hotel-form").addEventListener("submit", async function (e) {
                e.preventDefault();
                const formData = new FormData(this);
                const jsonData = Object.fromEntries(formData.entries());
            
                const res = await fetch('/api/modify_hotel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jsonData)
                });
            
                const data = await res.json();
                if (data.success) {
                    showModal('Success', 'Hotel updated successfully!', 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                } else {
                    showModal('Error', 'Update failed: ' + (data.error || 'Unknown error'), 'error');
                }
            });
        });
        
        // Delete Hotel Function
        async function deleteHotel(hotel_id) {
            showConfirmModal("Are you sure you want to delete this hotel?", async function() {
                const res = await fetch('/api/delete_hotel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ hotel_id: hotel_id })
                });
            
                const data = await res.json();
                if (data.success) {
                    showModal('Success', 'Hotel deleted successfully.', 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                } else {
                    showModal('Error', 'Cannot be deleted due to active booking.', 'error');
                }
            });
        }