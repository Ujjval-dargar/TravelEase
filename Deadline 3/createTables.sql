DROP DATABASE IF EXISTS TravelEase;
CREATE DATABASE TravelEase;
USE TravelEase;

CREATE TABLE Customer (
	customer_id INT AUTO_INCREMENT PRIMARY KEY,

	first_name VARCHAR(50) NOT NULL,
	last_name VARCHAR(50),

	email VARCHAR(255) UNIQUE,
	mobile_number VARCHAR(20) UNIQUE,

	password VARCHAR(25) NOT NULL,

	CHECK (email IS NOT NULL OR mobile_number IS NOT NULL)
);


CREATE TABLE Admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,

    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),

    email VARCHAR(255) UNIQUE,
    mobile_number VARCHAR(20) UNIQUE,

    password VARCHAR(25) NOT NULL,
   
    CHECK (email IS NOT NULL OR mobile_number IS NOT NULL)
);

CREATE TABLE TourismAgency (
    agency_id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,

    email VARCHAR(255) UNIQUE,
    mobile_number VARCHAR(20) UNIQUE,

    password VARCHAR(25) NOT NULL,

    CHECK (email IS NOT NULL OR mobile_number IS NOT NULL)
);

CREATE TABLE Itinerary (
    itinerary_id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,

    description TEXT NOT NULL,

    duration_day INT NOT NULL,
    duration_night INT NOT NULL,

    price DECIMAL(10,2) NOT NULL,

    destination_city VARCHAR(50) NOT NULL,
    destination_state VARCHAR(50) NOT NULL,
    destination_country VARCHAR(50) NOT NULL,

    FOREIGN KEY (agency_id) REFERENCES TourismAgency(agency_id)
);

CREATE TABLE TransportProvider (
    provider_id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) UNIQUE,
    mobile_number VARCHAR(20) UNIQUE,

    service_type ENUM('Train', 'Airplane') NOT NULL,

    password VARCHAR(25) NOT NULL, 

    CHECK (email IS NOT NULL OR mobile_number IS NOT NULL)
);

CREATE TABLE Payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,

    amount DECIMAL(10,2) NOT NULL,

    payment_method ENUM('Credit Card', 'Debit Card', 'Net Banking', 'UPI') NOT NULL,
    payment_status ENUM('Confirmed', 'Pending', 'Cancelled') NOT NULL
);

CREATE TABLE Coupon (
    coupon_code VARCHAR(10) PRIMARY KEY,
    discount_percentage INT NOT NULL,
    expiry_date DATETIME
);

CREATE TABLE Booking (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    payment_id INT NOT NULL UNIQUE,
    coupon_code VARCHAR(10),

    transport_type ENUM('Hotel', 'Itinerary', 'Train', 'Airplane'),
    status ENUM('Confirmed', 'Pending', 'Cancelled') NOT NULL,
    booking_date DATE NOT NULL,

    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (payment_id) REFERENCES Payment(payment_id),
    FOREIGN KEY (coupon_code) REFERENCES Coupon(coupon_code)
);

CREATE TABLE Airplane (
    airplane_id VARCHAR(10) PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    provider_id INT NOT NULL,

    FOREIGN KEY (provider_id) REFERENCES TransportProvider(provider_id)
);

CREATE TABLE AirplaneRoute (
    route_id INT AUTO_INCREMENT PRIMARY KEY,

    arrival_location VARCHAR(100) NOT NULL,
    departure_location VARCHAR(100) NOT NULL
);

CREATE TABLE Train (
    train_id VARCHAR(10) PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    provider_id INT NOT NULL,

    FOREIGN KEY (provider_id) REFERENCES TransportProvider(provider_id)
);

CREATE TABLE TrainRoute (
    route_id INT AUTO_INCREMENT PRIMARY KEY,

    arrival_location VARCHAR(100) NOT NULL,
    departure_location VARCHAR(100) NOT NULL
);

CREATE TABLE AccommodationProvider (
    provider_id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) UNIQUE,
    mobile_number VARCHAR(20) UNIQUE,

    password VARCHAR(25) NOT NULL,

    CHECK (email IS NOT NULL OR mobile_number IS NOT NULL)
);

CREATE TABLE Hotel (
    hotel_id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    price_per_night DECIMAL(10,2) NOT NULL,

    email VARCHAR(255) UNIQUE,
    mobile_number VARCHAR(20) UNIQUE,

    total_rooms INT NOT NULL,

    hotel_description TEXT NOT NULL,
    provider_id INT NOT NULL,

    FOREIGN KEY (provider_id) REFERENCES AccommodationProvider(provider_id),
    CHECK (email IS NOT NULL OR mobile_number IS NOT NULL)
);

CREATE TABLE Reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,

    comment TEXT,
    rating INT NOT NULL,
    booking_id INT NOT NULL,

    item_type ENUM('Hotel', 'Itinerary') NOT NULL,
    item_id INT NOT NULL,
    
    CHECK (rating BETWEEN 1 AND 5),
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id)
);

CREATE TABLE A_Route_Follows (
    arf_pkey INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL UNIQUE,

    price DECIMAL(10,2) NOT NULL,
    available_seats INT NOT NULL,

    arrival_time TIME NOT NULL,
    arrival_date DATE NOT NULL,

    departure_time TIME NOT NULL,
    departure_date DATE NOT NULL,

    airplane_id VARCHAR(10) NOT NULL,

    FOREIGN KEY (airplane_id) REFERENCES Airplane(airplane_id),
    FOREIGN KEY (route_id) REFERENCES AirplaneRoute(route_id)
);

CREATE TABLE T_Route_Follows (
    trf_pkey INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL UNIQUE,

    price DECIMAL(10,2) NOT NULL,
    available_seats INT NOT NULL,

    arrival_time TIME NOT NULL,
    arrival_date DATE NOT NULL,

    departure_time TIME NOT NULL,
    departure_date DATE NOT NULL,

    train_id VARCHAR(10) NOT NULL,

    FOREIGN KEY (train_id) REFERENCES Train(train_id),
    FOREIGN KEY (route_id) REFERENCES TrainRoute(route_id)
);

CREATE TABLE A_Book_Includes (
    booking_id INT NOT NULL,
    arf_pkey INT NOT NULL,
    tickets_booked INT NOT NULL,

    PRIMARY KEY (booking_id, arf_pkey),
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id),
    FOREIGN KEY (arf_pkey) REFERENCES A_Route_Follows(arf_pkey)
);


CREATE TABLE T_Book_Includes (
    booking_id INT NOT NULL,
    trf_pkey INT NOT NULL,
    tickets_booked INT NOT NULL,

    PRIMARY KEY (booking_id, trf_pkey),
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id),
    FOREIGN KEY (trf_pkey) REFERENCES T_Route_Follows(trf_pkey)
);

CREATE TABLE H_Book_Includes (
    booking_id INT NOT NULL,
    hotel_id INT NOT NULL,

    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,

    room_booked INT NOT NULL,

    PRIMARY KEY (booking_id, hotel_id),
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id),
    FOREIGN KEY (hotel_id) REFERENCES Hotel(hotel_id)
);


CREATE TABLE I_Book_Includes (
    booking_id INT NOT NULL,
    itinerary_id INT NOT NULL,
    itinerary_start_date DATE NOT NULL,

    PRIMARY KEY (booking_id, itinerary_id),
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id),
    FOREIGN KEY (itinerary_id) REFERENCES Itinerary(itinerary_id)
);


