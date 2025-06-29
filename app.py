from flask import *
import mysql.connector

from datetime import datetime, date, timedelta,time
from decimal import Decimal


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

# Convert non-serializable types to JSON-serializable
def serialize_record(record):
    return {
        key: (value.total_seconds() // 60 if isinstance(value, timedelta) else
              value.isoformat() if isinstance(value, (datetime, date)) else
              float(value) if isinstance(value, Decimal) else
              value)
        for key, value in record.items()
    }

app = Flask(__name__)

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
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

        elif (user_type == "agency"):
            cursor.execute("""
                INSERT INTO TourismAgency (name, email, password)
                VALUES (%s, %s, %s)
            """, (name.strip(), email, password))

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

    # customer | T_transport | A_transport | agency | hotel
    user_type = data.get('userType')

    app.logger.debug(
        f"Signin attempt: email={email!r}, user_type={user_type!r}")

    table_map = {
        'customer':  ('Customer',         'customer_id',    'profile'),
        'A_transport': ('TransportProvider', 'provider_id',    'A_transport_profile'),
        'T_transport': ('TransportProvider', 'provider_id',    'T_transport_profile'),
        'hotel':     ('AccommodationProvider',    'provider_id',       'hotel_profile'),
        'agency':    ('TourismAgency',    'agency_id',      'agency_profile'),
    }  

    if user_type not in table_map:
        return jsonify({'success': False, 'error': 'Invalid user type'}), 400

    table, pk_field, profile_endpoint = table_map[user_type]

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        query = f"SELECT * FROM {table} WHERE email=%s AND password=%s"
        if user_type=='A_transport':
            query = query + " AND service_type='Airplane'"
        elif user_type=='T_transport':
            query = query + " AND service_type='Train'"
        cursor.execute(query, (email, password))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if not user:
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

        # Normalize param name: always use 'user_id' for the customer profile route
        redirect_url = url_for(profile_endpoint, user_id=user[pk_field])

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

@app.route('/api/booking_full_details', methods=['GET'])
def get_booking_full_details():
    booking_id = request.args.get('booking_id')
    if not booking_id:
        return jsonify({'success': False, 'error': 'No booking_id provided'}), 400

    conn = mysql.connector.connect(**db_config)
    if conn is None:
        return jsonify({'success': False, 'error': 'Database connection error'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # First, get the transport type from the Booking table.
        transport_query = "SELECT transport_type FROM Booking WHERE booking_id = %s"
        cursor.execute(transport_query, (booking_id,))
        booking = cursor.fetchone()

        if not booking:
            return jsonify({'success': False, 'error': 'Booking not found'}), 404

        transport_type = booking['transport_type']
        details = None

        # Execute the detailed query based on the transport type.
        if transport_type == 'Airplane':
            query = """
                SELECT 
                    Booking_id,
                    name,
                    arrival_time,
                    arrival_date,
                    arrival_location,
                    departure_time,
                    departure_date,
                    departure_location,
                    tickets_booked,
                    coupon_code,
                    status,
                    booking_date,
                    TIMESTAMPDIFF ( minute, CONCAT(departure_date, " ", departure_time), CONCAT(arrival_date, " ", arrival_time) ) AS travel_time_min
                FROM A_Route_Follows 
                NATURAL JOIN A_Book_Includes 
                NATURAL JOIN AirplaneRoute 
                NATURAL JOIN Airplane
                NATURAL JOIN Booking
                    WHERE Booking_ID = %s
            """
            cursor.execute(query, (booking_id,))
            details = cursor.fetchall()

        elif transport_type == 'Train':
            query = """
                SELECT 
                    Booking_id,
                    name,
                    arrival_location,
                    arrival_time,
                    arrival_date,
                    departure_location,
                    departure_time,
                    departure_date,
                    tickets_booked,
                    coupon_code,
                    status,
                    booking_date,
                    TIMESTAMPDIFF ( minute, CONCAT(departure_date, " ", departure_time), CONCAT(arrival_date, " ", arrival_time) ) AS travel_time_min
                FROM T_Route_Follows 
                NATURAL JOIN T_Book_Includes 
                NATURAL JOIN TrainRoute 
                NATURAL JOIN Train
                NATURAL JOIN Booking
                    WHERE Booking_ID = %s
            """
            cursor.execute(query, (booking_id,))
            details = cursor.fetchall()

        elif transport_type == 'Itinerary':
            query = """
                SELECT 
                description,
                duration_day, 
                duration_night, 
                destination_city,
                destination_state,
                destination_country,
                itinerary_start_date,
                DATE_ADD(itinerary_start_date, INTERVAL duration_day DAY) AS itinerary_end_date,
                price 
                FROM Itinerary 
                NATURAL JOIN I_Book_Includes 
                WHERE Booking_ID = %s
            """
            cursor.execute(query, (booking_id,))
            details = cursor.fetchall()

        elif transport_type == 'Hotel':
            query = """
                SELECT 
                    name,
                    hotel_description,
                    location,
                    check_in_date,
                    check_out_date,
                    room_booked,
                    price_per_night

                FROM Hotel 
                NATURAL JOIN H_Book_Includes 
                WHERE Booking_ID = %s
            """
            cursor.execute(query, (booking_id,))
            details = cursor.fetchall()

        else:
            return jsonify({'success': False, 'error': 'Invalid transport type'}), 400

        # Apply serialization to each record
        serialized_details = [serialize_record(row) for row in details]

        return jsonify({
            'success': True,
            'transport_type': transport_type,
            'booking_details': serialized_details
        }), 200


    except Exception as err:
        print("SQL error: {}".format(err))
        return jsonify({'success': False, 'error': 'An error occurred while querying the database'}), 500

    finally:
        if cursor is not None:
            cursor.close()
        conn.close()


@app.route('/A_transport_profile')
def A_transport_profile():
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return redirect(url_for('login_page'))

    # 1) Fetch airplane transport provider
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM TransportProvider WHERE provider_id=%s",
            (user_id,)
        )
        user = cursor.fetchone()
        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        app.logger.error(f"Error fetching provider {user_id}: {err}")
        return "Internal Server Error", 500

    if not user:
        return "User not found", 404

    # 2) Fetch Provided Airplanes
    airplanes = []
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
              airplane_id,
              name,
              arrival_time,
              arrival_date,
              departure_time,
              departure_date,
              arrival_location,
              departure_location,
              available_seats,
              capacity,
              price,
              arf_pkey

            FROM A_Route_Follows 
            NATURAL JOIN AirplaneRoute
            NATURAL JOIN Airplane
            WHERE provider_id = %s

        """, (user_id,))

        airplanes = cursor.fetchall()
        cursor.close()
        conn.close()

    except mysql.connector.Error as err:
        app.logger.warning(f"Could not fetch airplanes for {user_id}: {err}")

    return render_template('A_transport_profile.html',
                           user_id=user,
                           airplanes=airplanes)


@app.route('/api/delete_airplane_entry', methods=['POST'])
def delete_airplane_entry():
    data = request.get_json()
    arf_pkey = data.get('arf_pkey')

    if not arf_pkey:
        return jsonify({'success': False, 'error': 'Missing arf_pkey'}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        cursor.execute(
            "DELETE FROM A_Route_Follows WHERE arf_pkey = %s", (arf_pkey,))

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True})
    except mysql.connector.Error as err:
        app.logger.error(f"Error deleting airplane {arf_pkey}: {err}")
        return jsonify({'success': False, 'error': str(err)}), 500


@app.route('/api/add_airplane_entry', methods=['POST'])
def add_airplane_entry():
    data = request.get_json()

    print(data)

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Check if airplane_id already exists
        cursor.execute(
            "SELECT * FROM Airplane WHERE airplane_id = %s", (data['id'],))
        existing = cursor.fetchone()

        if not existing:
            cursor.execute("""
                INSERT INTO Airplane (airplane_id, name, provider_id, capacity)
                VALUES (%s, %s, %s, %s)
            """, (
                data['id'],
                data['name'],
                data['provider_id'],
                data['capacity']
            ))

        # Insert into AirplaneRoute
        # Check if route already exists
        cursor.execute("""
            SELECT route_id FROM AirplaneRoute
            WHERE arrival_location = %s AND departure_location = %s
        """, (data['arrival_location'], data['departure_location']))
        route = cursor.fetchone()

        if route:
            route_id = route[0]
        else:
            cursor.execute("""
                INSERT INTO AirplaneRoute (arrival_location, departure_location)
                VALUES (%s, %s)
            """, (data['arrival_location'], data['departure_location']))
            route_id = cursor.lastrowid  # Get the newly created route_id

        # Insert into A_Route_Follows
        cursor.execute("""
            INSERT INTO A_Route_Follows (
                route_id,
                price,
                available_seats,
                arrival_time, 
                departure_time,
                arrival_date,
                departure_date,
                airplane_id
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            route_id,
            data['price'],
            data['available_seats'],
            data['arrival_time'],
            data['departure_time'],
            data['arrival_date'],
            data['departure_date'],
            data['id']
        ))

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True})
    except mysql.connector.Error as err:
        app.logger.error(f"Error adding airplane: {err}")
        return jsonify({'success': False, 'error': str(err)}), 500


@app.route('/api/modify_airplane_entry', methods=['POST'])
def modify_airplane_entry():
    data = request.get_json()

    required_fields = ['arf_pkey', 'field', 'new_value']
    if not all(field in data for field in required_fields):
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400

    arf_pkey = data['arf_pkey']
    field = data['field']
    new_value = data['new_value']

    allowed_fields = {
        'price': 'FLOAT',
        'available_seats': 'INT',
        'arrival_time': 'TIME',
        'departure_time': 'TIME',
        'arrival_date': 'DATE',
        'departure_date': 'DATE'
    }

    if field not in allowed_fields:
        return jsonify({'success': False, 'error': 'Invalid field name'}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Route and timing related data lives in A_Route_Follows
        if field in ['arrival_time', 'departure_time', 'arrival_date', 'departure_date', 'available_seats', 'price']:
            update_query = f"""
                UPDATE A_Route_Follows
                SET {field} = %s
                WHERE arf_pkey = %s
            """
        else:
            return jsonify({'success': False, 'error': 'Field cannot be updated'}), 400

        cursor.execute(update_query, (new_value, arf_pkey))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'success': True})

    except mysql.connector.Error as err:
        app.logger.error(f"Database update error: {err}")
        return jsonify({'success': False, 'error': str(err)}), 500




@app.route('/T_transport_profile')
def T_transport_profile():
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return redirect(url_for('login_page'))

    # 1) Fetch train transport provider
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM TransportProvider WHERE provider_id=%s",
            (user_id,)
        )
        user = cursor.fetchone()
        cursor.close()
        conn.close()

    except mysql.connector.Error as err:
        app.logger.error(f"Error fetching provider {user_id}: {err}")
        return "Internal Server Error", 500

    if not user:
        return "User not found", 404

    # 2) Fetch Provided trains
    trains = []
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
              train_id,
              name,
              arrival_time,
              arrival_date,
              departure_time,
              departure_date,
              arrival_location,
              departure_location,
              available_seats,
              capacity,
              price,
              trf_pkey

            FROM T_Route_Follows 
            NATURAL JOIN TrainRoute
            NATURAL JOIN Train
            WHERE provider_id = %s

        """, (user_id,))

        trains = cursor.fetchall()
        cursor.close()
        conn.close()

    except mysql.connector.Error as err:
        app.logger.warning(f"Could not fetch trains for {user_id}: {err}")

    return render_template('T_transport_profile.html',
                           user_id=user,
                           trains=trains)


@app.route('/api/delete_train_entry', methods=['POST'])
def delete_train_entry():
    data = request.get_json()
    trf_pkey = data.get('trf_pkey')

    if not trf_pkey:
        return jsonify({'success': False, 'error': 'Missing trf_pkey'}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        cursor.execute(
            "DELETE FROM T_Route_Follows WHERE trf_pkey = %s", (trf_pkey,))

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True})
    except mysql.connector.Error as err:
        app.logger.error(f"Error deleting train {trf_pkey}: {err}")
        return jsonify({'success': False, 'error': str(err)}), 500


@app.route('/api/add_train_entry', methods=['POST'])
def add_train_entry():
    data = request.get_json()

    print(data)

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Check if train_id already exists
        cursor.execute(
            "SELECT * FROM Train WHERE train_id = %s", (data['id'],))
        existing = cursor.fetchone()

        if not existing:
            cursor.execute("""
                INSERT INTO Train (train_id, name, provider_id, capacity)
                VALUES (%s, %s, %s, %s)
            """, (
                data['id'],
                data['name'],
                data['provider_id'],
                data['capacity']
            ))

        # Insert into TrainRoute
        # Check if route already exists
        cursor.execute("""
            SELECT route_id FROM TrainRoute
            WHERE arrival_location = %s AND departure_location = %s
        """, (data['arrival_location'], data['departure_location']))
        route = cursor.fetchone()

        if route:
            route_id = route[0]
        else:
            cursor.execute("""
                INSERT INTO TrainRoute (arrival_location, departure_location)
                VALUES (%s, %s)
            """, (data['arrival_location'], data['departure_location']))
            route_id = cursor.lastrowid  # Get the newly created route_id

        # Insert into T_Route_Follows
        cursor.execute("""
            INSERT INTO T_Route_Follows (
                route_id,
                price,
                available_seats,
                arrival_time, 
                departure_time,
                arrival_date,
                departure_date,
                train_id
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            route_id,
            data['price'],
            data['available_seats'],
            data['arrival_time'],
            data['departure_time'],
            data['arrival_date'],
            data['departure_date'],
            data['id']
        ))

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True})
    except mysql.connector.Error as err:
        app.logger.error(f"Error adding train: {err}")
        return jsonify({'success': False, 'error': str(err)}), 500


@app.route('/api/modify_train_entry', methods=['POST'])
def modify_train_entry():
    data = request.get_json()

    required_fields = ['trf_pkey', 'field', 'new_value']
    if not all(field in data for field in required_fields):
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400

    trf_pkey = data['trf_pkey']
    field = data['field']
    new_value = data['new_value']

    allowed_fields = {
        'price': 'FLOAT',
        'available_seats': 'INT',
        'arrival_time': 'TIME',
        'departure_time': 'TIME',
        'arrival_date': 'DATE',
        'departure_date': 'DATE'
    }

    if field not in allowed_fields:
        return jsonify({'success': False, 'error': 'Invalid field name'}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Route and timing related data lives in T_Route_Follows
        if field in ['arrival_time', 'departure_time', 'arrival_date', 'departure_date', 'available_seats', 'price']:
            update_query = f"""
                UPDATE T_Route_Follows
                SET {field} = %s
                WHERE trf_pkey = %s
            """
        else:
            return jsonify({'success': False, 'error': 'Field cannot be updated'}), 400

        cursor.execute(update_query, (new_value, trf_pkey))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'success': True})

    except mysql.connector.Error as err:
        app.logger.error(f"Database update error: {err}")
        return jsonify({'success': False, 'error': str(err)}), 500




# --- Agency Profile Page ---
@app.route('/agency_profile')
def agency_profile():
    agency_id = request.args.get('user_id', type=int)

    print(agency_id) 
    if not agency_id:
        return redirect(url_for('login_page'))

    # Fetch agency info
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM TourismAgency WHERE agency_id=%s", (agency_id,))
        agency = cursor.fetchone()
        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        app.logger.error(f"Error fetching agency {agency_id}: {err}")
        return "Internal Server Error", 500

    if not agency:
        return "Agency not found", 404

    # Fetch itineraries
    itineraries = []
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
              itinerary_id,
              description,
              duration_day,
              duration_night,
              price,
              destination_city,
              destination_state,
              destination_country
            FROM Itinerary
            WHERE agency_id = %s
            ORDER BY itinerary_id DESC
        """, (agency_id,))
        itineraries = cursor.fetchall()
        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        app.logger.warning(f"Could not fetch itineraries for {agency_id}: {err}")

    return render_template('agency_profile.html',
                           agency=agency,
                           itineraries=itineraries)

# --- Add Itinerary ---
@app.route('/api/add_itinerary', methods=['POST'])
def add_itinerary():
    data = request.get_json()
    required = ['agency_id','description','duration_day','duration_night',
                'price','destination_city','destination_state','destination_country']
    if not all(k in data for k in required):
        return jsonify({'success':False,'error':'Missing fields'}),400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Itinerary
            (agency_id, description, duration_day, duration_night,
             price, destination_city, destination_state, destination_country)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        """,(
            data['agency_id'],
            data['description'],
            data['duration_day'],
            data['duration_night'],
            data['price'],
            data['destination_city'],
            data['destination_state'],
            data['destination_country']
        ))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success':True})
    except mysql.connector.Error as err:
        app.logger.error(f"Error adding itinerary: {err}")
        return jsonify({'success':False,'error':str(err)}),500

# --- Delete Itinerary ---
@app.route('/api/delete_itinerary', methods=['POST'])
def delete_itinerary():
    data = request.get_json()
    iid = data.get('itinerary_id')
    if not iid:
        return jsonify({'success':False,'error':'Missing itinerary_id'}),400
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Itinerary WHERE itinerary_id=%s", (iid,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success':True})
    except mysql.connector.Error as err:
        app.logger.error(f"Error deleting itinerary {iid}: {err}")
        return jsonify({'success':False,'error':str(err)}),500

# --- Modify Itinerary ---
@app.route('/api/modify_itinerary', methods=['POST'])
def modify_itinerary():
    data = request.get_json()
    required = ['itinerary_id','field','new_value']
    if not all(k in data for k in required):
        return jsonify({'success':False,'error':'Missing fields'}),400

    iid = data['itinerary_id']
    field = data['field']
    val = data['new_value']
    allowed = {'description','duration_day','duration_night',
               'price','destination_city','destination_state','destination_country'}
    if field not in allowed:
        return jsonify({'success':False,'error':'Invalid field'}),400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        query = f"UPDATE Itinerary SET {field}=%s WHERE itinerary_id=%s"
        cursor.execute(query, (val, iid))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success':True})
    except mysql.connector.Error as err:
        app.logger.error(f"Error modifying itinerary {iid}: {err}")
        return jsonify({'success':False,'error':str(err)}),500




# --- Hotel Provider Profile Page ---
@app.route('/hotel_profile')
def hotel_profile():
    provider_id = request.args.get('user_id', type=int)
    if not provider_id:
        return redirect(url_for('login_page'))

    # Fetch provider info
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM AccommodationProvider WHERE provider_id=%s",
            (provider_id,)
        )
        provider = cursor.fetchone()
        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        app.logger.error(f"Error fetching provider {provider_id}: {err}")
        return "Internal Server Error", 500

    if not provider:
        return "Provider not found", 404

    # Fetch hotels
    hotels = []
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
              hotel_id,
              name,
              location,
              price_per_night,
              total_rooms,
              hotel_description,
              mobile_number,
              email
            FROM Hotel
            WHERE provider_id = %s
            ORDER BY hotel_id DESC
        """, (provider_id,))
        hotels = cursor.fetchall()
        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        app.logger.warning(f"Could not fetch hotels for {provider_id}: {err}")

    return render_template('hotel_profile.html',
                           provider=provider,
                           hotels=hotels)

# --- Add Hotel ---
@app.route('/api/add_hotel', methods=['POST'])
def add_hotel():
    data = request.get_json()
    required = ['provider_id','name','location', 'mobile_number', 'email' ,'price_per_night',
                'total_rooms','hotel_description']
    if not all(k in data for k in required):
        return jsonify({'success':False,'error':'Missing fields'}),400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Hotel
            (name, location, price_per_night, total_rooms, hotel_description, provider_id, mobile_number, email)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        """,(
            data['name'],
            data['location'],
            data['price_per_night'],
            data['total_rooms'],
            data['hotel_description'],
            data['provider_id'],
            data['mobile_number'],
            data['email']
        ))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success':True})
    except mysql.connector.Error as err:
        app.logger.error(f"Error adding hotel: {err}")
        return jsonify({'success':False,'error':str(err)}),500

# --- Delete Hotel ---
@app.route('/api/delete_hotel', methods=['POST'])
def delete_hotel():
    data = request.get_json()
    hid = data.get('hotel_id')
    if not hid:
        return jsonify({'success':False,'error':'Missing hotel_id'}),400
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Hotel WHERE hotel_id=%s", (hid,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success':True})
    except mysql.connector.Error as err:
        app.logger.error(f"Error deleting hotel {hid}: {err}")
        return jsonify({'success':False,'error':str(err)}),500

# --- Modify Hotel ---
@app.route('/api/modify_hotel', methods=['POST'])
def modify_hotel():
    data = request.get_json()
    required = ['hotel_id','field','new_value']
    if not all(k in data for k in required):
        return jsonify({'success':False,'error':'Missing fields'}),400

    hid = data['hotel_id']
    field = data['field']
    val = data['new_value']
    allowed = {'name','location', 'mobile_number', 'email','price_per_night','total_rooms','hotel_description'}
    if field not in allowed:
        return jsonify({'success':False,'error':'Invalid field'}),400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        query = f"UPDATE Hotel SET {field}=%s WHERE hotel_id=%s"
        cursor.execute(query, (val, hid))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success':True})
    except mysql.connector.Error as err:
        app.logger.error(f"Error modifying hotel {hid}: {err}")
        return jsonify({'success':False,'error':str(err)}),500






@app.route('/browse_itinerary')
def browse_itinerary():
    user_id = request.args.get('user_id', type=int)
    return render_template('browse_itinerary.html',user_id=user_id)


@app.route('/browse_hotels')
def browse_hotels():
    user_id = request.args.get('user_id', type=int)
    return render_template('browse_hotels.html',user_id=user_id)


@app.route('/browse_trains')
def browse_trains():
    user_id = request.args.get('user_id', type=int)
    return render_template('browse_trains.html', user_id=user_id)


@app.route('/browse_airplanes')
def browse_airplanes():
    user_id = request.args.get('user_id', type=int)
    return render_template('browse_airplanes.html', user_id=user_id)




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
                'trf_pkey': row['trf_pkey'],
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
                'arf_pkey': row['arf_pkey'],
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
        print(results)
        return jsonify({'results': results})

    except mysql.connector.Error as err:
        app.logger.error(f"Airplane search error: {err}")
        return jsonify({'error': 'Server error'}), 500
    

@app.route('/api/search_itineraries', methods=['POST'])
def api_search_itineraries():

    data = request.get_json()
    dest_city = data.get('destination_city')
    dest_state = data.get('destination_state')
    dest_country = data.get('destination_country')  

    if not all([dest_city, dest_state, dest_country]):
        return jsonify({'error': 'Missing fields'}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT *, avg_rating, num_rating
            FROM Itinerary INNER JOIN (
                SELECT item_id, AVG(rating) as avg_rating, COUNT(rating) as num_rating
                FROM Reviews WHERE item_type = 'Itinerary'GROUP BY item_id
            ) AS collated_reviews
            ON collated_reviews.item_id = itinerary_id
            WHERE destination_city = %s
              AND destination_state = %s
              AND destination_country = %s
        """
        cursor.execute(query, (dest_city, dest_state, dest_country))
        raw_results = cursor.fetchall()
        cursor.close()
        conn.close()

        results = []
        for row in raw_results:

            # Later in your route when building the result:
            results.append({
                'avg_rating': row['avg_rating'],
                'num_rating': row['num_rating'],
                'itinerary_id': row['itinerary_id'],
                'agency_id': row['agency_id'],
                'description': row['description'],
                'duration_day': row['duration_day'],
                'duration_night': row['duration_night'],
                'price': str(row['price']),
                'destination_city': str(row['destination_city']),
                'destination_state': row['destination_state'],
                'destination_country': row['destination_country']
            })

        return jsonify({'results': results})

    except mysql.connector.Error as err:
        app.logger.error(f"Itinerary search error: {err}")
        return jsonify({'error': 'Server error'}), 500

    
@app.route('/api/search_hotels', methods=['POST'])
def api_search_hotels():

    data = request.get_json()
    arr_loc = data.get('arrival_location')
    from_date = data.get('from_date')
    to_date = data.get('to_date')

    print(data)

    if not all([arr_loc, from_date, to_date]):
        return jsonify({'error': 'Missing fields'}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT
              h.hotel_id,
              h.name,
              h.location,
              h.price_per_night,
              h.email,
              h.mobile_number,
              h.total_rooms,
              h.hotel_description,
              h.provider_id,

              (
                h.total_rooms
                - COALESCE(
                    (
                      SELECT SUM(hbi.room_booked)
                      FROM H_Book_Includes hbi
                      WHERE hbi.hotel_id = h.hotel_id
                        AND hbi.check_in_date  <= %s
                        AND hbi.check_out_date >= %s
                    ), 0
                  )
              ) AS available_rooms,

              (
                SELECT AVG(r.rating)
                FROM Reviews r
                WHERE r.item_id   = h.hotel_id
                  AND r.item_type = 'Hotel'
              ) AS avg_rating,

              (
                SELECT COUNT(r.rating)
                FROM Reviews r
                WHERE r.item_id   = h.hotel_id
                  AND r.item_type = 'Hotel'
              ) AS num_rating

            FROM Hotel h
            WHERE h.location = %s;

        """

        
        cursor.execute(query, (from_date, to_date, arr_loc))
        raw_results = cursor.fetchall()
        cursor.close()
        conn.close()

        results = []
        for row in raw_results:

            results.append({
                'hotel_id': row['hotel_id'],
                'name': row['name'],
                'location': row['location'],
                'email': row['email'],
                'mobile_number': row['mobile_number'],
                'hotel_description': str(row['hotel_description']),
                'available_rooms': str(row['available_rooms']),
                'price': str(row['price_per_night']),
                'avg_rating': row['avg_rating'],
                'num_rating': row['num_rating']
            })

        print(results)
        return jsonify({'results': results})

    except mysql.connector.Error as err:
        app.logger.error(f"Hotel search error: {err}")
        return jsonify({'error': 'Server error'}), 500





@app.route('/booking')
def booking_page():
    return render_template('booking.html')


@app.route("/api/tget_booking_details")
def tget_booking_details():
    trf_pkey = request.args.get("trf_pkey")
    if not trf_pkey:
        return jsonify({"error": "Missing trf_pkey"}), 400

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
            WHERE trf_pkey = %s
        """
        cursor.execute(query, (trf_pkey,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if not row:
            return jsonify({'error': 'Train not found'}), 404

        result = {
            'trf_pkey': row['trf_pkey'],
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
            'price': float(row['price']),
        }

        return jsonify(result)

    except mysql.connector.Error as err:
        app.logger.error(f"Train search error: {err}")
        return jsonify({'error': 'Server error'}), 500

@app.route("/api/aget_booking_details")
def aget_booking_details():
    arf_pkey = request.args.get("arf_pkey")
    if not arf_pkey:
        return jsonify({"error": "Missing arf_pkey"}), 400

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
            WHERE arf_pkey = %s
        """
        cursor.execute(query, (arf_pkey,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if not row:
            return jsonify({'error': 'Train not found'}), 404

        result = {
            'arf_pkey': row['arf_pkey'],
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
            'price': float(row['price']),
        }

        return jsonify(result)

    except mysql.connector.Error as err:
        app.logger.error(f"Airplane search error: {err}")
        return jsonify({'error': 'Server error'}), 500

@app.route("/api/iget_booking_details")
def iget_booking_details():
    itinerary_id = request.args.get("itinerary_id")
    if not itinerary_id:
        return jsonify({"error": "Missing itinerary_id"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT *
            FROM Itinerary
            WHERE  itinerary_id= %s
        """
        cursor.execute(query, (itinerary_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if not row:
            return jsonify({'error': 'Itinerary not found'}), 404

        result = {
            'itinerary_id': row['itinerary_id'],
            'duration_day': row['duration_day'],
            'price': row['price'],
            'description': row['description'],
            'destination_city': str(row['destination_city']),
        }

        return jsonify(result)

    except mysql.connector.Error as err:
        app.logger.error(f"Itinerary search error: {err}")
        return jsonify({'error': 'Server error'}), 500

@app.route("/api/hget_booking_details")
def hget_booking_details():
    hotel_id = request.args.get("hotel_id")
    if not hotel_id:
        return jsonify({"error": "Missing Hotel id"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT *
            FROM Hotel
            WHERE  hotel_id= %s
        """
        cursor.execute(query, (hotel_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if not row:
            return jsonify({'error': 'Hotel not found'}), 404
        
        result = {
            'hotel_id': row['hotel_id'],
            'name':row['name'],
            'hotel_description': str(row['hotel_description']),
            'price': str(row['price_per_night']),
            'location': row['location'],
        }

        return jsonify(result)

    except mysql.connector.Error as err:
        app.logger.error(f"Hotel search error: {err}")
        return jsonify({'error': 'Server error'}), 500


@app.route('/payment')
def payment_page():
    return render_template('payment.html')

@app.route('/api/confirm_payment', methods=['POST'])
def confirm_payment():
    # Get payment data from the frontend
    payment_data = request.get_json()
    idd =payment_data['id']
    user_id = payment_data['user_id']
    amount = payment_data['amount']
    payment_method = payment_data['payment_method']
    payment_status = payment_data['payment_status']
    transport_type = payment_data['transport_type']
    coupon_code = payment_data['coupon_code']
    count=payment_data['count']
    status = payment_data['status']
    booking_date = payment_data['booking_date']

    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()

        # Insert into Payment table
        cursor.execute('''
            INSERT INTO Payment (amount, payment_method, payment_status)
            VALUES (%s, %s, %s)
        ''', (amount, payment_method, payment_status))
        connection.commit()

        # Get the last inserted payment_id
        payment_id = cursor.lastrowid

        # Insert into Booking table
        if (coupon_code == ''):
            cursor.execute('''
                INSERT INTO Booking (customer_id, payment_id, transport_type, status, booking_date)
                VALUES (%s, %s, %s, %s, %s)
            ''', (user_id, payment_id, transport_type, status, booking_date))
            connection.commit()

        else:
            print("here")
            cursor.execute('''
                INSERT INTO Booking (customer_id, payment_id, coupon_code, transport_type, status, booking_date)
                VALUES (%s, %s, %s, %s, %s, %s)
            ''', (user_id, payment_id, coupon_code, transport_type, status, booking_date))
            connection.commit()

        if transport_type=="train":
            # Get the last inserted booking_id
            booking_id = cursor.lastrowid

            # Insert into T_Book_Includes table
            trf_pkey = idd  # Example, replace with actual trf_pkey value
            tickets_booked = count  # Example, you can update this dynamically based on the actual booking

            cursor.execute('''
                INSERT INTO T_Book_Includes (booking_id, trf_pkey, tickets_booked)
                VALUES (%s, %s, %s)
            ''', (booking_id, trf_pkey, tickets_booked))
            connection.commit()

            cursor.close()
            connection.close()

            return jsonify({"success": True})

        elif transport_type=="airplane":
            # Get the last inserted booking_id
            booking_id = cursor.lastrowid

            # Insert into T_Book_Includes table
            arf_pkey = idd  # Example, replace with actual trf_pkey value
            tickets_booked = count  # Example, you can update this dynamically based on the actual booking

            cursor.execute('''
                INSERT INTO A_Book_Includes (booking_id, arf_pkey, tickets_booked)
                VALUES (%s, %s, %s)
            ''', (booking_id, arf_pkey, tickets_booked))
            connection.commit()

            cursor.close()
            connection.close()

            return jsonify({"success": True})
        elif transport_type=="Itinerary":
            # Get the last inserted booking_id
            booking_id = cursor.lastrowid

            # Insert into T_Book_Includes table
            itinerary_id = idd  # Example, replace with actual trf_pkey valuedynamically based on the actual booking
            cursor.execute('''
                INSERT INTO I_Book_Includes (booking_id, itinerary_id, itinerary_start_date)
                VALUES (%s, %s, %s)
            ''', (booking_id, itinerary_id, booking_date))
            connection.commit()

            cursor.close()
            connection.close()

            return jsonify({"success": True})
        elif transport_type=="hotel":
            # Get the last inserted booking_id
            booking_id = cursor.lastrowid
            from_date=payment_data['from_date']
            to_date=payment_data['to_date']
            # Insert into T_Book_Includes table
            hotel_id = idd  # Example, replace with actual trf_pkey valuedynamically based on the actual booking
            tickets_booked = count
            print(tickets_booked)
            cursor.execute('''
                INSERT INTO H_Book_Includes (booking_id, hotel_id, check_in_date, check_out_date,room_booked)
                VALUES (%s, %s, %s, %s, %s)
            ''', (booking_id, hotel_id, from_date,to_date,tickets_booked))
            connection.commit()

            cursor.close()
            connection.close()

            return jsonify({"success": True})
    except Exception as e:
        print(str(e))
        return jsonify({"success": False, "error": str(e)})


@app.route('/api/apply-coupon', methods=['POST'])
def apply_coupon():
    data = request.json
    coupon_code = data.get('couponCode')

    if not coupon_code:
        return jsonify({'success': False, 'message': 'No coupon code provided'}), 400

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT * FROM Coupon
        WHERE coupon_code = %s AND expiry_date > CURDATE()
        ORDER BY discount_percentage DESC
        LIMIT 1
    """
    cursor.execute(query, (coupon_code,))
    result = cursor.fetchone()  

    cursor.close()
    conn.close()

    if result:
        return jsonify({
            'success': True,
            'message': 'Coupon applied successfully!',
            'discount': result['discount_percentage']
        })
    else:
        return jsonify({
            'success': False,
            'message': 'Invalid or expired coupon.'
        }), 404


@app.route('/api/get_reviews', methods=['POST'])
def get_reviews():

    data = request.get_json()
    item_id = data.get('item_id')
    item_type = data.get('item_type')

    if not all([item_id, item_type]):
        return jsonify({'error': 'Missing fields'}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        query = f"SELECT comment FROM reviews WHERE item_id = %s AND item_type = %s"

        cursor.execute(query, (item_id, item_type))
        raw_results = cursor.fetchall()
        print(raw_results)
        cursor.close()
        conn.close()

        results = []
        
        for row in raw_results:
            comment = row['comment']

            if len(comment) == 0 or comment.isspace():
                continue

            # Later in your route when building the result:
            results.append({
                'comment': row['comment']
            })

        return jsonify({'results': results})

    except mysql.connector.Error as err:
        app.logger.error(f"Itinerary search error: {err}")
        return jsonify({'error': 'Server error'}), 500


@app.route('/api/add_review', methods=['POST'])
def add_review():
    try:
        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        # Extract fields
        booking_id = data.get('booking_id')
        user_id = data.get('user_id')
        comment = data.get('comment')
        rating = data.get('rating')
        item_type = data.get('item_type')

        # Validate input
        if not (all([booking_id, user_id, item_type]) and any( [comment, rating] )):
            return jsonify({"success": False, "error": "Missing required fields"}), 400

        try:
            booking_id = int(booking_id)
            user_id = int(user_id)
            rating = int(rating)
        except (ValueError, TypeError):
            return jsonify({"success": False, "error": "Invalid booking_id, user_id, or rating"}), 400
        
        if item_type not in ['Hotel', 'Itinerary']:
            return jsonify({"success": False, "error": "Invalid item_type. Must be 'Hotel' or 'Itinerary'"}), 400

        # Connect to the database
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)

        # Check if review already exists
        cursor.execute(
            """
            SELECT * FROM reviews 
            WHERE booking_id = %s
            """,
            (booking_id, )
        )
        existing_review = cursor.fetchone()
        if existing_review:
            cursor.close()
            connection.close()
            return jsonify({"success": False, "error": "Review already submitted for this booking"}), 400

        item_id = None
        if item_type == 'Hotel':
            # Replace 'Hotel_Reservation' with your actual table name
            cursor.execute(
                """
                SELECT hotel_id FROM H_Book_Includes 
                WHERE booking_id = %s
                """,
                (booking_id,)
            )
            result = cursor.fetchone()
            if result:
                item_id = result['hotel_id']
            else:
                cursor.close()
                connection.close()
                return jsonify({"success": False, "error": "Hotel not found for this booking"}), 404
        elif item_type == 'Itinerary':
            # Replace 'Itinerary_Reservation' with your actual table name
            cursor.execute(
                """
                SELECT itinerary_id FROM I_Book_Includes 
                WHERE booking_id = %s
                """,
                (booking_id,)
            )

            result = cursor.fetchone()
            if result:
                item_id = result['itinerary_id']
            else:
                cursor.close()
                connection.close()
                return jsonify({"success": False, "error": "Itinerary not found for this booking"}), 404
        

        # Insert the review
        cursor.execute(
            """
            INSERT INTO reviews (comment, rating, booking_id, item_type, item_id)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (comment.strip(), rating, booking_id, item_type, item_id)
        )
        connection.commit()

        # Close the database connection
        cursor.close()
        connection.close()

        return jsonify({"success": True}), 200

    except mysql.connector.Error as err:
        app.logger.error(f"Review Add error: {err}")
        return jsonify({'error': 'Server error'}), 500

@app.route('/api/update_profile', methods=['POST'])
def update_profile():
    data = request.get_json()
    user_id = data.get('user_id')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    email = data.get('email')
    mobile_number = data.get('mobile_number')

    # Basic validation
    if not all([user_id, first_name, last_name, email]):
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400
    
    connection = mysql.connector.connect(**db_config)

    try:
        cursor = connection.cursor()
        
        # Check if the email is already used by another user
        cursor.execute("SELECT customer_id FROM customer WHERE email = %s AND customer_id != %s", (email, user_id))
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'Email is already in use'}), 400
        
        # Update customer profile
        update_query = """
            UPDATE customer
            SET first_name = %s, last_name = %s, email = %s, mobile_number = %s
            WHERE customer_id = %s
        """
        cursor.execute(update_query, (first_name, last_name, email, mobile_number, user_id))
        
        # Check if any rows were affected
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return jsonify({'success': True}), 200
    
    except Exception as e:
        print(str(e))
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    app.run(debug=True)
