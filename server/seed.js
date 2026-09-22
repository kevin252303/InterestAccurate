const db = require('./db');
const { calculateBaseInterest } = require('./services/interestEngine');

console.log('Seeding sample data for Loan Provider...');

// Clear existing tables
db.exec(`
  DELETE FROM sms_logs;
  DELETE FROM payments;
  DELETE FROM loans;
  DELETE FROM borrowers;
`);

// 1. Insert Borrowers
const insertBorrower = db.prepare(`
  INSERT INTO borrowers (
    name, alias, phone, alt_phone, email, residential_address, work_address,
    id_type, id_number, guarantor_name, guarantor_phone, guarantor_relation, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const b1 = insertBorrower.run(
  'Rajesh Sharma',
  'Sharma Electricals',
  '9845123456',
  '9845123457',
  'rajesh.sharma@example.com',
  'Flat 302, Sai Residency, 4th Cross, Gandhi Nagar',
  'Shop #12, Market Road, Main Bazaar',
  'Aadhaar',
  '4829 1049 2039',
  'Anil Verma',
  '9811099887',
  'Brother-in-law (Owns Hardware Store)',
  'Running shop for 12 years, prompt payer'
);

const b2 = insertBorrower.run(
  'Pooja Deshmukh',
  'Pooja Boutique',
  '9722334455',
  '',
  'pooja.d@example.com',
  'House 14/B, Shiv Krupa, Station Road',
  'Boutique Corner, Mall Road',
  'PAN',
  'ABCDE1234F',
  'Sanjay Deshmukh',
  '9722334466',
  'Husband (Govt Teacher)',
  'Cloth business inventory loan'
);

const b3 = insertBorrower.run(
  'Vikram Reddy',
  'Contractor Reddy',
  '9633882211',
  '9633882299',
  '',
  'Plot 45, Green Meadows Colony',
  'Reddy Constructions Site Office',
  'Driving License',
  'DL-042011009823',
  'Mahesh Goud',
  '9633885544',
  'Business Partner',
  'Site working capital loan'
);

// 2. Insert Loans
// Calculate dates relative to today so Dues Tomorrow & Dues Today are actively visible!
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

const twoMonthsAgo = new Date(today);
twoMonthsAgo.setMonth(today.getMonth() - 2);

const insertLoan = db.prepare(`
  INSERT INTO loans (
    borrower_id, principal_amount, current_principal, interest_rate, rate_type,
    disbursement_date, due_day, upfront_interest_deducted, upfront_interest_amount,
    net_disbursed_amount, security_type, cheque_details, security_notes, status, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
`);

// Loan 1: Due TOMORROW (triggers borrower reminder SMS)
const l1 = insertLoan.run(
  b1.lastInsertRowid,
  100000,
  100000,
  2.0, // 2% per month = Rs 2,000/mo
  'monthly_pct',
  twoMonthsAgo.toISOString().split('T')[0],
  tomorrow.getDate(), // Due tomorrow!
  0,
  0,
  100000,
  'Both Cheque and Note',
  'SBI Cheque #784920 signed blank',
  'Original property tax receipt deposited as guarantee',
  'Shop renovation loan'
);

// Loan 2: Due TODAY (triggers lender alert SMS)
const l2 = insertLoan.run(
  b2.lastInsertRowid,
  150000,
  150000,
  2.5, // 2.5% per month = Rs 3,750/mo
  'monthly_pct',
  yesterday.toISOString().split('T')[0],
  today.getDate(), // Due today!
  1, // Upfront deducted
  3750,
  146250,
  'Gold Collateral',
  'Gold Bangles 25g deposited in bank locker #14',
  'First month interest Rs 3,750 deducted at source',
  'Festival boutique stock'
);

// Loan 3: Loan with Part-Payment made (Started at 2,00,000, 50,000 paid back)
const threeMonthsAgo = new Date(today);
threeMonthsAgo.setMonth(today.getMonth() - 3);

const l3 = insertLoan.run(
  b3.lastInsertRowid,
  200000,
  150000, // reduced principal!
  1.75, // 1.75% per month = Rs 2,625/mo on 1.5L
  'monthly_pct',
  threeMonthsAgo.toISOString().split('T')[0],
  15,
  0,
  0,
  200000,
  'Promissory Note',
  'Signed stamp paper promissory note for Rs 2,00,000',
  'Witnessed by Mahesh Goud',
  'Contract material advance'
);

// 3. Insert Historical Payments for Loan 3
const insertPayment = db.prepare(`
  INSERT INTO payments (
    loan_id, borrower_id, payment_date, amount, payment_type,
    principal_component, interest_component, payment_mode, transaction_ref, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Month 1 interest payment
const oneMonthAgo = new Date(today);
oneMonthAgo.setMonth(today.getMonth() - 1);

insertPayment.run(
  l3.lastInsertRowid,
  b3.lastInsertRowid,
  oneMonthAgo.toISOString().split('T')[0],
  3500,
  'INTEREST',
  0,
  3500,
  'UPI',
  'UPI/4829103982',
  'Month 1 interest on Rs 2,00,000'
);

// Part-payment of Principal Rs 50,000
const fifteenDaysAgo = new Date(today);
fifteenDaysAgo.setDate(today.getDate() - 15);

insertPayment.run(
  l3.lastInsertRowid,
  b3.lastInsertRowid,
  fifteenDaysAgo.toISOString().split('T')[0],
  50000,
  'PRINCIPAL',
  50000,
  0,
  'BANK_TRANSFER',
  'IMPS/REF592819',
  'Part repayment of principal. Balance principal reduced to Rs 1,50,000.'
);

console.log('✅ Seed completed successfully! Created 3 borrowers, 3 active loans, and payment history.');
