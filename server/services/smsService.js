const axios = require('axios');
const db = require('../db');

/**
 * Format message template with actual loan and borrower variables
 */
function formatMessage(template, params) {
  let text = template;
  Object.keys(params).forEach(key => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    text = text.replace(regex, params[key] ?? '');
  });
  return text;
}

/**
 * Clean phone number to ensure standard 10 or 12 digit format
 */
function cleanPhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Send SMS using the provider configured in lender_settings
 */
async function sendSms({
  clientId = 1,
  loanId = null,
  borrowerId = null,
  recipientType, // 'BORROWER' or 'LENDER'
  recipientPhone,
  recipientName = '',
  messageText,
  triggerType = 'AUTO_CRON',
  dueDateCycle = ''
}) {
  const settings = db.prepare('SELECT * FROM lender_settings WHERE client_id = ?').get(clientId) || {};
  const provider = (settings.sms_provider || 'SIMULATOR').toUpperCase();
  const cleanedPhone = cleanPhone(recipientPhone);

  let status = 'SIMULATED';
  let errorMessage = '';

  try {
    if (provider === 'TWILIO' && settings.twilio_account_sid && settings.twilio_auth_token && settings.twilio_phone_number) {
      // Twilio SMS API
      const auth = Buffer.from(`${settings.twilio_account_sid}:${settings.twilio_auth_token}`).toString('base64');
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${settings.twilio_account_sid}/Messages.json`;
      
      const toPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+91${cleanedPhone}`; // Default to +91 if Indian length
      const form = new URLSearchParams();
      form.append('To', toPhone);
      form.append('From', settings.twilio_phone_number);
      form.append('Body', messageText);

      await axios.post(twilioUrl, form.toString(), {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      status = 'SENT';
    } else if (provider === 'FAST2SMS' && settings.fast2sms_api_key) {
      // Fast2SMS API (Indian Gateway)
      const res = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
        route: 'q', // Quick SMS
        message: messageText,
        language: 'english',
        flash: 0,
        numbers: cleanedPhone
      }, {
        headers: {
          'authorization': settings.fast2sms_api_key,
          'Content-Type': 'application/json'
        }
      });

      if (res.data && res.data.return === true) {
        status = 'SENT';
      } else {
        status = 'FAILED';
        errorMessage = res.data?.message || 'Fast2SMS returned error';
      }
    } else {
      // SIMULATOR mode: Always succeeds, logs in database
      status = 'SIMULATED';
      console.log(`\n================== [SMS SIMULATOR] ==================`);
      console.log(`To: ${recipientName} (${cleanedPhone}) [${recipientType}]`);
      console.log(`Trigger: ${triggerType} | Provider: ${provider}`);
      console.log(`Message: ${messageText}`);
      console.log(`====================================================\n`);
    }
  } catch (err) {
    status = 'FAILED';
    errorMessage = err.response?.data?.message || err.message;
    console.error(`Error sending SMS to ${cleanedPhone}:`, errorMessage);
  }

  // Record in sms_logs table
  const insertStmt = db.prepare(`
    INSERT INTO sms_logs (client_id, loan_id, borrower_id, recipient_type, recipient_phone, recipient_name, message_text, trigger_type, due_date_cycle, status, error_message, sent_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(
    clientId,
    loanId,
    borrowerId,
    recipientType,
    cleanedPhone,
    recipientName,
    messageText,
    triggerType,
    dueDateCycle,
    status,
    errorMessage,
    new Date().toISOString()
  );

  return {
    id: result.lastInsertRowid,
    status,
    errorMessage,
    recipientPhone: cleanedPhone,
    recipientName,
    messageText
  };
}

/**
 * Generate a direct WhatsApp click-to-chat URL with pre-filled message
 */
function generateWhatsAppUrl(phone, messageText) {
  let cleaned = cleanPhone(phone);
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(messageText)}`;
}

module.exports = {
  sendSms,
  formatMessage,
  generateWhatsAppUrl,
  cleanPhone
};
