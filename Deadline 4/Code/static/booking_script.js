const params = new URLSearchParams(window.location.search);
const type = params.get("type");
const countLabel = document.getElementById("count-label");


if (countLabel) {
  if (type === "hotel") {
    countLabel.textContent = "Number of Rooms";
  } else if (type=="itinerary"){
    countLabel.remove();
    document.getElementById("count").remove()
  } else{
    countLabel.textContent = "Number of Tickets";
  }
}

if (type == "train") {
  const trainId = params.get("trf_pkey");
  const user_id = params.get("user_id");

  async function loadBookingDetails() {
    if (!trainId) {
      document.getElementById("item-name").textContent = "No train selected.";
      return;
    }

    const res = await fetch(`/api/tget_booking_details?trf_pkey=${trainId}`);
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
            <th style="text-align: left; padding: 8px;">Price / Ticket</th>
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
    const ticketCount = document.getElementById("count").value;
    const encodedItem = encodeURIComponent(itemName);
    window.location.href = `/payment?type=train&item=${encodedItem}&price=${itemPrice*parseInt(ticketCount)}&id=${trainId}&ticketcount=${ticketCount}&user_id=${encodeURIComponent(user_id)}`;
  }

  function cancel() {
    window.history.back();
  }
}

if (type == "airplane") {

  const airplaneId = params.get("arf_pkey");
  const user_id = params.get("user_id");

  async function loadBookingDetails() {
    if (!airplaneId) {
      document.getElementById("item-name").textContent = "No Airplane selected.";
      return;
    }

    const res = await fetch(`/api/aget_booking_details?arf_pkey=${airplaneId}`);
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
            <th style="text-align: left; padding: 8px;">Airplane Name</th>
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
            <th style="text-align: left; padding: 8px;">Price / Ticket</th>
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
    const ticketCount = document.getElementById("count").value;
    const encodedItem = encodeURIComponent(itemName);
    window.location.href = `/payment?type=airplane&item=${encodedItem}&price=${itemPrice*parseInt(ticketCount)}&id=${airplaneId}&ticketcount=${ticketCount}&user_id=${encodeURIComponent(user_id)}`;
  }

  function cancel() {
    window.history.back();
  }
}
if (type == "hotel") {
  const hotel_id = params.get("hotel_id");
  const user_id = params.get("user_id");
  const from_date=params.get("from_date");
  const to_date=params.get("to_date");

  async function loadBookingDetails() {
    if (!hotel_id) {
      document.getElementById("item-name").textContent = "No Hotel selected.";
      return;
    }

    const res = await fetch(`/api/hget_booking_details?hotel_id=${hotel_id}`);
    const data = await res.json();

    if (data.error) {
      document.getElementById("item-name").textContent = "Error: " + data.error;
      return;
    }

    // Store item and price globally
    itemName = `${data.name}`;
    itemPrice = data.price;
    itemDest=data.location;
    itemdes = `${data.hotel_description}`;
    document.getElementById("item-name").innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <th style="text-align: left; padding: 8px;">Hotel Name</th>
            <td style="padding: 8px;">${data.name}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px;">Hotel Description</th>
            <td style="padding: 8px;">${data.hotel_description}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px;">Location</th>
            <td style="padding: 8px;">${data.location}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px;">Price</th>
            <td style="padding: 8px;">${data.price}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px;">From Date</th>
            <td style="padding: 8px;">${from_date}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px;">To Date</th>
            <td style="padding: 8px;">${to_date}</td>
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
    const roomcount = document.getElementById("count").value;
    const encodedItem = encodeURIComponent(itemName);
    window.location.href = `/payment?type=hotel&item=${encodedItem}&price=${itemPrice*parseInt(roomcount)}&id=${hotel_id}&from_date=${from_date}&to_date=${to_date}&ticketcount=${roomcount}&user_id=${encodeURIComponent(user_id)}`;
  }

  function cancel() {
    window.history.back();
  }
}

if (type == "itinerary") {
  const itinerary_id = params.get("itinerary_id");
  const user_id = params.get("user_id");
  
  
  async function loadBookingDetails() {
    if (!itinerary_id) {
      document.getElementById("item-name").textContent = "No Itinerary selected.";
      return;
    }

    const res = await fetch(`/api/iget_booking_details?itinerary_id=${itinerary_id}`);
    const data = await res.json();

    if (data.error) {
      document.getElementById("item-name").textContent = "Error: " + data.error;
      return;
    }

    // Store item and price globally
    itemName = `${data.description}`;
    itemPrice = data.price;
    itemDest=data.destination_city;
    itemday=data.duration_day;

    document.getElementById("item-name").innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <th style="text-align: left; padding: 8px;">Itnerary Description</th>
            <td style="padding: 8px;">${data.description}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px;">Destination City</th>
            <td style="padding: 8px;">${data.destination_city}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px;">Duration</th>
            <td style="padding: 8px;">${data.duration_day}
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px;">Price</th>
            <td style="padding: 8px;">${data.price}</td>
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
    window.location.href = `/payment?type=Itinerary&item=${encodedItem}&price=${itemPrice}&id=${itinerary_id}&ticketcount=${1}&user_id=${encodeURIComponent(user_id)}`;
  }

  function cancel() {
    window.history.back();
  }
}
