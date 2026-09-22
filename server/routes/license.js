const express = require('express');
const router = express.Router();
const db = require('../db');
const { getLicenseStatus } = require('../middleware/licenseGuard');

// Public status check (safe to return to frontend, hides PIN)
router.get('/status', (req, res) => {
  try {
    const status = getLicenseStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify Master PIN
router.post('/verify-pin', (req, res) => {
  try {
    const { pin } = req.body;
    const license = db.prepare('SELECT developer_pin FROM developer_license WHERE id = 1').get();
    
    if (!license || !pin || pin.trim() !== license.developer_pin) {
      return res.status(401).json({ success: false, message: 'Invalid Developer Master PIN' });
    }

    res.json({ success: true, message: 'Developer authenticated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Middleware to protect developer admin routes
function requireDeveloperPin(req, res, next) {
  const pin = req.headers['x-developer-pin'] || req.body.pin;
  const license = db.prepare('SELECT developer_pin FROM developer_license WHERE id = 1').get();

  if (!license || !pin || pin.trim() !== license.developer_pin) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid Developer Master PIN' });
  }
  next();
}

// Renew / Extend Subscription
router.post('/renew', requireDeveloperPin, (req, res) => {
  try {
    const { extensionDays, customDate, planType } = req.body;
    const license = db.prepare('SELECT * FROM developer_license WHERE id = 1').get();

    let newValidUntilDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentValidUntil = new Date(license.valid_until);
    currentValidUntil.setHours(0, 0, 0, 0);

    if (customDate) {
      newValidUntilDate = new Date(customDate);
    } else {
      const daysToAdd = parseInt(extensionDays, 10) || 30;
      // If current license is already expired, extend from today; otherwise extend from currentValidUntil
      const baseDate = currentValidUntil > today ? currentValidUntil : today;
      newValidUntilDate = new Date(baseDate);
      newValidUntilDate.setDate(newValidUntilDate.getDate() + daysToAdd);
    }

    const formattedDate = newValidUntilDate.toISOString().split('T')[0];
    const newPlan = planType || license.plan_type;

    db.prepare(`
      UPDATE developer_license
      SET valid_until = ?, status = 'ACTIVE', plan_type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(formattedDate, newPlan);

    const updated = getLicenseStatus();
    res.json({
      success: true,
      message: `Subscription extended until ${formattedDate} (${newPlan} plan)`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Suspend / Lock Immediately (for non-payment or breach)
router.post('/suspend', requireDeveloperPin, (req, res) => {
  try {
    db.prepare(`
      UPDATE developer_license
      SET status = 'SUSPENDED', updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run();

    const updated = getLicenseStatus();
    res.json({
      success: true,
      message: 'Application access has been suspended immediately.',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reactivate License
router.post('/reactivate', requireDeveloperPin, (req, res) => {
  try {
    db.prepare(`
      UPDATE developer_license
      SET status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run();

    const updated = getLicenseStatus();
    res.json({
      success: true,
      message: 'Application access reactivated.',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Developer Info, Client Info, or Change PIN
router.post('/update-config', requireDeveloperPin, (req, res) => {
  try {
    const {
      clientName,
      planType,
      gracePeriodDays,
      developerName,
      developerPhone,
      developerUpi,
      newPin
    } = req.body;

    const license = db.prepare('SELECT * FROM developer_license WHERE id = 1').get();
    const pinToSave = newPin && newPin.trim().length >= 4 ? newPin.trim() : license.developer_pin;

    db.prepare(`
      UPDATE developer_license SET
        client_name = COALESCE(?, client_name),
        plan_type = COALESCE(?, plan_type),
        grace_period_days = COALESCE(?, grace_period_days),
        developer_name = COALESCE(?, developer_name),
        developer_phone = COALESCE(?, developer_phone),
        developer_upi = COALESCE(?, developer_upi),
        developer_pin = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      clientName,
      planType,
      gracePeriodDays ? parseInt(gracePeriodDays, 10) : null,
      developerName,
      developerPhone,
      developerUpi,
      pinToSave
    );

    const updated = getLicenseStatus();
    res.json({
      success: true,
      message: 'Developer settings & license configuration updated successfully',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
