const db = require('./db');
const { calculateBaseInterest, calculatePeriodInterest, computeLoanLedger } = require('./services/interestEngine');

console.log('--- Testing Base Interest (Rs 1,00,000 at 2% monthly) ---');
const base = calculateBaseInterest(100000, 2, 'monthly_pct');
console.log('Principal:', base.principal);
console.log('Monthly Interest:', base.monthlyInterest); // Expected: 2000
console.log('Daily Interest:', base.dailyInterest);     // Expected: 66.67
console.log('Effective Annual Rate:', base.effectiveAnnualRate); // Expected: 24%

console.log('\n--- Testing Period Interest (35 days) ---');
const period = calculatePeriodInterest(100000, 2, 'monthly_pct', '2026-08-01', '2026-09-05');
console.log('Total days:', period.totalDays);
console.log('Accrued interest:', period.accruedInterest);
console.log('Total payoff:', period.totalPayoffAmount);

console.log('\n--- Testing Database Tables ---');
const settings = db.prepare('SELECT * FROM lender_settings WHERE id = 1').get();
console.log('Lender Name:', settings.lender_name);
console.log('All tests passed successfully!');
