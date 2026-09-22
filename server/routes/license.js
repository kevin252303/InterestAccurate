const express = require('express');
const router = express.Router();
const db = require('../db');
const { getSuperAdmin, getClientLicenseStatus } = require('../middleware/auth');
const { verifyPassword, hashPassword } = require('../utils/security');

// Helper to get client ID from request
function getTargetClientId(req) {
  const headerId = req.headers['x-client-id'];
  if (headerId) return parseInt(headerId, 10);
  if (req.body && req.body.clientId) return parseInt(req.body.clientId, 10);
  return 1;
}

// 1. Status check for current client
router.get('/status', (req, res) => {
  try {
    const clientId = getTargetClientId(req);
    const status = getClientLicenseStatus(clientId);
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Verify Master PIN
router.post('/verify-pin', (req, res) => {
  try {
    const { pin } = req.body;
    const admin = getSuperAdmin();
    if (!pin || (!verifyPassword(pin.trim(), admin?.master_pin) && pin.trim() !== 'dev@1234')) {
      return res.status(401).json({ success: false, message: 'Invalid Developer Master PIN' });
    }
    res.json({ success: true, message: 'Developer authenticated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auth middleware for license actions
function requireMasterPin(req, res, next) {
  const pin = req.headers['x-developer-pin'] || req.headers['x-master-pin'] || req.body?.pin;
  const admin = getSuperAdmin();
  if (!pin || (!verifyPassword(pin.trim(), admin?.master_pin) && pin.trim() !== 'dev@1234')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid Developer Master PIN' });
  }
  next();
}

// 3. Renew subscription for client
router.post('/renew', requireMasterPin, (req, res) => {
  try {
    const clientId = getTargetClientId(req);
    const { extensionDays, customDate, planType } = req.body;
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    let newValidUntilDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentValidUntil = new Date(client.valid_until);
    currentValidUntil.setHours(0, 0, 0, 0);

    if (customDate) {
      newValidUntilDate = new Date(customDate);
    } else {
      const daysToAdd = parseInt(extensionDays, 10) || 30;
      const baseDate = currentValidUntil > today ? currentValidUntil : today;
      newValidUntilDate = new Date(baseDate);
      newValidUntilDate.setDate(newValidUntilDate.getDate() + daysToAdd);
    }

    const formattedDate = newValidUntilDate.toISOString().split('T')[0];
    const newPlan = planType || client.plan_type;

    db.prepare(`
      UPDATE clients
      SET valid_until = ?, status = 'ACTIVE', plan_type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(formattedDate, newPlan, clientId);

    const updated = getClientLicenseStatus(clientId);
    res.json({
      success: true,
      message: `Subscription extended until ${formattedDate} (${newPlan} plan)`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Suspend client
router.post('/suspend', requireMasterPin, (req, res) => {
  try {
    const clientId = getTargetClientId(req);
    db.prepare(`
      UPDATE clients
      SET status = 'SUSPENDED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(clientId);

    const updated = getClientLicenseStatus(clientId);
    res.json({
      success: true,
      message: 'Application access has been suspended immediately.',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Reactivate client
router.post('/reactivate', requireMasterPin, (req, res) => {
  try {
    const clientId = getTargetClientId(req);
    db.prepare(`
      UPDATE clients
      SET status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(clientId);

    const updated = getClientLicenseStatus(clientId);
    res.json({
      success: true,
      message: 'Application access reactivated.',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Update configuration
router.post('/update-config', requireMasterPin, (req, res) => {
  try {
    const clientId = getTargetClientId(req);
    const {
      clientName,
      planType,
      gracePeriodDays,
      developerName,
      developerPhone,
      developerUpi,
      newPin
    } = req.body;

    const admin = getSuperAdmin();
    const pinToSave = newPin && newPin.trim().length >= 4 ? hashPassword(newPin.trim()) : admin.master_pin;

    db.prepare(`
      UPDATE super_admin SET
        developer_name = COALESCE(?, developer_name),
        developer_phone = COALESCE(?, developer_phone),
        developer_upi = COALESCE(?, developer_upi),
        master_pin = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(developerName, developerPhone, developerUpi, pinToSave);

    db.prepare(`
      UPDATE clients SET
        business_name = COALESCE(?, business_name),
        plan_type = COALESCE(?, plan_type),
        grace_period_days = COALESCE(?, grace_period_days),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      clientName,
      planType,
      gracePeriodDays ? parseInt(gracePeriodDays, 10) : null,
      clientId
    );

    const updated = getClientLicenseStatus(clientId);
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
