const express = require('express');
const router = express.Router();
const db = require('../db');
const { getSuperAdmin, getClientLicenseStatus, requireSuperAdmin } = require('../middleware/auth');
const { hashPassword } = require('../utils/security');

// Protect all Super-Admin endpoints with master PIN
router.use(requireSuperAdmin);

// Get all clients with subscription and revenue metrics
router.get('/dashboard', (req, res) => {
  try {
    const clients = db.prepare('SELECT * FROM clients ORDER BY id DESC').all();

    let totalMRR = 0;
    let activeClientsCount = 0;
    let expiringSoonCount = 0;
    let expiredOrSuspendedCount = 0;

    const enrichedClients = clients.map(client => {
      const license = getClientLicenseStatus(client.id);

      // Aggregate loan stats for this client
      const loanStats = db.prepare(`
        SELECT COUNT(*) as active_loans_count,
               COALESCE(SUM(current_principal), 0) as total_capital_deployed
        FROM loans
        WHERE client_id = ? AND status = 'ACTIVE'
      `).get(client.id);

      const borrowerCount = db.prepare(`
        SELECT COUNT(*) as count FROM borrowers WHERE client_id = ?
      `).get(client.id).count;

      if (client.plan_type === 'MONTHLY') {
        totalMRR += parseFloat(client.subscription_fee) || 0;
      } else if (client.plan_type === 'YEARLY') {
        totalMRR += Math.round(((parseFloat(client.subscription_fee) || 0) / 12) * 100) / 100;
      }

      if (license.isLocked) {
        expiredOrSuspendedCount++;
      } else {
        activeClientsCount++;
        if (license.daysRemaining <= 7) {
          expiringSoonCount++;
        }
      }

      return {
        ...client,
        license,
        activeLoansCount: loanStats.active_loans_count,
        totalCapitalDeployed: loanStats.total_capital_deployed,
        borrowerCount
      };
    });

    const superAdmin = getSuperAdmin();

    res.json({
      success: true,
      data: {
        metrics: {
          totalClients: clients.length,
          activeClients: activeClientsCount,
          expiringSoon: expiringSoonCount,
          expiredOrSuspended: expiredOrSuspendedCount,
          totalMRR: Math.round(totalMRR * 100) / 100
        },
        clients: enrichedClients,
        developerProfile: {
          name: superAdmin.developer_name,
          phone: superAdmin.developer_phone,
          upi: superAdmin.developer_upi
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new client organization
router.post('/clients', (req, res) => {
  try {
    const {
      business_name,
      owner_name,
      phone,
      password,
      plan_type = 'MONTHLY',
      subscription_fee = 1500,
      valid_days = 30,
      notes = ''
    } = req.body;

    if (!business_name || !owner_name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Business Name, Owner Name, Phone, and Password are required' });
    }

    // Check unique phone
    const existing = db.prepare('SELECT id FROM clients WHERE phone = ?').get(phone.trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'A client with this phone number already exists' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const validUntilDate = new Date(today);
    validUntilDate.setDate(validUntilDate.getDate() + (parseInt(valid_days, 10) || 30));
    const validUntilStr = validUntilDate.toISOString().split('T')[0];

    const stmt = db.prepare(`
      INSERT INTO clients (
        business_name, owner_name, phone, password, plan_type,
        subscription_fee, valid_until, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    `);

    const result = stmt.run(
      business_name.trim(),
      owner_name.trim(),
      phone.trim(),
      hashPassword(password.trim()),
      plan_type,
      parseFloat(subscription_fee) || 0,
      validUntilStr,
      notes || ''
    );

    const newClientId = result.lastInsertRowid;

    // Create default lender settings for this client
    db.prepare(`
      INSERT OR IGNORE INTO lender_settings (client_id, lender_name, business_name, lender_phone)
      VALUES (?, ?, ?, ?)
    `).run(newClientId, owner_name.trim(), business_name.trim(), phone.trim());

    const newClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(newClientId);
    res.status(201).json({
      success: true,
      message: `Client "${business_name}" onboarded successfully!`,
      data: newClient
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Renew client subscription (+30 days, +365 days, or custom date)
router.put('/clients/:id/renew', (req, res) => {
  try {
    const { days = 30, customDate, planType } = req.body;
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentValidUntil = new Date(client.valid_until);
    currentValidUntil.setHours(0, 0, 0, 0);

    let newDate;
    if (customDate) {
      newDate = new Date(customDate);
    } else {
      const base = currentValidUntil > today ? currentValidUntil : today;
      newDate = new Date(base);
      newDate.setDate(newDate.getDate() + parseInt(days, 10));
    }

    const formattedDate = newDate.toISOString().split('T')[0];
    const newPlan = planType || client.plan_type;

    db.prepare(`
      UPDATE clients 
      SET valid_until = ?, status = 'ACTIVE', plan_type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(formattedDate, newPlan, client.id);

    const updated = getClientLicenseStatus(client.id);
    res.json({
      success: true,
      message: `Client renewed until ${formattedDate}`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Suspend client access immediately
router.put('/clients/:id/suspend', (req, res) => {
  try {
    db.prepare(`UPDATE clients SET status = 'SUSPENDED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(req.params.id);
    const updated = getClientLicenseStatus(req.params.id);
    res.json({ success: true, message: 'Client access suspended', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reactivate client access
router.put('/clients/:id/reactivate', (req, res) => {
  try {
    db.prepare(`UPDATE clients SET status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(req.params.id);
    const updated = getClientLicenseStatus(req.params.id);
    res.json({ success: true, message: 'Client access reactivated', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update client details
router.put('/clients/:id', (req, res) => {
  try {
    const { business_name, owner_name, phone, password, plan_type, subscription_fee, notes } = req.body;
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    db.prepare(`
      UPDATE clients SET
        business_name = COALESCE(?, business_name),
        owner_name = COALESCE(?, owner_name),
        phone = COALESCE(?, phone),
        password = COALESCE(?, password),
        plan_type = COALESCE(?, plan_type),
        subscription_fee = COALESCE(?, subscription_fee),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      business_name,
      owner_name,
      phone,
      password && password.trim() ? hashPassword(password.trim()) : null,
      plan_type,
      subscription_fee !== undefined ? parseFloat(subscription_fee) : null,
      notes,
      client.id
    );

    const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(client.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete client
router.delete('/clients/:id', (req, res) => {
  try {
    if (parseInt(req.params.id, 10) === 1) {
      return res.status(400).json({ success: false, message: 'Default client #1 cannot be deleted' });
    }

    db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Client and all associated records deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Developer Profile & Master PIN
router.put('/profile', (req, res) => {
  try {
    const { developer_name, developer_phone, developer_upi, new_master_pin } = req.body;
    const admin = getSuperAdmin();
    const pinToSave = new_master_pin && new_master_pin.trim().length >= 4 ? hashPassword(new_master_pin.trim()) : admin.master_pin;

    db.prepare(`
      UPDATE super_admin SET
        developer_name = COALESCE(?, developer_name),
        developer_phone = COALESCE(?, developer_phone),
        developer_upi = COALESCE(?, developer_upi),
        master_pin = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(developer_name, developer_phone, developer_upi, pinToSave);

    const updated = getSuperAdmin();
    res.json({ success: true, message: 'Super-Admin profile updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
