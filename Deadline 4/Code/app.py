from flask import *
import mysql.connector


app = Flask(__name__)

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Ujjval@2005',
    'database': 'TravelEase'
}

@app.route('/')
def login_page():
    return render_template('login.html')

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not password or not email:
        return jsonify({'success': False, 'error': 'Missing fields'}), 400

    parts = name.strip().split(' ', 1)
    first_name = parts[0]
    last_name = parts[1] if len(parts) > 1 else ''

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Customer (first_name, last_name, email, password)
            VALUES (%s, %s, %s, %s)
        """, (first_name, last_name, email, password))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True})
    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': str(err)}), 500


@app.route('/signin', methods=['POST'])
def signin():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM Customer WHERE email=%s AND password=%s",
            (email, password)
        )
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user:
            # instead of returning JSON, redirect to profile page
            return jsonify({'success': True, 'redirect': url_for('profile', user_id=user['customer_id'])})
        else:
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
    except mysql.connector.Error as err:
        return jsonify({'success': False, 'error': str(err)}), 500

@app.route('/profile')
def profile():
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return redirect(url_for('login_page'))

    # 1) Fetch customer
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM Customer WHERE customer_id=%s",
            (user_id,)
        )
        user = cursor.fetchone()
        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        app.logger.error(f"Error fetching customer {user_id}: {err}")
        return "Internal Server Error", 500

    if not user:
        return "User not found", 404

    # 2) Fetch bookings + payment info
    bookings = []
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
              b.booking_id,
              b.transport_type,
              b.status,
              b.booking_date,
              p.amount,
              p.payment_status,
              p.payment_method,
              b.coupon_code
            FROM Booking b
            JOIN Payment p ON b.payment_id = p.payment_id
            WHERE b.customer_id = %s
            ORDER BY b.booking_date DESC
        """, (user_id,))
        bookings = cursor.fetchall()
        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        app.logger.warning(f"Could not fetch bookings for {user_id}: {err}")

    return render_template('profile.html',
                           customer=user,
                           bookings=bookings)



if __name__ == '__main__':
    app.run(debug=True)
