const params = new URLSearchParams(window.location.search);
const trainId = params.get("trf_pkey");
const user_id = params.get("user_id");

async function loadBookingDetails() {
    if (!trainId) {
        document.getElementById("item-name").textContent = "No train selected.";
        return;
    }

    const res = await fetch(`/api/get_booking_details?trf_pkey=${trainId}`);
    const data = await res.json();

    if (data.error) {
        document.getElementById("item-name").textContent = "Error: " + data.error;
        return;
    }

    // Store item and price globally
    itemName = `${data.name} (${data.departure_location} → ${data.arrival_location})`;
    itemPrice = data.price;

    document.getElementById("item-name").innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <th style="text-align: left; padding: 8px;">Train Name</th>
            <td style="padding: 8px;">${data.name}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px;">Route</th>
            <td style="padding: 8px;">${data.departure_location} → ${data.arrival_location}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px;">Departure</th>
            <td style="padding: 8px;">${data.departure_date} at ${data.departure_time}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px;">Arrival</th>
            <td style="padding: 8px;">${data.arrival_date} at ${data.arrival_time}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px;">Travel Time</th>
            <td style="padding: 8px;">${data.travel_time_min} minutes</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px;">Available Seats</th>
            <td style="padding: 8px;">${data.available_seats}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px;">Price</th>
            <td style="padding: 8px;">₹${data.price.toFixed(2)}</td>
          </tr>
          
        </table>
      `;
}

loadBookingDetails();

function payNow() {
    if (!itemName || !itemPrice) {
        alert("Booking details not loaded yet.");
        return;
    }

    const encodedItem = encodeURIComponent(itemName);
    window.location.href = `/payment?item=${encodedItem}&price=${itemPrice}&user_id=${encodeURIComponent(user_id)}`;
}

function cancel() {
    window.history.back();
}