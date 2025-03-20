
-- Login - Customer
-- customer_email = "rahul.sharma@example.in" 
-- customer_password = "Rahul@123"
SELECT * FROM Customer WHERE email = 'rahul.sharma@example.in' AND password = 'Rahul@123'; -- valid

-- Customer Past Booking History
SELECT * FROM Booking WHERE Customer_ID = 1;

-- Payment Detail of a Booking ID
SELECT * FROM Payment WHERE Payment_ID = (SELECT Payment_ID FROM Booking WHERE Booking_ID = 1);

-- Airplane Details from a Booking ID
SELECT * FROM A_Route_Follows NATURAL JOIN  (SELECT * FROM A_Book_Includes WHERE Booking_ID = 1) AS B NATURAL JOIN AirplaneRoute NATURAL JOIN Airplane;

-- Train Details from a Booking ID
SELECT * FROM T_Route_Follows NATURAL JOIN  (SELECT * FROM T_Book_Includes WHERE Booking_ID = 2) AS B NATURAL JOIN TrainRoute NATURAL JOIN Train;

-- Itinerary Details from a Booking ID
SELECT * FROM Itinerary NATURAL JOIN (SELECT * FROM I_Book_Includes WHERE Booking_ID = 2) AS B ;

--  Hotel Details from a Booking ID
SELECT * FROM Hotel NATURAL JOIN (SELECT * FROM H_Book_Includes WHERE Booking_ID = 1) AS B;

-- Rooms Available from start date, end date, hotel id
SELECT total_rooms - COALESCE(occupied_rooms, 0) as rooms_available
FROM 
(SELECT total_rooms FROM Hotel WHERE hotel_id = 1) as h1, 
(SELECT SUM(room_booked) as occupied_rooms
FROM H_Book_Includes
WHERE hotel_id = 1
AND ( check_in_date BETWEEN '2025-04-28' AND '2025-04-29' 
	OR check_out_date BETWEEN '2025-04-28' AND '2025-04-29'  ) 
) as h2;

-- Reviews for Hotel from Hotel ID
SELECT * FROM Reviews WHERE item_id = 1 AND item_type = 'Hotel';

-- Reviews for Itinerary from Itinerary ID
SELECT * FROM Reviews WHERE item_id = 2 AND item_type = 'Itinerary';

-- Average rating and number of reviews for Hotel ID 
SELECT AVG(rating), COUNT(rating) FROM Reviews WHERE item_id = 1 AND item_type = 'Hotel';

-- Average rating and number of reviews for Itinerary ID 
SELECT AVG(rating), COUNT(rating) FROM Reviews WHERE item_id = 2 AND item_type = 'Itinerary';

