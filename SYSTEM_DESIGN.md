# Last-Mile Delivery Tracker - System Design Document

## 1. Architectural Overview
The Last-Mile Delivery Tracker is a distributed, real-time logistics platform designed for high throughput, sub-second dispatch decisions, and verifiable delivery auditing. The architecture decouples client interfaces (Customer, Agent, Admin) from core business engines via REST APIs and WebSockets.

```
+-----------------------------------------------------------------------------------+
|                            Client Interfaces (React / Vite)                       |
|   [ Customer Portal ]      [ Agent Mobile Hub ]        [ Admin Control Panel ]    |
+-----------------------------------------------------------------------------------+
                                   │  ▲
                         REST / JSON  │  │ WebSockets (Socket.io)
                                   ▼  │
+-----------------------------------------------------------------------------------+
|                             Express Backend API Gateway                           |
|  [ Auth / JWT ]  [ Order Service ]  [ Rate Engine ]  [ Dispatcher ]  [ Notifier ]  |
+-----------------------------------------------------------------------------------+
                                   │
                                   ▼
+-----------------------------------------------------------------------------------+
|                             Storage & Event Ledgers                               |
| [ Relational DB Models ]    [ Immutable SHA-256 Ledger ]    [ Notification Logs ]  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Dynamic Rate Calculation Engine
Delivery pricing evaluates both volumetric and actual weight to prevent undercharging bulky packages:
1. **Volumetric Weight**:
   $$V = \frac{\text{Length} \times \text{Width} \times \text{Height}}{5000} \text{ (in kg)}$$
2. **Billable Weight**:
   $$W_{\text{billable}} = \max(W_{\text{actual}}, V)$$
3. **Zone Mapping & Pricing**:
   - Matches pickup and drop pincodes against registered operational zones.
   - If $\text{Zone}_{\text{pickup}} = \text{Zone}_{\text{drop}}$, scope is **Intra-Zone**; otherwise **Inter-Zone**.
   - Pulls applicable `RateCard(OrderType, Scope)`.
4. **Total Charge Formulation**:
   $$\text{Total} = \text{BaseRate} + (W_{\text{billable}} \times \text{PerKgRate}) + \text{CODSurcharge}$$

---

## 3. Nearest-Neighbor Auto-Assignment & Capacity Management
1. **Agent State & Load**:
   - Each agent maintains an online status (`isAvailable`), a home zone, live GPS coordinates, and an active task cap (`maxActiveDeliveries = 3`).
2. **Dispatch Algorithm**:
   - Filters eligible agents where $\text{activeTasks} < \text{maxActiveDeliveries}$ and $\text{isAvailable} = \text{true}$.
   - Computes geographic distance using the Haversine formula:
     $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
   - Priority 1: Same-zone agents ranked by distance and lowest active workload.
   - Priority 2: Adjacent-zone nearest agents.
3. **Unassigned Queue Fallback**:
   - Orders with no available agents transition to `CREATED` (pending queue).
   - When an agent finishes a delivery or comes online, `processPendingQueue()` triggers auto-assignment.

---

## 4. Immutable Lifecycle Audit Ledger
1. **Append-Only Model**: State changes (`CREATED`, `ASSIGNED`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`) append frozen events to `tracking_histories`.
2. **Tamper Verification**: Each event calculates a SHA-256 hash:
   $$\text{Hash} = \text{SHA256}(\text{orderId} + \text{status} + \text{actor} + \text{timestamp} + \text{previousStatus})$$
3. **Ledger Audit**: `verifyIntegrity(orderId)` recalculates sequential hashes to detect payload tampering.

---

## 5. Failed Delivery & Reschedule Protocol
1. **Failure Trigger**: When an agent reports `FAILED`, the order status updates, agent capacity is freed, and real-time alerts are emitted via WebSockets, Email, and SMS.
2. **Customer Reschedule**: The customer selects a new delivery date and adds delivery instructions.
3. **Reassignment Cycle**: The order transitions to `ASSIGNED` and executes a fresh nearest-neighbor dispatch cycle.

---

## 6. Multi-Channel Notification Pipeline
1. **Nodemailer (Email)**: Sends branded HTML templates with status badges, delivery ETAs, and action links.
2. **Twilio (SMS)**: Dispatches transactional SMS updates for time-sensitive status changes.
3. **Socket.io (WebSockets)**: Streams live GPS agent coordinates and status updates directly to the map interface.
