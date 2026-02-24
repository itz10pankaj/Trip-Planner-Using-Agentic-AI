CREATE TABLE user_preferences (
    user_id VARCHAR(255) PRIMARY KEY,
    travel_style VARCHAR(50),
    budget_range VARCHAR(50),
    preferred_climate VARCHAR(50),
    food_preference VARCHAR(50),
    accommodation_type VARCHAR(50),
    pace VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE trips (
    trip_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    destination VARCHAR(255),
    start_date DATE NULL,
    end_date DATE NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE trip_itineraries (
    trip_id VARCHAR(50) PRIMARY KEY,
    itinerary_json JSON,
    estimated_budget DECIMAL(10,2) NULL,
    currency VARCHAR(10),
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE
);

