// Extract item from URL
const params = new URLSearchParams(window.location.search);
const type=params.get("type");
const item = params.get("item");
const count = params.get("ticketcount");
const price = params.get("price");
const user_id = params.get("user_id");
const id=params.get("id");
const from_date=params.get("from_date");
const to_date=params.get("to_date");
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
    console.log(type);
    const paymentData = {
        id:id,
        user_id: user_id,
        amount: price,
        payment_method: method,
        payment_status: 'Confirmed', // In real case, this should be dynamic based on payment gateway response
        transport_type: type, // You can update the type of booking dynamically
        count:count,
        status: 'Confirmed', // Status of booking
        booking_date: new Date().toISOString().split('T')[0], // current date in 'YYYY-MM-DD' format
        from_date : from_date,
        to_date : to_date
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

// --- Appended from HTML ---
// Override the alert function without modifying the JS file
    window.alert = function(message) {
      document.getElementById('popup-message').textContent = message;
      document.getElementById('popup').classList.add('active');
      
      // Make the OK button close the popup and redirect if necessary
      const popupBtn = document.getElementById('popup-btn');
      popupBtn.onclick = function() {
        document.getElementById('popup').classList.remove('active');
        
        // Check if this is a success message that should trigger navigation
        if (message.includes('Payment confirmed')) {
          // Allow the popup to close before navigating
          setTimeout(function() {
            const user_id = new URLSearchParams(window.location.search).get("user_id");
            window.location.href = '/profile?user_id=${user_id}';
          }, 300);
        }
      };
    };
    
    // Function for applying coupons (placeholder)
    function applyCoupon() {
      const couponCode = document.getElementById('coupon-code').value;
      if (couponCode) {
        document.getElementById('coupon-message').textContent = "Coupon applied successfully!";
        
        // In a real implementation, you would validate the coupon with the server
        // and update the price accordingly
      } else {
        document.getElementById('coupon-message').textContent = "Please enter a coupon code.";
        document.getElementById('coupon-message').style.color = "#e74c3c";
      }
    }