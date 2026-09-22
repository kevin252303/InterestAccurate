const express = require('express');
const router = express.Router();
const db = require('../db');
const { calculateBaseInterest, calculatePeriodInterest, computeLoanLedger } = require('../services/interestEngine');

// Standalone calculator (safe public tool for any user)
router.post('/calculate', (req, res) => {
  try {
    const { principal, rate, rateType, startDate, endDate } = req.body;
    if (!principal || !rate) {
      return res.status(400).json({ success: false, message: 'Principal and Rate are required' });
    }

    if (startDate && endDate) {
      const calculation = calculatePeriodInterest(principal, rate, rateType || 'monthly_pct', startDate, endDate);
      return res.json({ success: true, data: calculation });
    }

    const baseCalc = calculateBaseInterest(principal, rate, rateType || 'monthly_pct');
    res.json({ success: true, data: baseCalc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// List all loans for current client
router.get('/', (req, res) => {
  try {
    const clientId = req.clientId || 1;
    const statusFilter = req.query.status;
    let query = `
      SELECT l.*, b.name as borrower_name, b.phone as borrower_phone, b.alias as borrower_alias
      FROM loans l
      JOIN borrowers b ON l.borrower_id = b.id
      WHERE l.client_id = ?
    `;
    const params = [clientId];

    if (statusFilter) {
      query += ` AND l.status = ?`;
      params.push(statusFilter.toUpperCase());
    }

    query += ` ORDER BY l.id DESC`;

    const loans = db.prepare(query).all(...params);
    const enriched = loans.map(loan => {
      const payments = db.prepare('SELECT * FROM payments WHERE loan_id = ? AND client_id = ?').all(loan.id, clientId);
      const ledger = computeLoanLedger(loan, payments);
      return {
        ...loan,
        ledger
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single loan by ID
router.get('/:id', (req, res) => {
  try {
    const clientId = req.clientId || 1;
    const loan = db.prepare(`
      SELECT l.*, b.name as borrower_name, b.phone as borrower_phone, b.alias as borrower_alias,
             b.residential_address, b.work_address, b.id_type, b.id_number,
             b.guarantor_name, b.guarantor_phone, b.guarantor_address, b.guarantor_relation
      FROM loans l
      JOIN borrowers b ON l.borrower_id = b.id
      WHERE l.id = ? AND l.client_id = ?
    `).get(req.params.id, clientId);

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const payments = db.prepare('SELECT * FROM payments WHERE loan_id = ? AND client_id = ? ORDER BY payment_date ASC, id ASC').all(loan.id, clientId);
    const ledger = computeLoanLedger(loan, payments);

    res.json({
      success: true,
      data: {
        ...loan,
        ledger,
        payments
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Disburse new loan for current client
router.post('/', (req, res) => {
  try {
    const clientId = req.clientId || 1;
    const {
      borrower_id,
      principal_amount,
      interest_rate,
      rate_type = 'monthly_pct',
      disbursement_date,
      due_day,
      upfront_interest_deducted = 0,
      security_type = 'Promissory Note',
      cheque_details = '',
      security_notes = '',
      notes = ''
    } = req.body;

    if (!borrower_id || !principal_amount || !interest_rate || !disbursement_date) {
      return res.status(400).json({ success: false, message: 'Borrower, Principal, Interest Rate, and Disbursement Date are required' });
    }

    const principal = parseFloat(principal_amount);
    const rate = parseFloat(interest_rate);
    const baseInterest = calculateBaseInterest(principal, rate, rate_type);

    let upfrontAmount = 0;
    let netDisbursed = principal;

    if (upfront_interest_deducted) {
      upfrontAmount = baseInterest.monthlyInterest;
      netDisbursed = Math.round((principal - upfrontAmount) * 100) / 100;
    }

    const parsedDate = new Date(disbursement_date);
    const resolvedDueDay = due_day ? parseInt(due_day, 10) : parsedDate.getDate();

    const stmt = db.prepare(`
      INSERT INTO loans (
        client_id, borrower_id, principal_amount, current_principal, interest_rate, rate_type,
        disbursement_date, due_day, upfront_interest_deducted, upfront_interest_amount,
        net_disbursed_amount, security_type, cheque_details, security_notes, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    `);

    const result = stmt.run(
      clientId,
      borrower_id,
      principal,
      principal,
      rate,
      rate_type,
      disbursement_date,
      resolvedDueDay,
      upfront_interest_deducted ? 1 : 0,
      upfrontAmount,
      netDisbursed,
      security_type,
      cheque_details,
      security_notes,
      notes
    );

    const newLoan = db.prepare('SELECT * FROM loans WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newLoan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update loan status
router.patch('/:id/status', (req, res) => {
  try {
    const clientId = req.clientId || 1;
    const { status } = req.body;
    if (!['ACTIVE', 'CLOSED', 'DEFAULTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    db.prepare(`UPDATE loans SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND client_id = ?`).run(status, req.params.id, clientId);
    res.json({ success: true, message: `Loan status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
