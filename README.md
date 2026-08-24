# Last-Mile Delivery Tracker

A comprehensive delivery management platform with auto-calculated charges, intelligent agent auto-assignment, live map tracking, immutable status timelines, and role-based access for Customers, Agents, and Admins.

## Features & Architecture Highlights

1. **Dynamic Rate Calculation Engine**:
   - **Volumetric Weight**: calculated as $\frac{L \times W \times H}{5000}$.
   - **Billable Weight**: higher of Actual Weight vs. Volumetric Weight.
   - **Zone Detection**: Matches pickup and drop pincodes to defined zones.
   - **Rate Cards**: Calculates Intra-Zone vs. Inter-Zone rates dynamically with COD surcharges.
2. **Intelligent Auto-Assignment**:
   - Haversine distance formula matches active delivery agents to pickup coordinates.
3. **Immutable Tracking Lifecycle**:
   - Every status transition is logged with timestamp, actor, notes, and geographic coordinates.
   - Support for rescheduling failed delivery attempts with agent reassignment.
4. **Multi-Role Dashboards**:
   - **Customer**: Order placement with rate breakdown preview, order history, live map tracking.
   - **Agent**: Assigned task queue, quick status updates, live GPS coordinate transmitter.
   - **Admin**: Control center analytics, zone builder, rate card configuration matrix, order override panel.

## Quick Start Guide

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

### 3. Demo Login Credentials
- **Customer**: `customer@demo.com` / `password123`
- **Delivery Agent**: `agent1@demo.com` / `password123`
- **Admin**: `admin@demo.com` / `password123`
