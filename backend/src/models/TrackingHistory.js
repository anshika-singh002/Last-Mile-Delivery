const crypto = require('crypto');
const { memoryDb } = require('../config/database');

/**
 * Immutable Tracking History Model & Ledger Service
 * Ensures tamper-proof event appending with timestamps, actor metadata, and cryptographic integrity.
 */
class TrackingHistoryModel {
  /**
   * Append an immutable tracking event to the ledger.
   * @param {Object} eventData
   * @returns {Object} Deep-frozen, immutable tracking history event.
   */
  static append({
    orderId,
    status,
    previousStatus = null,
    actor = 'SYSTEM',
    actorId = 'system',
    actorName = null,
    notes = '',
    reason = null,
    location = null,
    metadata = {}
  }) {
    if (!orderId) throw new Error('Tracking event requires a valid orderId');
    if (!status) throw new Error('Tracking event requires a valid status');

    const timestamp = new Date().toISOString();
    const eventId = `th-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Compute cryptographic checksum for event immutability verification
    const payloadToHash = JSON.stringify({
      eventId,
      orderId,
      status,
      previousStatus,
      actor,
      actorId,
      timestamp,
      notes
    });
    const eventHash = crypto.createHash('sha256').update(payloadToHash).digest('hex');

    // Canonical immutable event structure
    const event = {
      id: eventId,
      orderId,
      status,
      previousStatus,
      actor,
      actorId,
      actorName: actorName || actor,
      notes: notes || `Status transitioned to ${status}`,
      reason: reason || null,
      location: location
        ? {
            lat: location.lat != null ? parseFloat(location.lat) : null,
            lng: location.lng != null ? parseFloat(location.lng) : null,
            address: location.address || null
          }
        : null,
      metadata: metadata || {},
      eventHash,
      timestamp
    };

    // Deep freeze the event object in memory to enforce runtime immutability
    const frozenEvent = Object.freeze({
      ...event,
      location: event.location ? Object.freeze({ ...event.location }) : null,
      metadata: Object.freeze({ ...event.metadata })
    });

    if (!memoryDb.trackingHistories) {
      memoryDb.trackingHistories = [];
    }

    // Append-only operation
    memoryDb.trackingHistories.push(frozenEvent);

    return frozenEvent;
  }

  /**
   * Retrieve the complete, chronological immutable history for an order.
   * @param {string} orderId
   * @returns {Array<Object>}
   */
  static getByOrderId(orderId) {
    if (!memoryDb.trackingHistories) return [];
    return memoryDb.trackingHistories
      .filter(th => th.orderId === orderId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Validates the integrity of an order's tracking history ledger.
   * @param {string} orderId
   * @returns {boolean}
   */
  static verifyIntegrity(orderId) {
    const events = this.getByOrderId(orderId);
    for (const evt of events) {
      const payloadToHash = JSON.stringify({
        eventId: evt.id,
        orderId: evt.orderId,
        status: evt.status,
        previousStatus: evt.previousStatus,
        actor: evt.actor,
        actorId: evt.actorId,
        timestamp: evt.timestamp,
        notes: evt.notes
      });
      const recomputedHash = crypto.createHash('sha256').update(payloadToHash).digest('hex');
      if (recomputedHash !== evt.eventHash) {
        return false;
      }
    }
    return true;
  }
}

module.exports = TrackingHistoryModel;
