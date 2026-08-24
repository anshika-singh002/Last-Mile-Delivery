# Last-Mile Delivery Tracker Platform

A full-stack, enterprise-grade Last-Mile Delivery platform featuring a dynamic rate calculation engine, intelligent nearest-neighbor auto-assignment, live map tracking with WebSockets, immutable lifecycle audit ledger, multi-channel email/SMS notification pipeline, and failed delivery reschedule protocols.

---

## 🌐 Live Production Deployment

- 🚀 **Live Web Application (Vercel)**: [https://last-mile-delivery-omega.vercel.app](https://last-mile-delivery-omega.vercel.app)
- ⚙️ **Live Backend API (Render)**: [https://last-mile-delivery-gep1.onrender.com](https://last-mile-delivery-gep1.onrender.com)
- 📡 **Live Real-time Socket.io Gateway**: Integrated seamlessly with the Backend API (powers live tracking map & instant alerts)

---

## 🌟 Key Features

1. **Dynamic Rate Calculation Engine**:
   - **Volumetric Weight**: Calculated using standard volumetric divisor: $\frac{L \times W \times H}{5000}$.
   - **Billable Weight**: $\max(\text{Actual Weight}, \text{Volumetric Weight})$.
   - **Zone Classification**: Maps pickup and drop pincodes to determine **Intra-Zone** vs. **Inter-Zone** delivery.
   - **Configurable Rate Cards**: Computes base charges, weight multiplier charges, and COD surcharges dynamically based on `orderType` (`B2B`, `B2C`) and scope.

2. **Intelligent Auto-Assignment & Workload Balance**:
   - Agent availability model with live online/offline toggle.
   - Workload capacity limits (`maxActiveDeliveries` per agent).
   - Zone-priority nearest-neighbor search using the Haversine distance formula:
     $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
   - Automatic fallback to pending dispatch queue when agents are at capacity or offline, with automatic dequeueing when agents go online or complete deliveries.

3. **Immutable Lifecycle Audit Ledger**:
   - Complete tracking history ledger with cryptographic SHA-256 event checksums (`eventHash`) to ensure tamper-evidence.
   - Captures previous state, new state, actor role & ID, timestamp, coordinates, and transit notes.
   - Integrity verification API (`GET /api/orders/:id/timeline`) validating zero history modification.

4. **Failed Delivery & Reschedule Flow**:
   - Real-time failure alerts dispatched to customers via WebSockets, Email, and SMS.
   - Dedicated reschedule modal allowing customers to choose a new delivery date and special instructions.
   - Automatic lifecycle reset to `ASSIGNED` with fresh nearest-neighbor agent reassignment.

5. **Multi-Channel Notifications**:
   - **Email**: Branded HTML status updates powered by Nodemailer.
   - **SMS**: Live dispatch alerts powered by the Twilio SDK.
   - **WebSockets**: Instant real-time map location updates and alert broadcasts powered by Socket.io.

---

## 🚀 Setup & Installation Guide

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
Backend runs on `http://localhost:5001`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

### 3. Demo Credentials
| Role | Email | Password |
|---|---|---|
| **Customer** | `customer@demo.com` | `password123` |
| **Delivery Agent** | `agent1@demo.com` | `password123` |
| **System Admin** | `admin@demo.com` | `password123` |

---

## 📐 Rate Calculation Logic

```
1. Volumetric Weight (kg) = (Length_cm * Width_cm * Height_cm) / 5000
2. Billable Weight (kg)   = max(Actual_Weight, Volumetric_Weight)
3. Zone Scope            = (Pickup_Zone_ID == Drop_Zone_ID) ? 'INTRA_ZONE' : 'INTER_ZONE'
4. Rate Card Lookup      = Match (Order_Type: B2B/B2C, Zone_Scope: INTRA/INTER)
5. Weight Charge ($)     = Billable_Weight * RateCard.perKgRate
6. Base Charge ($)       = RateCard.baseRate
7. COD Surcharge ($)     = (Payment_Type == 'COD') ? RateCard.codSurchargeRate : 0.00
---------------------------------------------------------------------------------
Total Delivery Charge ($)= Base Charge + Weight Charge + COD Surcharge
```

---

## 🗄️ Relational Database Schema & Entities

The platform data architecture is modeled across 8 relational entities:

1. **`users`**: Customer, Agent, and Admin profiles, availability flags (`is_available`), active capacity limits (`max_active_deliveries`), and zone assignments.
2. **`zones`**: Geographic operational regions with central coordinates.
3. **`zone_pincodes`**: Pincode-to-zone coverage mappings.
4. **`rate_cards`**: Intra/inter-zone pricing matrices for B2B and B2C orders.
5. **`orders`**: Dimensions, weights, charge breakdown, status lifecycle, and reschedule fields.
6. **`assignment_histories`**: Audit logs of auto-assignment decisions, nearest-neighbor distances, and manual dispatcher overrides.
7. **`tracking_histories`**: Append-only lifecycle event ledger with cryptographic SHA-256 checksums (`event_hash`).
8. **`notification_logs`**: Multi-channel notification audit table (Email, SMS, WebSockets).

---

## 📡 API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new customer or agent account.
- `POST /api/auth/login` — Authenticate and receive a signed JWT token.
- `GET /api/auth/me` — Retrieve current authenticated user profile.

### Orders (`/api/orders`)
- `POST /api/orders/preview-charge` — Dynamic rate calculation preview.
- `POST /api/orders` — Place order and trigger automated dispatcher.
- `GET /api/orders` — List orders with role-based filtering.
- `GET /api/orders/:id` — Fetch complete order details and assigned agent.
- `GET /api/orders/:id/timeline` — Fetch immutable tracking ledger & integrity verification.
- `PATCH /api/orders/:id/status` — Update delivery status and dispatch notifications.
- `POST /api/orders/:id/reschedule` — Customer delivery reschedule with agent reassignment.
- `POST /api/orders/:id/assign` — Admin manual agent override.
- `POST /api/orders/:id/auto-assign` — Trigger nearest-neighbor auto-assignment.

### Agent (`/api/agent`)
- `GET /api/agent/profile` — Get agent availability status, zone, and active load.
- `PATCH /api/agent/location` — Update live GPS coordinates and toggle availability.

### Admin (`/api/admin`)
- `GET /api/admin/analytics` — Platform metrics, revenue, active orders, and agent capacity.
- `GET /api/admin/notifications` — Notification audit logs.
- `GET /api/admin/zones` & `POST /api/admin/zones` — Zone builder.
- `GET /api/admin/rate-cards` & `PUT /api/admin/rate-cards/:id` — Rate card management.

---

## 🧪 Automated Testing

Run the automated integration test suites:
```bash
# Auto-assignment & capacity balancing tests
node backend/test_assignment.js

# Immutable tracking & SHA-256 integrity tests
node backend/test_tracking_history.js

# Failed delivery & reschedule lifecycle tests
node backend/test_failed_reschedule.js

# Nodemailer & Twilio notification pipeline tests
node backend/test_notifications.js
```
