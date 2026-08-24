# Last-Mile Delivery Tracker - System Design Document

## 1. Rate Calculation Engine
The rate engine evaluates delivery charges dynamically based on:
1. **Volumetric Weight**: $V = \frac{L \times W \times H}{5000}$.
2. **Billable Weight**: $W_{\text{billable}} = \max(W_{\text{actual}}, V)$.
3. **Zone Mapping**: Checks pickup pincode and drop pincode. If $\text{Zone}_{\text{pickup}} == \text{Zone}_{\text{drop}}$, it is classified as **Intra-Zone**, otherwise **Inter-Zone**.
4. **Rate Card Lookup**: Matches $( \text{OrderType [B2B/B2C]}, \text{IsIntraZone} )$ to pull `base_rate`, `per_kg_rate`, and `cod_surcharge_rate`.
5. **Total Formula**: $\text{Total} = \text{BaseRate} + (W_{\text{billable}} \times \text{PerKgRate}) + \text{CODSurcharge}$.

## 2. Zone Detection & Auto-Assignment
- Pincodes map to discrete geographic zones.
- When an order is created, the system uses the Haversine formula to compute distance between the pickup zone center and all available delivery agents' coordinates:
  $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
- The agent with the minimum distance is assigned automatically.

## 3. Failed Delivery & Reschedule Protocol
- When an agent marks a delivery status as `FAILED`, the customer is notified immediately via email/SMS and WebSockets.
- The customer can select a new delivery date and specify instructions via the Reschedule modal.
- Upon confirmation, the order status resets to `ASSIGNED` and triggers a fresh auto-assignment cycle to find an active agent.
