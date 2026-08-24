-- Database Schema for Last-Mile Delivery Tracker (PostgreSQL)

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
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  pincodes TEXT[] NOT NULL,
  center_lat NUMERIC(10, 6),
  center_lng NUMERIC(10, 6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rate_cards (
  id VARCHAR(50) PRIMARY KEY,
  order_type VARCHAR(10) NOT NULL, -- B2B, B2C
  is_intra_zone BOOLEAN NOT NULL,
  base_rate NUMERIC(10, 2) NOT NULL,
  per_kg_rate NUMERIC(10, 2) NOT NULL,
  cod_surcharge_rate NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) REFERENCES users(id),
  pickup_address TEXT NOT NULL,
  pickup_pincode VARCHAR(20) NOT NULL,
  pickup_zone_id VARCHAR(50) REFERENCES zones(id),
  drop_address TEXT NOT NULL,
  drop_pincode VARCHAR(20) NOT NULL,
  drop_zone_id VARCHAR(50) REFERENCES zones(id),
  length NUMERIC(10, 2) NOT NULL,
  width NUMERIC(10, 2) NOT NULL,
  height NUMERIC(10, 2) NOT NULL,
  actual_weight NUMERIC(10, 2) NOT NULL,
  volumetric_weight NUMERIC(10, 2) NOT NULL,
  billable_weight NUMERIC(10, 2) NOT NULL,
  order_type VARCHAR(10) NOT NULL, -- B2B, B2C
  payment_type VARCHAR(10) NOT NULL, -- PREPAID, COD
  base_charge NUMERIC(10, 2) NOT NULL,
  weight_charge NUMERIC(10, 2) NOT NULL,
  cod_surcharge NUMERIC(10, 2) NOT NULL,
  total_charge NUMERIC(10, 2) NOT NULL,
  status VARCHAR(30) NOT NULL,
  assigned_agent_id VARCHAR(50) REFERENCES users(id),
  reschedule_date VARCHAR(50),
  reschedule_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tracking_histories (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) REFERENCES orders(id),
  status VARCHAR(30) NOT NULL,
  actor VARCHAR(50) NOT NULL,
  actor_id VARCHAR(50),
  notes TEXT,
  lat NUMERIC(10, 6),
  lng NUMERIC(10, 6),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
