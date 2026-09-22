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
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 login requests per window
  message: { success: false, message: 'Too many login attempts from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// 2. Rate Limiting for SMS Dispatch (Credit drain protection)
const smsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'SMS rate limit exceeded. Please wait a few minutes before sending more messages.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Public / Auth Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);

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
  console.log(`👑 Super-Admin Master PIN: dev@1234`);
  console.log(`======================================================\n`);
});
