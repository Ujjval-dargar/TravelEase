
-- Login - Customer
-- customer_email = "rahul.sharma@example.in" 
-- customer_password = "Rahul@123"
SELECT * FROM Customer WHERE email = 'rahul.sharma@example.in' AND password = 'Rahul@123'; -- valid

-- Customer Past Booking History
SELECT * FROM Booking WHERE Customer_ID = 1;

-- Payment Detail of a Booking ID
SELECT * FROM Payment WHERE Payment_ID = (SELECT Payment_ID FROM Booking WHERE Booking_ID = 1);

-- Airplane Details from a Booking ID
SELECT *, TIMESTAMPDIFF ( minute, CONCAT(departure_date, " ", departure_time), CONCAT(arrival_date, " ", arrival_time) ) AS 'travel_time (min)' 
FROM A_Route_Follows NATURAL JOIN A_Book_Includes NATURAL JOIN AirplaneRoute NATURAL JOIN Airplane WHERE Booking_ID = 1;

-- Train Details from a Booking ID
SELECT * , TIMESTAMPDIFF ( minute, CONCAT(departure_date, " ", departure_time), CONCAT(arrival_date, " ", arrival_time) ) AS 'travel_time (min)' 
FROM T_Route_Follows NATURAL JOIN T_Book_Includes NATURAL JOIN TrainRoute NATURAL JOIN Train WHERE Booking_ID = 2;

-- Itinerary Details from a Booking ID
SELECT * , DATE_ADD( itinerary_start_date, INTERVAL duration_day DAY ) as itinerary_end_date 
FROM Itinerary NATURAL JOIN I_Book_Includes WHERE Booking_ID = 2;

--  Hotel Details from a Booking ID
SELECT * FROM Hotel NATURAL JOIN H_Book_Includes WHERE Booking_ID = 1;

-- Reviews for Hotel from Hotel ID
SELECT * FROM Reviews WHERE item_id = 1 AND item_type = 'Hotel';

-- Reviews for Itinerary from Itinerary ID
SELECT * FROM Reviews WHERE item_id = 2 AND item_type = 'Itinerary';

-- Rooms Available from start date, end date, hotel id
SELECT h.total_rooms - COALESCE(SUM(hbi.room_booked), 0) AS available_rooms
FROM Hotel h
LEFT JOIN H_Book_Includes hbi ON h.hotel_id = hbi.hotel_id
WHERE h.hotel_id = 1 AND hbi.check_in_date <= '2025-05-02' AND hbi.check_out_date >= '2025-04-29';

-- Average rating and number of reviews for Hotel ID 
SELECT AVG(rating), COUNT(rating) FROM Reviews WHERE item_id = 1 AND item_type = 'Hotel';

-- Average rating and number of reviews for Itinerary ID 
SELECT AVG(rating), COUNT(rating) FROM Reviews WHERE item_id = 2 AND item_type = 'Itinerary';

-- Find all trains for arrival location, departure location, departure date
SELECT * , TIMESTAMPDIFF ( minute, CONCAT(departure_date, " ", departure_time), CONCAT(arrival_date, " ", arrival_time) ) AS 'travel_time (min)' 
FROM T_Route_Follows NATURAL JOIN TrainRoute NATURAL JOIN Train
WHERE departure_date = '2025-04-01' AND departure_location = 'Surat' AND arrival_location = 'Mumbai';

-- Find all airplane for arrival location, departure location, departure date
SELECT * , TIMESTAMPDIFF ( minute, CONCAT(departure_date, " ", departure_time), CONCAT(arrival_date, " ", arrival_time) ) AS 'travel_time (min)' 
FROM A_Route_Follows NATURAL JOIN AirplaneRoute NATURAL JOIN Airplane
WHERE departure_date = '2025-03-01' AND departure_location = 'Mumbai' AND arrival_location = 'New Delhi';

-- Get coupons
SELECT * FROM Coupon WHERE expiry_date > CURDATE() ORDER BY discount_percentage DESC;
