const express = require('express');
const router = express.Router();
const db = require('../db');
const { computeLoanLedger } = require('../services/interestEngine');

router.get('/metrics', (req, res) => {
  try {
    const clientId = req.clientId || 1;

    const activeLoans = db.prepare(`
      SELECT l.*, b.name as borrower_name, b.phone as borrower_phone, b.alias as borrower_alias
      FROM loans l
      JOIN borrowers b ON l.borrower_id = b.id
      WHERE l.status = 'ACTIVE' AND l.client_id = ?
    `).all(clientId);

    let totalCapitalDeployed = 0;
    let totalMonthlyInterest = 0;
    let totalDailyInterest = 0;
    let overdueCount = 0;
    const dueTodayList = [];
    const dueTomorrowList = [];
    const overdueList = [];

    activeLoans.forEach(loan => {
      const payments = db.prepare('SELECT * FROM payments WHERE loan_id = ? AND client_id = ?').all(loan.id, clientId);
      const ledger = computeLoanLedger(loan, payments);

      totalCapitalDeployed += ledger.currentPrincipal;
      totalMonthlyInterest += ledger.monthlyInterest;
      totalDailyInterest += ledger.dailyInterest;

      const item = {
        loanId: loan.id,
        borrowerId: loan.borrower_id,
        borrowerName: loan.borrower_name,
        borrowerPhone: loan.borrower_phone,
        borrowerAlias: loan.borrower_alias,
        principal: ledger.currentPrincipal,
        monthlyInterest: ledger.monthlyInterest,
        dailyInterest: ledger.dailyInterest,
        interestRate: loan.interest_rate,
        rateType: loan.rate_type,
        nextDueDate: ledger.nextDueDate,
        daysUntilDue: ledger.daysUntilDue,
        securityType: loan.security_type
      };

      if (ledger.daysUntilDue === 0) {
        dueTodayList.push(item);
      } else if (ledger.daysUntilDue === 1) {
        dueTomorrowList.push(item);
      } else if (ledger.daysUntilDue < 0) {
        overdueCount++;
        overdueList.push(item);
      }
    });

    // Interest collected this month
    const currentYearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyCollectedRow = db.prepare(`
      SELECT SUM(amount) as total_collected,
             SUM(interest_component) as interest_collected,
             SUM(principal_component) as principal_collected
      FROM payments
      WHERE strftime('%Y-%m', payment_date) = ? AND client_id = ?
    `).get(currentYearMonth, clientId);

    const totalBorrowersCount = db.prepare('SELECT COUNT(*) as count FROM borrowers WHERE client_id = ?').get(clientId).count;
    const closedLoansCount = db.prepare("SELECT COUNT(*) as count FROM loans WHERE status = 'CLOSED' AND client_id = ?").get(clientId).count;

    const recentPayments = db.prepare(`
      SELECT p.*, b.name as borrower_name
      FROM payments p
      JOIN borrowers b ON p.borrower_id = b.id
      WHERE p.client_id = ?
      ORDER BY p.id DESC
      LIMIT 5
    `).all(clientId);

    res.json({
      success: true,
      data: {
        totalCapitalDeployed: Math.round(totalCapitalDeployed * 100) / 100,
        totalMonthlyInterest: Math.round(totalMonthlyInterest * 100) / 100,
        totalDailyInterest: Math.round(totalDailyInterest * 100) / 100,
        activeLoansCount: activeLoans.length,
        closedLoansCount,
        totalBorrowersCount,
        overdueCount,
        interestCollectedThisMonth: monthlyCollectedRow?.interest_collected || 0,
        totalCollectedThisMonth: monthlyCollectedRow?.total_collected || 0,
        dueTodayList,
        dueTomorrowList,
        overdueList,
        recentPayments
      }
    });
  } catch (err) {
    console.error('Error in /api/dashboard/metrics:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
