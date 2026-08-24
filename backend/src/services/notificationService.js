class NotificationService {
  async sendStatusEmail(customerEmail, orderId, newStatus, extraInfo = '') {
    console.log(`[EMAIL NOTIFICATION] To: ${customerEmail} | Order: ${orderId} | Status Updated: ${newStatus} ${extraInfo ? `(${extraInfo})` : ''}`);
    return true;
  }

  async sendStatusSMS(customerPhone, orderId, newStatus) {
    if (!customerPhone) return;
    console.log(`[SMS NOTIFICATION] To: ${customerPhone} | Order: ${orderId} is now ${newStatus}.`);
    return true;
  }
}

module.exports = new NotificationService();
