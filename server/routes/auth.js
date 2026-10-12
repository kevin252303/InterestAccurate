const express = require('express');
const router = express.Router();
const db = require('../db');
const { getSuperAdmin, getClientLicenseStatus } = require('../middleware/auth');
const { hashPassword, verifyPassword, isBcryptHash, generateToken, verifyToken } = require('../utils/security');
const { sendDeveloperOtp, cleanPhone } = require('../services/smsService');

// Universal Login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Phone/Username and Password are required' });
    }

    const trimmedUser = String(username).trim();
    const trimmedPass = String(password).trim();
    const admin = getSuperAdmin();

    // 1. Check if Super-Admin (by username 'admin'/'developer' or direct master pin)
    const isAdminUser = (trimmedUser.toLowerCase() === 'admin' || trimmedUser.toLowerCase() === 'developer');
    const isMasterPin = verifyPassword(trimmedPass, admin?.master_pin);
    const isDirectPinLogin = verifyPassword(trimmedUser, admin?.master_pin);

    if ((isAdminUser && isMasterPin) || isDirectPinLogin) {
      // Auto-hash master pin if stored in plaintext
      if (admin && !isBcryptHash(admin.master_pin)) {
        try {
          db.prepare('UPDATE super_admin SET master_pin = ? WHERE id = ?').run(hashPassword(admin.master_pin), admin.id);
        } catch (e) {}
      }

      const token = generateToken({
        role: 'SUPER_ADMIN',
        adminId: admin?.id || 1,
        name: admin?.developer_name || 'Software Developer'
      });

      return res.json({
        success: true,
        role: 'SUPER_ADMIN',
        user: {
          name: admin?.developer_name || 'Software Developer',
          phone: admin?.developer_phone || '',
          upi: admin?.developer_upi || ''
        },
        masterPin: isAdminUser ? trimmedPass : trimmedUser,
        token
      });
    }

    // 2. Check if Client (by phone, business name, or numeric ID)
    const client = db.prepare(`
      SELECT * FROM clients 
      WHERE phone = ? OR business_name = ? OR id = ?
    `).get(trimmedUser, trimmedUser, parseInt(trimmedUser, 10) || 0);

    if (client) {
      const isClientPassword = verifyPassword(trimmedPass, client.password);
      const isMasterPinOverride = isMasterPin;

      if (isClientPassword || isMasterPinOverride) {
        // Auto-upgrade client plaintext password to bcrypt hash on successful login
        if (isClientPassword && !isBcryptHash(client.password)) {
          try {
            db.prepare('UPDATE clients SET password = ? WHERE id = ?').run(hashPassword(trimmedPass), client.id);
          } catch (e) {
            console.warn('Could not auto-hash client password:', e.message);
          }
        }

        const license = getClientLicenseStatus(client.id);
        const tokenPayload = {
          role: isMasterPinOverride && !isClientPassword ? 'SUPER_ADMIN' : 'CLIENT',
          clientId: client.id,
          phone: client.phone,
          businessName: client.business_name,
          isImpersonating: isMasterPinOverride && !isClientPassword
        };

        const token = generateToken(tokenPayload);

        return res.json({
          success: true,
          role: 'CLIENT',
          clientId: client.id,
          client: {
            id: client.id,
            businessName: client.business_name,
            ownerName: client.owner_name,
            phone: client.phone
          },
          license,
          token
        });
      }
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials. Please check phone number and password.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Change Password endpoint for Client and Super-Admin
router.post('/change-password', (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    const trimmedCurrent = String(currentPassword).trim();
    const trimmedNew = String(newPassword).trim();

    if (trimmedNew.length < 4) {
      return res.status(400).json({ success: false, message: 'New password must be at least 4 characters long' });
    }

    if (confirmPassword && trimmedNew !== String(confirmPassword).trim()) {
      return res.status(400).json({ success: false, message: 'New password and confirmation do not match' });
    }

    // Determine caller from JWT or headers
    let user = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      user = verifyToken(token);
    }

    const admin = getSuperAdmin();

    // 1. Super-Admin Password/PIN Change
    if (user?.role === 'SUPER_ADMIN' || req.headers['x-master-pin']) {
      const isPinValid = verifyPassword(trimmedCurrent, admin?.master_pin);
      if (!isPinValid) {
        return res.status(401).json({ success: false, message: 'Current Master PIN is incorrect' });
      }

      const hashedPin = hashPassword(trimmedNew);
      db.prepare(`
        UPDATE super_admin SET master_pin = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1
      `).run(hashedPin);

      return res.json({
        success: true,
        message: 'Super-Admin Master PIN updated successfully'
      });
    }

    // 2. Client Password Change
    const clientId = user?.clientId || (req.headers['x-client-id'] ? parseInt(req.headers['x-client-id'], 10) : null);
    if (!clientId) {
      return res.status(401).json({ success: false, message: 'Authentication required to change password' });
    }

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client organization not found' });
    }

    const isCurrentValid = verifyPassword(trimmedCurrent, client.password);
    if (!isCurrentValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashedPassword = hashPassword(trimmedNew);
    db.prepare(`
      UPDATE clients SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(hashedPassword, clientId);

    return res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// In-memory OTP Store for Developer Login: phone10 -> { otp, expiresAt, attempts, requestedAt }
const developerOtpStore = new Map();

function maskPhone(phone) {
  const cleaned = cleanPhone(phone);
  if (cleaned.length < 4) return phone;
  const last4 = cleaned.slice(-4);
  return `+91 ******${last4}`;
}

// 1. Send OTP to Developer Registered Mobile
router.post('/developer/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Developer mobile number is required' });
    }

    const admin = getSuperAdmin();
    if (!admin || !admin.developer_phone) {
      return res.status(400).json({ success: false, message: 'Developer profile is not configured with a mobile number' });
    }

    const inputPhone = cleanPhone(phone).slice(-10);
    const registeredPhone = cleanPhone(admin.developer_phone).slice(-10);

    if (inputPhone !== registeredPhone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Entered mobile number does not match registered developer phone.' 
      });
    }

    // Cooldown check (30 seconds)
    const existing = developerOtpStore.get(inputPhone);
    if (existing && Date.now() - existing.requestedAt < 30000) {
      const waitSeconds = Math.ceil((30000 - (Date.now() - existing.requestedAt)) / 1000);
      return res.status(429).json({ 
        success: false, 
        message: `Please wait ${waitSeconds} seconds before requesting a new OTP.` 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    developerOtpStore.set(inputPhone, {
      otp,
      expiresAt,
      attempts: 0,
      requestedAt: Date.now()
    });

    const { sentRealSms } = await sendDeveloperOtp(inputPhone, otp);
    const masked = maskPhone(inputPhone);

    res.json({
      success: true,
      message: `OTP sent successfully to registered developer mobile (${masked}).`,
      phone: masked,
      isSimulated: !sentRealSms,
      devOtp: !sentRealSms ? otp : undefined
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Verify Developer OTP and Login
router.post('/developer/verify-otp', (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile number and OTP are required' });
    }

    const admin = getSuperAdmin();
    const inputPhone = cleanPhone(phone).slice(-10);
    const registeredPhone = cleanPhone(admin?.developer_phone || '').slice(-10);

    if (inputPhone !== registeredPhone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid developer credentials.' 
      });
    }

    const record = developerOtpStore.get(inputPhone);
    if (!record || Date.now() > record.expiresAt) {
      developerOtpStore.delete(inputPhone);
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired or was not requested. Please request a new OTP.' 
      });
    }

    if (record.attempts >= 5) {
      developerOtpStore.delete(inputPhone);
      return res.status(429).json({ 
        success: false, 
        message: 'Too many incorrect attempts. Please request a fresh OTP.' 
      });
    }

    const enteredOtp = String(otp).trim();
    if (record.otp !== enteredOtp) {
      record.attempts += 1;
      const remaining = 5 - record.attempts;
      return res.status(400).json({ 
        success: false, 
        message: `Incorrect OTP. ${remaining} attempt(s) remaining.` 
      });
    }

    // OTP Verified! Consume the OTP
    developerOtpStore.delete(inputPhone);

    // Issue JWT Token
    const token = generateToken({
      role: 'SUPER_ADMIN',
      adminId: admin.id || 1,
      name: admin.developer_name || 'Software Developer'
    });

    return res.json({
      success: true,
      role: 'SUPER_ADMIN',
      user: {
        name: admin.developer_name || 'Software Developer',
        phone: admin.developer_phone || '',
        upi: admin.developer_upi || ''
      },
      masterPin: admin.master_pin,
      token
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
