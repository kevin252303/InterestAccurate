const express = require('express');
const router = express.Router();
const db = require('../db');

// List payments for a loan
router.get('/loan/:loanId', (req, res) => {
  try {
    const clientId = req.clientId || 1;
    const payments = db.prepare(`
      SELECT p.*, b.name as borrower_name
      FROM payments p
      JOIN borrowers b ON p.borrower_id = b.id
      WHERE p.loan_id = ? AND p.client_id = ?
      ORDER BY p.payment_date DESC, p.id DESC
    `).all(req.params.loanId, clientId);

    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Record a new payment
router.post('/', (req, res) => {
  try {
    const clientId = req.clientId || 1;
    const {
      loan_id,
      payment_date,
      amount,
      payment_type = 'INTEREST',
      principal_component = 0,
      interest_component = 0,
      payment_mode = 'CASH',
      transaction_ref = '',
      notes = ''
    } = req.body;

    if (!loan_id || !payment_date || !amount) {
      return res.status(400).json({ success: false, message: 'Loan ID, Payment Date, and Amount are required' });
    }

    const loan = db.prepare('SELECT * FROM loans WHERE id = ? AND client_id = ?').get(loan_id, clientId);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const payAmount = parseFloat(amount);
    let princComp = parseFloat(principal_component) || 0;
    let intComp = parseFloat(interest_component) || 0;

    if (payment_type === 'INTEREST') {
      intComp = payAmount;
      princComp = 0;
    } else if (payment_type === 'PRINCIPAL') {
      princComp = payAmount;
      intComp = 0;
    } else if (payment_type === 'SETTLEMENT') {
      if (princComp === 0 && intComp === 0) {
        princComp = Math.min(loan.current_principal, payAmount);
        intComp = Math.max(0, payAmount - princComp);
      }
    }

    db.exec('BEGIN TRANSACTION');
    try {
      const insertStmt = db.prepare(`
        INSERT INTO payments (
          client_id, loan_id, borrower_id, payment_date, amount, payment_type,
          principal_component, interest_component, payment_mode, transaction_ref, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insertStmt.run(
        clientId,
        loan.id,
        loan.borrower_id,
        payment_date,
        payAmount,
        payment_type,
        princComp,
        intComp,
        payment_mode,
        transaction_ref || '',
        notes || ''
      );

      if (princComp > 0) {
        const newPrincipal = Math.max(0, Math.round((loan.current_principal - princComp) * 100) / 100);
        const newStatus = newPrincipal === 0 ? 'CLOSED' : loan.status;

        db.prepare(`
          UPDATE loans 
          SET current_principal = ?, status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND client_id = ?
        `).run(newPrincipal, newStatus, loan.id, clientId);
      }

      db.exec('COMMIT');
      const newPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json({ success: true, data: newPayment });
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete payment
router.delete('/:id', (req, res) => {
  try {
    const clientId = req.clientId || 1;
    const payment = db.prepare('SELECT * FROM payments WHERE id = ? AND client_id = ?').get(req.params.id, clientId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    db.exec('BEGIN TRANSACTION');
    try {
      if (payment.principal_component > 0) {
        const loan = db.prepare('SELECT * FROM loans WHERE id = ? AND client_id = ?').get(payment.loan_id, clientId);
        if (loan) {
          const restoredPrincipal = Math.round((loan.current_principal + payment.principal_component) * 100) / 100;
          db.prepare(`
            UPDATE loans 
            SET current_principal = ?, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND client_id = ?
          `).run(restoredPrincipal, loan.id, clientId);
        }
      }

      db.prepare('DELETE FROM payments WHERE id = ? AND client_id = ?').run(payment.id, clientId);
      db.exec('COMMIT');
      res.json({ success: true, message: 'Payment deleted and ledger balance restored' });
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
