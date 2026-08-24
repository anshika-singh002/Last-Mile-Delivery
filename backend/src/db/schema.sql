-- Database Schema for Last-Mile Delivery Tracker

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL, -- CUSTOMER, AGENT, ADMIN
  phone VARCHAR(30),
  address TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  current_zone_id VARCHAR(50),
  current_lat NUMERIC(10, 6),
  current_lng NUMERIC(10, 6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  city VARCHAR(100) NOT NULL,
  center_lat NUMERIC(10, 6),
  center_lng NUMERIC(10, 6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zone_pincodes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  zone_id INT NOT NULL,
  pincode VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(zone_id, pincode),
  FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rate_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  zone_from_id INT NOT NULL,
  zone_to_id INT NOT NULL,
  order_type ENUM('B2B', 'B2C') NOT NULL,
  zone_scope ENUM('intra', 'inter') NOT NULL,
  rate_per_kg DECIMAL(10,2) NOT NULL,
  base_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  cod_surcharge DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(zone_from_id, zone_to_id, order_type, zone_scope),
  FOREIGN KEY (zone_from_id) REFERENCES zones(id) ON DELETE CASCADE,
  FOREIGN KEY (zone_to_id) REFERENCES zones(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id VARCHAR(50) NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_pincode VARCHAR(20) NOT NULL,
  pickup_zone_id INT,
  drop_address TEXT NOT NULL,
  drop_pincode VARCHAR(20) NOT NULL,
  drop_zone_id INT,
  length_cm DECIMAL(10,2) NOT NULL,
  breadth_cm DECIMAL(10,2) NOT NULL,
  height_cm DECIMAL(10,2) NOT NULL,
  actual_weight_kg DECIMAL(10,2) NOT NULL,
  volumetric_weight_kg DECIMAL(10,2) NOT NULL,
  billable_weight_kg DECIMAL(10,2) NOT NULL,
  order_type ENUM('B2B', 'B2C') NOT NULL,
  payment_type ENUM('PREPAID', 'COD') NOT NULL,
  charge_breakdown JSON,
  total_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  cod_surcharge DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
  assigned_agent_id VARCHAR(50),
  reschedule_date DATE,
  reschedule_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (pickup_zone_id) REFERENCES zones(id),
  FOREIGN KEY (drop_zone_id) REFERENCES zones(id),
  FOREIGN KEY (assigned_agent_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  actor_type ENUM('CUSTOMER', 'ADMIN', 'AGENT', 'SYSTEM') NOT NULL,
  actor_id VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tracking_histories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  status VARCHAR(30) NOT NULL,
  actor VARCHAR(50) NOT NULL,
  actor_id VARCHAR(50),
  notes TEXT,
  lat NUMERIC(10, 6),
  lng NUMERIC(10, 6),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id)
);