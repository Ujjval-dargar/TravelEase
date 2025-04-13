from flask import *
import mysql.connector


from datetime import datetime, time, timedelta


def format_time_field(value):
    if isinstance(value, (datetime, time)):
        return value.strftime('%H:%M:%S')
    elif isinstance(value, timedelta):
        total_seconds = int(value.total_seconds())
        hours, remainder = divmod(total_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"{hours:02}:{minutes:02}:{seconds:02}"
    else:
        return str(value)


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
    user_type = data.get('userType')

    if not name or not password or not email:
        return jsonify({'success': False, 'error': 'Missing fields'}), 400

    parts = name.strip().split(' ', 1)
    first_name = parts[0]
    last_name = parts[1] if len(parts) > 1 else ''

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        if (user_type == "customer"):
            cursor.execute("""
                INSERT INTO Customer (first_name, last_name, email, password)
                VALUES (%s, %s, %s, %s)
            """, (first_name, last_name, email, password))

        elif (user_type == "T_transport"):
            cursor.execute("""
                INSERT INTO TransportProvider (name, email, password, service_type)
                VALUES (%s, %s, %s, %s)
            """, (name.strip(), email, password, "Train"))

        elif (user_type == "A_transport"):
            cursor.execute("""
                INSERT INTO TransportProvider (name, email, password, service_type)
                VALUES (%s, %s, %s, %s)
            """, (name.strip(), email, password, "Airplane"))

        elif (user_type == "hotel"):
            cursor.execute("""
                INSERT INTO AccommodationProvider (name, email, password)
                VALUES (%s, %s, %s)
            """, (name.strip(), email, password))

        # elif (user_type == "agency"):
        #     cursor.execute("""
        #         INSERT INTO TourismAgency (name, email, password)
        #         VALUES (%s, %s, %s)
        #     """, (name.strip(), email, password))
        
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
    user_type = data.get('userType')  # customer | T_transport | A_transport | agency | hotel

    app.logger.debug(
        f"Signin attempt: email={email!r}, user_type={user_type!r}")

    table_map = {
        'customer':  ('Customer',         'customer_id',    'profile'),
        'A_transport': ('TransportProvider', 'provider_id',    'A_transport_profile'),
        'T_transport': ('TransportProvider', 'provider_id',    'T_transport_profile'),
        'hotel':     ('HotelProvider',    'hotel_id',       'hotel_profile'),
        # 'agency':    ('TourismAgency',    'agency_id',      'agency_profile'),
    }

    if user_type not in table_map:
        return jsonify({'success': False, 'error': 'Invalid user type'}), 400

    table, pk_field, profile_endpoint = table_map[user_type]

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        query = f"SELECT * FROM {table} WHERE email=%s AND password=%s"
        cursor.execute(query, (email, password))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if not user:
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

        # Normalize param name: always use 'user_id' for the customer profile route
        if user_type == 'customer':
            redirect_url = url_for(profile_endpoint, user_id=user[pk_field])
        else:
            redirect_url = url_for(profile_endpoint, **
                                   {pk_field: user[pk_field]})

        return jsonify({'success': True, 'redirect': redirect_url})

    except mysql.connector.Error as err:
        app.logger.error(f"MySQL error on signin: {err}")
        return jsonify({'success': False, 'error': 'Server error'}), 500


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


@app.route('/transport_profile')
def transport_profile():
    provider_id = request.args.get('provider_id', type=int)
    print("hello")


@app.route('/agency_profile')
def agency_profile():
    agency_id = request.args.get('agency_id', type=int)
    # fetch from TourismAgency table...
    # render templates/agency_profile.html
    ...


@app.route('/hotel_profile')
def hotel_profile():
    hotel_id = request.args.get('hotel_id', type=int)
    # fetch from HotelProvider table...
    # render templates/hotel_profile.html
    ...


@app.route('/browse_itinerary')
def browse_itinerary():
    return render_template('browse_itinerary.html')


@app.route('/browse_trains')
def browse_trains():
    user_id = request.args.get('user_id', type=int)
    return render_template('browse_trains.html',user_id=user_id)


@app.route('/browse_airplanes')
def browse_airplanes():
    user_id = request.args.get('user_id', type=int)
    return render_template('browse_airplanes.html',user_id=user_id)


@app.route('/browse_hotels')
def browse_hotels():
    return render_template('browse_hotels.html')


@app.route('/api/search_trains', methods=['POST'])
def api_search_trains():

    data = request.get_json()
    dep_loc = data.get('departure_location')
    arr_loc = data.get('arrival_location')
    dep_date = data.get('departure_date')  # 'YYYY-MM-DD'

    if not all([dep_loc, arr_loc, dep_date]):
        return jsonify({'error': 'Missing fields'}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT
              train_id,
              route_id,
              trf_pkey,
              price,
              available_seats,
              arrival_time,
              arrival_date,
              departure_time,
              departure_date,
              arrival_location,
              departure_location,
              name,
              capacity,
              provider_id,
              TIMESTAMPDIFF(
                MINUTE,
                CONCAT(departure_date, ' ', departure_time),
                CONCAT(arrival_date,   ' ', arrival_time)
              ) AS travel_time_min
            FROM T_Route_Follows
            NATURAL JOIN TrainRoute
            NATURAL JOIN Train
            WHERE departure_date = %s
              AND departure_location = %s
              AND arrival_location   = %s
        """
        cursor.execute(query, (dep_date, dep_loc, arr_loc))
        raw_results = cursor.fetchall()
        cursor.close()
        conn.close()

        results = []
        for row in raw_results:

            # Later in your route when building the result:
            results.append({
                'train_id': row['train_id'],
                'name': row['name'],
                'departure_location': row['departure_location'],
                'arrival_location': row['arrival_location'],
                'departure_date': str(row['departure_date']),
                'arrival_date': str(row['arrival_date']),
                'departure_time': format_time_field(row['departure_time']),
                'arrival_time': format_time_field(row['arrival_time']),
                'travel_time_min': row['travel_time_min'],
                'available_seats': row['available_seats'],
                'price': row['price'],
            })

        return jsonify({'results': results})

    except mysql.connector.Error as err:
        app.logger.error(f"Train search error: {err}")
        return jsonify({'error': 'Server error'}), 500
    

@app.route('/api/search_airplanes', methods=['POST'])
def api_search_airplanes():

    data = request.get_json()
    dep_loc = data.get('departure_location')
    arr_loc = data.get('arrival_location')
    dep_date = data.get('departure_date')  # 'YYYY-MM-DD'

    if not all([dep_loc, arr_loc, dep_date]):
        return jsonify({'error': 'Missing fields'}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT
              airplane_id,
              route_id,
              arf_pkey,
              price,
              available_seats,
              arrival_time,
              arrival_date,
              departure_time,
              departure_date,
              arrival_location,
              departure_location,
              name,
              capacity,
              provider_id,
              TIMESTAMPDIFF(
                MINUTE,
                CONCAT(departure_date, ' ', departure_time),
                CONCAT(arrival_date,   ' ', arrival_time)
              ) AS travel_time_min
            FROM A_Route_Follows
            NATURAL JOIN AirplaneRoute
            NATURAL JOIN Airplane
            WHERE departure_date = %s
              AND departure_location = %s
              AND arrival_location   = %s
        """
        cursor.execute(query, (dep_date, dep_loc, arr_loc))
        raw_results = cursor.fetchall()
        cursor.close()
        conn.close()

        results = []
        for row in raw_results:

            # Later in your route when building the result:
            results.append({
                'airplane_id': row['airplane_id'],
                'name': row['name'],
                'departure_location': row['departure_location'],
                'arrival_location': row['arrival_location'],
                'departure_date': str(row['departure_date']),
                'arrival_date': str(row['arrival_date']),
                'departure_time': format_time_field(row['departure_time']),
                'arrival_time': format_time_field(row['arrival_time']),
                'travel_time_min': row['travel_time_min'],
                'available_seats': row['available_seats'],
                'price': row['price'],
            })

        return jsonify({'results': results})

    except mysql.connector.Error as err:
        app.logger.error(f"Airplane search error: {err}")
        return jsonify({'error': 'Server error'}), 500

if __name__ == '__main__':
    app.run(debug=True)
