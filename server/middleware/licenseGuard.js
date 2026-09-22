const db = require('../db');

function getLicenseStatus() {
  const license = db.prepare('SELECT * FROM developer_license WHERE id = 1').get();
  if (!license) {
    return { isLocked: true, error: 'NO_LICENSE' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const validUntil = new Date(license.valid_until);
  validUntil.setHours(0, 0, 0, 0);

  const diffTime = validUntil.getTime() - today.getTime();
  const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const graceDays = license.grace_period_days || 0;

  // Locked if explicitly suspended, or expired past the grace period
  const isSuspended = license.status === 'SUSPENDED';
  const isExpired = daysRemaining < -graceDays;
  const isGracePeriod = daysRemaining < 0 && daysRemaining >= -graceDays;
  const isLocked = isSuspended || isExpired;

  return {
    isLocked,
    isSuspended,
    isExpired,
    isGracePeriod,
    daysRemaining,
    validUntil: license.valid_until,
    planType: license.plan_type,
    status: license.status,
    clientName: license.client_name,
    gracePeriodDays: graceDays,
    developerName: license.developer_name,
    developerPhone: license.developer_phone,
    developerUpi: license.developer_upi
  };
}

function licenseGuardMiddleware(req, res, next) {
  // Allow health check and license endpoints
  if (req.path.startsWith('/api/license') || req.path === '/api/health') {
    return next();
  }

  const status = getLicenseStatus();
  if (status.isLocked) {
    return res.status(403).json({
      success: false,
      error: 'SUBSCRIPTION_LOCKED',
      message: status.isSuspended
        ? 'Application access has been suspended by the developer.'
        : 'Subscription expired. Please complete payment to renew access.',
      license: {
        isLocked: true,
        daysRemaining: status.daysRemaining,
        validUntil: status.validUntil,
        developerName: status.developerName,
        developerPhone: status.developerPhone,
        developerUpi: status.developerUpi
      }
    });
  }

  req.license = status;
  next();
}

module.exports = {
  getLicenseStatus,
  licenseGuardMiddleware
};
