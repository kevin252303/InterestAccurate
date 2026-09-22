const express = require('express');
const router = express.Router();
const db = require('../db');

// Get lender settings for current client
router.get('/', (req, res) => {
  try {
    const clientId = req.clientId || 1;
    let settings = db.prepare('SELECT * FROM lender_settings WHERE client_id = ?').get(clientId);
    
    if (!settings) {
      // Fallback: create row for client if missing
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
      db.prepare(`
        INSERT OR IGNORE INTO lender_settings (client_id, lender_name, business_name, lender_phone)
        VALUES (?, ?, ?, ?)
      `).run(clientId, client?.owner_name || 'Lender', client?.business_name || 'Finance Firm', client?.phone || '');
      settings = db.prepare('SELECT * FROM lender_settings WHERE client_id = ?').get(clientId);
    }

    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update lender settings for current client
router.put('/', (req, res) => {
  try {
    const clientId = req.clientId || 1;
    const {
      lender_name,
      business_name,
      lender_phone,
      upi_id,
      sms_provider,
      twilio_account_sid,
      twilio_auth_token,
      twilio_phone_number,
      fast2sms_api_key,
      borrower_sms_template,
      lender_sms_template,
      daily_sms_hour
    } = req.body;

    const stmt = db.prepare(`
      UPDATE lender_settings SET
        lender_name = COALESCE(?, lender_name),
        business_name = COALESCE(?, business_name),
        lender_phone = COALESCE(?, lender_phone),
        upi_id = COALESCE(?, upi_id),
        sms_provider = COALESCE(?, sms_provider),
        twilio_account_sid = COALESCE(?, twilio_account_sid),
        twilio_auth_token = COALESCE(?, twilio_auth_token),
        twilio_phone_number = COALESCE(?, twilio_phone_number),
        fast2sms_api_key = COALESCE(?, fast2sms_api_key),
        borrower_sms_template = COALESCE(?, borrower_sms_template),
        lender_sms_template = COALESCE(?, lender_sms_template),
        daily_sms_hour = COALESCE(?, daily_sms_hour),
        updated_at = CURRENT_TIMESTAMP
      WHERE client_id = ?
    `);

    stmt.run(
      lender_name,
      business_name,
      lender_phone,
      upi_id,
      sms_provider,
      twilio_account_sid,
      twilio_auth_token,
      twilio_phone_number,
      fast2sms_api_key,
      borrower_sms_template,
      lender_sms_template,
      daily_sms_hour,
      clientId
    );

    const updated = db.prepare('SELECT * FROM lender_settings WHERE client_id = ?').get(clientId);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
