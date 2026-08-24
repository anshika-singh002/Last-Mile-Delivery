const nodemailer = require('nodemailer');
const twilio = require('twilio');
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER
} = require('../config/env');

let ioInstance = null;

class NotificationService {
  constructor() {
    this.transporter = null;
    this.twilioClient = null;
    this.notificationLog = [];

    this.initProviders();
  }

  initProviders() {
    // 1. Initialize Nodemailer Transporter
    if (SMTP_HOST && SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT, 10),
        secure: SMTP_SECURE,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        }
      });
      console.log(`✉️ [EMAIL PROVIDER] Configured SMTP via ${SMTP_HOST}:${SMTP_PORT}`);
    } else {
      // In development or when credentials are not supplied, initialize a mock transport with Ethereal compatibility
      this.transporter = nodemailer.createTransport({
        jsonTransport: true
      });
      console.log('✉️ [EMAIL PROVIDER] Initialized development JSON mailer (Ready for SMTP credentials)');
    }

    // 2. Initialize Twilio SMS Client
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
      try {
        this.twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        console.log('📱 [SMS PROVIDER] Twilio client initialized');
      } catch (err) {
        console.error('Failed to initialize Twilio client:', err.message);
      }
    } else {
      console.log('📱 [SMS PROVIDER] Initialized mock SMS dispatcher (Ready for Twilio credentials)');
    }
  }

  setSocketIO(io) {
    ioInstance = io;
  }

  /**
   * Dispatches branded HTML Email notification on every delivery lifecycle transition.
   */
  async sendStatusEmail(customerEmail, orderId, newStatus, extraInfo = '') {
    if (!customerEmail) return false;

    const subject = `[Last-Mile Delivery] Order #${orderId} Update: ${newStatus}`;
    const statusBadges = {
      CREATED: '#0284c7',
      ASSIGNED: '#38bdf8',
      PICKED_UP: '#6366f1',
      IN_TRANSIT: '#8b5cf6',
      OUT_FOR_DELIVERY: '#f59e0b',
      DELIVERED: '#10b981',
      FAILED: '#f43f5e'
    };
    const color = statusBadges[newStatus] || '#38bdf8';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #020617; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
        <div style="text-align: center; padding-bottom: 16px; border-bottom: 1px solid #1e293b;">
          <h2 style="color: #38bdf8; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">Last-Mile Delivery Tracker</h2>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">Live Shipment Status Dispatch</p>
        </div>
        
        <div style="padding: 24px 0; text-align: center;">
          <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 8px;">Your delivery package order has transitioned:</p>
          <div style="display: inline-block; background-color: ${color}20; border: 1px solid ${color}; color: ${color}; font-weight: bold; font-size: 18px; padding: 8px 24px; border-radius: 9999px; margin-bottom: 16px;">
            ${newStatus}
          </div>
          <p style="font-size: 16px; font-weight: bold; color: #ffffff; margin: 0;">Order #${orderId}</p>
          ${extraInfo ? `<p style="font-size: 13px; color: #94a3b8; background-color: #0f172a; padding: 12px; border-radius: 8px; margin-top: 16px; border: 1px solid #1e293b;">${extraInfo}</p>` : ''}
        </div>

        <div style="text-align: center; padding-top: 16px; border-top: 1px solid #1e293b;">
          <p style="font-size: 11px; color: #64748b; margin: 0;">Automated notification from Last-Mile Delivery Tracker platform.</p>
        </div>
      </div>
    `;

    try {
      const mailOptions = {
        from: EMAIL_FROM,
        to: customerEmail,
        subject,
        text: `Order #${orderId} status changed to ${newStatus}. ${extraInfo}`,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      const logEntry = {
        type: 'EMAIL',
        to: customerEmail,
        orderId,
        status: newStatus,
        messageId: info.messageId || `msg-${Date.now()}`,
        timestamp: new Date().toISOString(),
        success: true
      };
      this.notificationLog.push(logEntry);
      console.log(`📧 [EMAIL SENT] To: ${customerEmail} | Order: ${orderId} | Status: ${newStatus}`);
      return logEntry;
    } catch (err) {
      console.error(`❌ [EMAIL ERROR] Failed to send email to ${customerEmail}:`, err.message);
      return false;
    }
  }

  /**
   * Dispatches SMS message via Twilio or fallback simulated provider.
   */
  async sendStatusSMS(customerPhone, orderId, newStatus, messageText = null) {
    if (!customerPhone) return false;

    const body = messageText || `Last-Mile Update: Order #${orderId} is now ${newStatus}.`;

    try {
      let messageSid = `mock-sms-${Date.now()}`;

      if (this.twilioClient && TWILIO_PHONE_NUMBER) {
        const twilioRes = await this.twilioClient.messages.create({
          body,
          from: TWILIO_PHONE_NUMBER,
          to: customerPhone
        });
        messageSid = twilioRes.sid;
        console.log(`📱 [TWILIO SMS SENT] SID: ${messageSid} | To: ${customerPhone}`);
      } else {
        console.log(`📱 [SMS DISPATCHED] To: ${customerPhone} | Body: "${body}"`);
      }

      const logEntry = {
        type: 'SMS',
        to: customerPhone,
        orderId,
        status: newStatus,
        sid: messageSid,
        body,
        timestamp: new Date().toISOString(),
        success: true
      };
      this.notificationLog.push(logEntry);
      return logEntry;
    } catch (err) {
      console.error(`❌ [SMS ERROR] Failed to send SMS to ${customerPhone}:`, err.message);
      return false;
    }
  }

  async notifyFailedDelivery(customer, orderId, reason) {
    console.log(`⚠️ [ALERT - FAILED DELIVERY] Customer: ${customer.email} | Order: ${orderId} | Reason: ${reason || 'Delivery attempt failed'}`);
    await this.sendStatusEmail(
      customer.email,
      orderId,
      'FAILED',
      `Delivery attempt failed: ${reason || 'Recipient unavailable'}. Please reschedule via your dashboard.`
    );
    if (customer.phone) {
      await this.sendStatusSMS(
        customer.phone,
        orderId,
        'FAILED',
        `Last-Mile Alert: Delivery attempt for Order #${orderId} failed (${reason || 'Recipient unavailable'}). Please visit tracking portal to reschedule.`
      );
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
      await this.sendStatusSMS(
        customer.phone,
        orderId,
        'ASSIGNED',
        `Last-Mile Update: Order #${orderId} rescheduled for ${rescheduleDate}. Assigned agent: ${assignedAgent ? assignedAgent.name : 'Searching'}.`
      );
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

  getNotificationLogs(orderId = null) {
    if (orderId) {
      return this.notificationLog.filter(l => l.orderId === orderId);
    }
    return this.notificationLog;
  }
}

module.exports = new NotificationService();
