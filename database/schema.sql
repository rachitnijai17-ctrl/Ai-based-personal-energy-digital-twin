-- ============================================
-- Smart Energy Monitoring System - Database Schema
-- MySQL Database Setup
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS smart_energy;
USE smart_energy;

-- ============================================
-- TABLE: users
-- Stores system users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: buildings
-- Stores building information
-- ============================================
CREATE TABLE IF NOT EXISTS buildings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(200),
    floors INT DEFAULT 1,
    total_rooms INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: rooms
-- Stores rooms within buildings
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    building_id INT,
    floor_number INT DEFAULT 1,
    room_type VARCHAR(50),
    FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- ============================================
-- TABLE: appliances
-- Stores all registered appliances
-- ============================================
CREATE TABLE IF NOT EXISTS appliances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    room VARCHAR(100),
    power_watts DOUBLE NOT NULL,
    expected_hours DOUBLE DEFAULT 0,
    actual_hours DOUBLE DEFAULT 0,
    health_score DOUBLE DEFAULT 100,
    status VARCHAR(50) DEFAULT 'Good',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: energy_readings
-- Daily energy consumption readings
-- ============================================
CREATE TABLE IF NOT EXISTS energy_readings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appliance_id INT,
    reading_kwh DOUBLE NOT NULL,
    reading_date DATE NOT NULL,
    reading_time TIME,
    FOREIGN KEY (appliance_id) REFERENCES appliances(id)
);

-- ============================================
-- TABLE: budgets
-- Monthly budget settings
-- ============================================
CREATE TABLE IF NOT EXISTS budgets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    month VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    budget_amount DOUBLE NOT NULL,
    actual_amount DOUBLE DEFAULT 0,
    tariff DOUBLE DEFAULT 8.0
);

-- ============================================
-- TABLE: weather_data
-- Stores weather readings
-- ============================================
CREATE TABLE IF NOT EXISTS weather_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    temperature DOUBLE,
    humidity DOUBLE,
    feels_like DOUBLE,
    wind_speed DOUBLE,
    weather_condition VARCHAR(100),
    location VARCHAR(100),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: appliance_health
-- Tracks appliance health over time
-- ============================================
CREATE TABLE IF NOT EXISTS appliance_health (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appliance_id INT,
    health_score DOUBLE,
    deviation_pct DOUBLE,
    status VARCHAR(50),
    checked_date DATE,
    FOREIGN KEY (appliance_id) REFERENCES appliances(id)
);

-- ============================================
-- TABLE: anomalies
-- Detected anomalies log
-- ============================================
CREATE TABLE IF NOT EXISTS anomalies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appliance_id INT,
    anomaly_type VARCHAR(50),
    description TEXT,
    severity VARCHAR(20),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appliance_id) REFERENCES appliances(id)
);

-- ============================================
-- TABLE: recommendations
-- Generated recommendations
-- ============================================
CREATE TABLE IF NOT EXISTS recommendations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recommendation_text TEXT NOT NULL,
    category VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'Medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: predictions
-- Monthly predictions
-- ============================================
CREATE TABLE IF NOT EXISTS predictions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    predicted_month VARCHAR(20),
    predicted_kwh DOUBLE,
    predicted_bill DOUBLE,
    confidence VARCHAR(50),
    actual_kwh DOUBLE DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INSERT DEMO DATA
-- ============================================

-- Default admin user
INSERT INTO users (username, password, full_name, email, role) VALUES
('admin', 'admin123', 'System Admin', 'admin@smartenergy.com', 'admin');

-- Buildings
INSERT INTO buildings (name, address, floors, total_rooms) VALUES
('Main Building', '123 College Road, Kolhapur', 3, 12),
('Annex Block', '125 College Road, Kolhapur', 2, 8);

-- Rooms
INSERT INTO rooms (name, building_id, floor_number, room_type) VALUES
('Living Room', 1, 1, 'Common'),
('Bedroom', 1, 1, 'Personal'),
('Kitchen', 1, 1, 'Utility'),
('Study Room', 1, 2, 'Academic');

-- Appliances (AC is slightly abnormal for demo)
INSERT INTO appliances (name, type, room, power_watts, expected_hours, actual_hours, health_score, status) VALUES
('AC', 'Cooling', 'Living Room', 1500, 6, 8.5, 72, 'Monitor'),
('Refrigerator', 'Cooling', 'Kitchen', 200, 24, 24, 88, 'Good'),
('Fan', 'Ventilation', 'Bedroom', 75, 8, 7.5, 96, 'Good'),
('LED Light', 'Lighting', 'Study Room', 12, 6, 6.2, 92, 'Good'),
('TV', 'Electronics', 'Living Room', 100, 4, 5, 90, 'Good'),
('Computer', 'Electronics', 'Study Room', 250, 6, 5.5, 85, 'Good');

-- Energy readings (last 7 days for AC)
INSERT INTO energy_readings (appliance_id, reading_kwh, reading_date) VALUES
(1, 9.0, DATE_SUB(CURDATE(), INTERVAL 7 DAY)),
(1, 9.5, DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
(1, 10.2, DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
(1, 11.0, DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
(1, 11.5, DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(1, 12.0, DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(1, 12.75, DATE_SUB(CURDATE(), INTERVAL 1 DAY));

-- Energy readings for Refrigerator
INSERT INTO energy_readings (appliance_id, reading_kwh, reading_date) VALUES
(2, 4.8, DATE_SUB(CURDATE(), INTERVAL 7 DAY)),
(2, 4.7, DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
(2, 4.9, DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
(2, 4.8, DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
(2, 4.8, DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(2, 4.7, DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(2, 4.8, DATE_SUB(CURDATE(), INTERVAL 1 DAY));

-- Budget data
INSERT INTO budgets (month, year, budget_amount, actual_amount, tariff) VALUES
('October', 2026, 8000, 6900, 8.0),
('September', 2026, 8000, 7200, 8.0),
('August', 2026, 7500, 7100, 8.0);

-- Weather data
INSERT INTO weather_data (temperature, humidity, feels_like, wind_speed, weather_condition, location) VALUES
(28, 68, 31, 12, 'Partly Cloudy', 'Kolhapur');

-- Appliance health history (AC shows degradation)
INSERT INTO appliance_health (appliance_id, health_score, deviation_pct, status, checked_date) VALUES
(1, 90, 5, 'Good', DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
(1, 85, 8, 'Good', DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
(1, 78, 17, 'Monitor', DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(1, 74, 21, 'Warning', DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(1, 72, 23, 'Monitor', DATE_SUB(CURDATE(), INTERVAL 1 DAY));

-- Anomalies
INSERT INTO anomalies (appliance_id, anomaly_type, description, severity) VALUES
(1, 'High Consumption', 'AC consumption 42% higher than expected', 'Warning'),
(1, 'Persistent Deviation', 'AC showing abnormal consumption for 5 consecutive days', 'Danger');

-- Recommendations
INSERT INTO recommendations (recommendation_text, category, priority) VALUES
('Your AC accounts for 38% of energy consumption. Set temperature to 24-26°C.', 'Appliance', 'High'),
('Consider reducing TV usage during inactive hours.', 'Usage', 'Medium'),
('You may exceed monthly budget by ₹450.', 'Budget', 'High'),
('Unaccounted consumption detected. Check for unknown devices.', 'System', 'Medium');

-- Predictions
INSERT INTO predictions (predicted_month, predicted_kwh, predicted_bill, confidence) VALUES
('February 2027', 320, 2560, 'Moderate (75-90%)');

-- ============================================
-- VERIFY: Show all tables
-- ============================================
SHOW TABLES;
SELECT 'Database setup complete!' AS Status;
