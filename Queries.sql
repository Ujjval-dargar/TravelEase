
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
