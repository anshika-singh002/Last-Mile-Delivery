let ioInstance = null;

class NotificationService {
  setSocketIO(io) {
    ioInstance = io;
  }

  async sendStatusEmail(customerEmail, orderId, newStatus, extraInfo = '') {
    console.log(`[EMAIL NOTIFICATION] To: ${customerEmail} | Order: ${orderId} | Status: ${newStatus} ${extraInfo ? `(${extraInfo})` : ''}`);
    return true;
  }

  async sendStatusSMS(customerPhone, orderId, newStatus) {
    if (!customerPhone) return;
    console.log(`[SMS NOTIFICATION] To: ${customerPhone} | Order: ${orderId} is now ${newStatus}.`);
    return true;
  }

  async notifyFailedDelivery(customer, orderId, reason) {
    console.log(`⚠️ [ALERT - FAILED DELIVERY] Customer: ${customer.email} | Order: ${orderId} | Reason: ${reason || 'Delivery attempt failed'}`);
    await this.sendStatusEmail(
      customer.email,
      orderId,
      'FAILED',
      `Delivery attempt failed: ${reason || 'Recipient unavailable'}. Please reschedule.`
    );
    if (customer.phone) {
      await this.sendStatusSMS(customer.phone, orderId, 'FAILED - Please reschedule your delivery date');
    }

    if (ioInstance) {
      ioInstance.to(`order_${orderId}`).emit('delivery_failed_alert', {
        orderId,
        status: 'FAILED',
        reason: reason || 'Delivery attempt unsuccessful',
        actionRequired: 'RESCHEDULE',
        timestamp: new Date().toISOString()
      });
      ioInstance.to(`order_${orderId}`).emit('status_changed', {
        orderId,
        status: 'FAILED',
        notes: `Delivery attempt failed: ${reason || 'Recipient unavailable'}`,
        timestamp: new Date().toISOString()
      });
    }
    return true;
  }

  async notifyRescheduled(customer, orderId, rescheduleDate, assignedAgent) {
    console.log(`📅 [ALERT - RESCHEDULED] Customer: ${customer.email} | Order: ${orderId} | New Date: ${rescheduleDate} | Reassigned: ${assignedAgent ? assignedAgent.name : 'Queued'}`);
    await this.sendStatusEmail(
      customer.email,
      orderId,
      'ASSIGNED',
      `Delivery rescheduled for ${rescheduleDate}. Reassigned to: ${assignedAgent ? assignedAgent.name : 'Nearest Available Agent'}`
    );
    if (customer.phone) {
      await this.sendStatusSMS(customer.phone, orderId, `ASSIGNED - Delivery rescheduled for ${rescheduleDate}`);
    }

    if (ioInstance) {
      ioInstance.to(`order_${orderId}`).emit('status_changed', {
        orderId,
        status: 'ASSIGNED',
        notes: `Order rescheduled for ${rescheduleDate}. Agent: ${assignedAgent ? assignedAgent.name : 'Unassigned'}`,
        rescheduleDate,
        assignedAgent: assignedAgent ? { id: assignedAgent.id, name: assignedAgent.name } : null,
        timestamp: new Date().toISOString()
      });
    }
    return true;
  }
}

module.exports = new NotificationService();
