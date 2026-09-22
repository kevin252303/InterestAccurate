const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'interest_accurate.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for high concurrency read/write operations without locking
try {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA foreign_keys = ON;');
} catch (err) {
  console.warn('Could not set PRAGMA modes:', err.message);
}

function addColumnIfNotExists(table, column, definition) {
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all();
    const exists = tableInfo.some(c => c.name === column);
    if (!exists && tableInfo.length > 0) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
    }
  } catch (e) {}
}

// Pre-migration: Ensure client_id exists on legacy tables
try {
  const tableInfo = db.prepare("PRAGMA table_info(lender_settings)").all();
  const hasClientId = tableInfo.some(c => c.name === 'client_id');
  if (tableInfo.length > 0 && !hasClientId) {
    db.exec("DROP TABLE lender_settings;");
  }
} catch (e) {}

addColumnIfNotExists('borrowers', 'client_id', 'INTEGER DEFAULT 1');
addColumnIfNotExists('loans', 'client_id', 'INTEGER DEFAULT 1');
addColumnIfNotExists('payments', 'client_id', 'INTEGER DEFAULT 1');
addColumnIfNotExists('sms_logs', 'client_id', 'INTEGER DEFAULT 1');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS super_admin (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    master_pin TEXT DEFAULT 'dev@1234',
    developer_name TEXT DEFAULT 'Software Developer',
    developer_phone TEXT DEFAULT '9876500000',
    developer_upi TEXT DEFAULT 'developer@upi',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  INSERT OR IGNORE INTO super_admin (id, master_pin, developer_name, developer_phone, developer_upi)
  VALUES (1, 'dev@1234', 'Software Developer', '9876500000', 'developer@upi');

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    plan_type TEXT DEFAULT 'MONTHLY', -- 'MONTHLY', 'YEARLY', 'TRIAL'
    subscription_fee REAL DEFAULT 1500,
    valid_until TEXT NOT NULL, -- YYYY-MM-DD
    status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'SUSPENDED'
    grace_period_days INTEGER DEFAULT 3,
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Seed Default Client 1 (Sri Venkatesh Finance)
  INSERT OR IGNORE INTO clients (id, business_name, owner_name, phone, password, plan_type, subscription_fee, valid_until, status)
  VALUES (1, 'Sri Venkatesh Finance', 'Venkatesh Rao', '9876543210', 'client123', 'MONTHLY', 1500, date('now', '+30 days'), 'ACTIVE');

  CREATE TABLE IF NOT EXISTS lender_settings (
    client_id INTEGER PRIMARY KEY,
    lender_name TEXT DEFAULT 'Money Lender / Financier',
    business_name TEXT DEFAULT 'Accurate Finance & Credit',
    lender_phone TEXT DEFAULT '',
    upi_id TEXT DEFAULT '',
    sms_provider TEXT DEFAULT 'SIMULATOR', -- SIMULATOR, FAST2SMS, TWILIO
    twilio_account_sid TEXT DEFAULT '',
    twilio_auth_token TEXT DEFAULT '',
    twilio_phone_number TEXT DEFAULT '',
    fast2sms_api_key TEXT DEFAULT '',
    borrower_sms_template TEXT DEFAULT 'Dear {BORROWER_NAME}, reminder that monthly interest of Rs.{INTEREST_AMOUNT} for loan #{LOAN_ID} is due tomorrow ({DUE_DATE}). Please pay to UPI: {UPI_ID} or Cash. - {LENDER_NAME}',
    lender_sms_template TEXT DEFAULT 'COLLECTION ALERT: Rs.{INTEREST_AMOUNT} interest from {BORROWER_NAME} (Ph: {BORROWER_PHONE}) is due today ({DUE_DATE}) for loan #{LOAN_ID}.',
    daily_sms_hour INTEGER DEFAULT 9,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );

  INSERT OR IGNORE INTO lender_settings (client_id, lender_name, business_name, lender_phone, upi_id)
  VALUES (1, 'Venkatesh Rao', 'Sri Venkatesh Finance', '9876543210', 'accuratefinance@upi');

  CREATE TABLE IF NOT EXISTS borrowers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER DEFAULT 1,
    name TEXT NOT NULL,
    alias TEXT DEFAULT '',
    phone TEXT NOT NULL,
    alt_phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    residential_address TEXT DEFAULT '',
    work_address TEXT DEFAULT '',
    id_type TEXT DEFAULT 'Aadhaar',
    id_number TEXT DEFAULT '',
    guarantor_name TEXT DEFAULT '',
    guarantor_phone TEXT DEFAULT '',
    guarantor_address TEXT DEFAULT '',
    guarantor_relation TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER DEFAULT 1,
    borrower_id INTEGER NOT NULL,
    principal_amount REAL NOT NULL,
    current_principal REAL NOT NULL,
    interest_rate REAL NOT NULL,
    rate_type TEXT NOT NULL DEFAULT 'monthly_pct',
    disbursement_date TEXT NOT NULL,
    due_day INTEGER NOT NULL,
    upfront_interest_deducted INTEGER DEFAULT 0,
    upfront_interest_amount REAL DEFAULT 0,
    net_disbursed_amount REAL NOT NULL,
    security_type TEXT DEFAULT 'Promissory Note',
    cheque_details TEXT DEFAULT '',
    security_notes TEXT DEFAULT '',
    status TEXT DEFAULT 'ACTIVE',
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (borrower_id) REFERENCES borrowers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER DEFAULT 1,
    loan_id INTEGER NOT NULL,
    borrower_id INTEGER NOT NULL,
    payment_date TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_type TEXT NOT NULL,
    principal_component REAL DEFAULT 0,
    interest_component REAL DEFAULT 0,
    payment_mode TEXT DEFAULT 'CASH',
    transaction_ref TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    FOREIGN KEY (borrower_id) REFERENCES borrowers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sms_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER DEFAULT 1,
    loan_id INTEGER,
    borrower_id INTEGER,
    recipient_type TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    recipient_name TEXT DEFAULT '',
    message_text TEXT NOT NULL,
    trigger_type TEXT DEFAULT 'AUTO_CRON',
    due_date_cycle TEXT DEFAULT '',
    status TEXT NOT NULL,
    error_message TEXT DEFAULT '',
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE SET NULL,
    FOREIGN KEY (borrower_id) REFERENCES borrowers(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_borrowers_client ON borrowers(client_id);
  CREATE INDEX IF NOT EXISTS idx_loans_client ON loans(client_id);
  CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
  CREATE INDEX IF NOT EXISTS idx_sms_logs_client ON sms_logs(client_id);
`);

// Migration helper: If existing table lacks client_id, add it safely
function addColumnIfNotExists(table, column, definition) {
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all();
    const exists = tableInfo.some(c => c.name === column);
    if (!exists) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
      console.log(`Added column ${column} to table ${table}`);
    }
  } catch (e) {
    // Column already exists or pragma handled
  }
}

addColumnIfNotExists('borrowers', 'client_id', 'INTEGER DEFAULT 1');
addColumnIfNotExists('loans', 'client_id', 'INTEGER DEFAULT 1');
addColumnIfNotExists('payments', 'client_id', 'INTEGER DEFAULT 1');
addColumnIfNotExists('sms_logs', 'client_id', 'INTEGER DEFAULT 1');

module.exports = db;
