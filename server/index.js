const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const { initScheduler } = require('./services/scheduler');
const { tenantMiddleware, getClientLicenseStatus } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const superAdminRoutes = require('./routes/superAdmin');
const licenseRoutes = require('./routes/license');
const dashboardRoutes = require('./routes/dashboard');
const borrowerRoutes = require('./routes/borrowers');
const loanRoutes = require('./routes/loans');
const paymentRoutes = require('./routes/payments');
const smsRoutes = require('./routes/sms');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers (configured to allow local Vite single-page app)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(express.json());

// 1. Rate Limiting for Authentication (Brute force protection)
// Automatically skips loopback addresses so developers are never locked out locally
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1',
  message: { success: false, message: 'Too many login attempts from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// 2. Rate Limiting for SMS Dispatch (Credit drain protection)
const smsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1',
  message: { success: false, message: 'SMS rate limit exceeded. Please wait a few minutes before sending more messages.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Public / Auth Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);

// Developer License & Master Unlock Routes (Available during lockout)
app.use('/api/license', licenseRoutes);

// Rate limit manual SMS dispatches
app.use('/api/sms/send-manual', smsLimiter);

// Super-Admin Routes (Protected by Developer Master PIN)
app.use('/api/super-admin', superAdminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'InterestAccurate Multi-Tenant Platform', timestamp: new Date() });
});

// Client License Status check (safe public route per client)
app.get('/api/client/license-status', (req, res) => {
  const clientId = req.headers['x-client-id'] ? parseInt(req.headers['x-client-id'], 10) : 1;
  const status = getClientLicenseStatus(clientId);
  res.json({ success: true, data: status });
});

// Tenant Scoping & Subscription Lockout Guard Middleware
app.use(tenantMiddleware);

// Tenant-Scoper Business Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/borrowers', borrowerRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/settings', settingsRoutes);

// Explicit JSON 404 Handler for all API routes (Prevents HTML response leaks)
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Serve frontend in production if built
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), err => {
    if (err) next();
  });
});

// Start multi-tenant scheduler
initScheduler();

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 InterestAccurate Multi-Tenant SaaS Platform running on port ${PORT}`);
  console.log(`🌐 App: http://localhost:${PORT}`);
  console.log(`👑 Super-Admin Portal: http://localhost:${PORT} (Default PIN: dev@1234)`);
  console.log(`======================================================\n`);
});
