-- ==============================================================================
-- Comprehensive Database Schema & Data Models for Last-Mile Delivery Platform
-- ==============================================================================

-- 1. Users & Roles (CUSTOMER, AGENT, ADMIN)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL, -- CUSTOMER, AGENT, ADMIN
  phone VARCHAR(30),
  address TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  max_active_deliveries INT DEFAULT 3,
  current_zone_id VARCHAR(50),
  current_lat NUMERIC(10, 6),
  current_lng NUMERIC(10, 6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_zone (current_zone_id)
);

-- 2. Delivery Zones
CREATE TABLE IF NOT EXISTS zones (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  city VARCHAR(100) NOT NULL,
  center_lat NUMERIC(10, 6),
  center_lng NUMERIC(10, 6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Zone Pincodes Mapping
CREATE TABLE IF NOT EXISTS zone_pincodes (
  id VARCHAR(50) PRIMARY KEY,
  zone_id VARCHAR(50) NOT NULL,
  pincode VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(zone_id, pincode),
  FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE,
  INDEX idx_zone_pincode (pincode)
);

-- 4. Rate Cards (B2B, B2C, Intra-zone, Inter-zone)
CREATE TABLE IF NOT EXISTS rate_cards (
  id VARCHAR(50) PRIMARY KEY,
  order_type VARCHAR(20) NOT NULL,       -- B2B, B2C
  is_intra_zone BOOLEAN NOT NULL DEFAULT TRUE,
  base_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  per_kg_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  cod_surcharge_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(order_type, is_intra_zone)
);

-- 5. Orders & Reschedule Flow Data Model
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) NOT NULL,
  customer_name VARCHAR(100),
  pickup_address TEXT NOT NULL,
  pickup_pincode VARCHAR(20) NOT NULL,
  pickup_zone_id VARCHAR(50),
  drop_address TEXT NOT NULL,
  drop_pincode VARCHAR(20) NOT NULL,
  drop_zone_id VARCHAR(50),
  length_cm DECIMAL(10,2) NOT NULL,
  width_cm DECIMAL(10,2) NOT NULL,
  height_cm DECIMAL(10,2) NOT NULL,
  actual_weight_kg DECIMAL(10,2) NOT NULL,
  volumetric_weight_kg DECIMAL(10,2) NOT NULL,
  billable_weight_kg DECIMAL(10,2) NOT NULL,
  order_type VARCHAR(20) NOT NULL,        -- B2B, B2C
  payment_type VARCHAR(20) NOT NULL,      -- PREPAID, COD
  base_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  weight_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  cod_surcharge DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'CREATED', -- CREATED, ASSIGNED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED
  assigned_agent_id VARCHAR(50),
  reschedule_date DATE,
  reschedule_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_customer (customer_id),
  INDEX idx_orders_agent (assigned_agent_id),
  INDEX idx_orders_status (status),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (pickup_zone_id) REFERENCES zones(id),
  FOREIGN KEY (drop_zone_id) REFERENCES zones(id),
  FOREIGN KEY (assigned_agent_id) REFERENCES users(id)
);

-- 6. Assignment History (Auto-assignment, Manual override, Queue reassignments)
CREATE TABLE IF NOT EXISTS assignment_histories (
  id VARCHAR(80) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  agent_id VARCHAR(50) NOT NULL,
  agent_name VARCHAR(100),
  assigned_by VARCHAR(50) NOT NULL,       -- SYSTEM, ADMIN, QUEUE_WORKER
  assignment_type VARCHAR(50) NOT NULL,   -- AUTO_ZONE_MATCH, AUTO_NEAREST_NEIGHBOR, MANUAL_OVERRIDE, RESCHEDULE_REASSIGN
  distance_km DECIMAL(10, 2),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_assign_order (order_id),
  INDEX idx_assign_agent (agent_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES users(id)
);

-- 7. Immutable Tracking & Status Event Ledger
CREATE TABLE IF NOT EXISTS tracking_histories (
  id VARCHAR(80) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  previous_status VARCHAR(50),
  actor VARCHAR(50) NOT NULL,             -- CUSTOMER, AGENT, ADMIN, SYSTEM
  actor_id VARCHAR(50) NOT NULL,
  actor_name VARCHAR(100),
  notes TEXT,
  reason VARCHAR(100),
  location JSON,                          -- { lat: number, lng: number, address: string }
  metadata JSON,                          -- { distanceKm, isZoneMatch, rescheduleDate, etc. }
  event_hash VARCHAR(64),                 -- Cryptographic SHA-256 Checksum
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_tracking_order_id (order_id),
  INDEX idx_tracking_timestamp (timestamp),
  INDEX idx_tracking_actor (actor_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id)
);

-- 8. Notifications Audit Ledger (Email, SMS, WebSockets)
CREATE TABLE IF NOT EXISTS notification_logs (
  id VARCHAR(80) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  recipient_type VARCHAR(50) NOT NULL,    -- CUSTOMER, AGENT
  channel VARCHAR(20) NOT NULL,           -- EMAIL, SMS, WEBSOCKET
  recipient_contact VARCHAR(100) NOT NULL,-- Email address or Phone number
  status_event VARCHAR(50) NOT NULL,      -- Status triggered (CREATED, ASSIGNED, PICKED_UP, etc.)
  provider VARCHAR(50) NOT NULL,          -- NODEMAILER, TWILIO, SOCKET_IO
  message_id VARCHAR(100),
  body TEXT,
  success BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_order (order_id),
  INDEX idx_notif_contact (recipient_contact),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);