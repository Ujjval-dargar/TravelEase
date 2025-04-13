// Extract item from URL
const params = new URLSearchParams(window.location.search);
const type=params.get("type");
const item = params.get("item");
const count = params.get("ticketcount");
const price = params.get("price");
const user_id = params.get("user_id");
const id=params.get("id");
if (!(item && price)) {
    document.getElementById("item-name").innerHTML = "No item specified";
}

document.getElementById("item-name").innerHTML = `
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <th style="text-align: left; padding: 8px;">Item</th>
        <td style="padding: 8px;">${item}</td>
      </tr>
      <tr>
        <th style="text-align: left; padding: 8px;">Price</th>
        <td style="padding: 8px;">${price}</td>
      </tr>
    </table>
  `;

async function confirmPayment() {
    const method = document.querySelector('input[name="method"]:checked').value;
    // Here you could redirect to a real payment gateway
    // Prepare the payment data to send to the backend
    const paymentData = {
        id:id,
        user_id: user_id,
        amount: price,
        payment_method: method,
        payment_status: 'Confirmed', // In real case, this should be dynamic based on payment gateway response
        transport_type: type, // You can update the type of booking dynamically
        count:count,
        status: 'Confirmed', // Status of booking
        booking_date: new Date().toISOString().split('T')[0] // current date in 'YYYY-MM-DD' format
    };
    
    // Send payment details to the backend to insert into the database
    try {
        const response = await fetch('/api/confirm_payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData),
        });

        const result = await response.json();
        console.log(result);
        if (result.success) {
            alert(`Payment confirmed for "${item}" via ${method.toUpperCase()}`);
            window.location.href = `/profile?user_id=${user_id}`;
        } else {
            alert('Payment failed, please try again.');
        }
    } catch (error) {
        alert('Error processing payment. Please try again.');
    }


    // window.location.href = `/profile?user_id=${user_id}`;
}

function cancel() {
    window.history.back(); // Or use: window.location.href = "booking.html";
}