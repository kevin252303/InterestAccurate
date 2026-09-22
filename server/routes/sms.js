const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendSms, formatMessage, generateWhatsAppUrl } = require('../services/smsService');
const { computeLoanLedger } = require('../services/interestEngine');
const { runDueDateCheck } = require('../services/scheduler');

// Get SMS history logs for current client
router.get('/logs', (req, res) => {
  try {
    const clientId = req.clientId || 1;
    const logs = db.prepare(`
      SELECT s.*, b.name as borrower_name
      FROM sms_logs s
      LEFT JOIN borrowers b ON s.borrower_id = b.id
      WHERE s.client_id = ?
      ORDER BY s.id DESC
      LIMIT 100
    `).all(clientId);

    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Trigger daily check immediately
router.post('/run-check', async (req, res) => {
  try {
    const clientId = req.clientId || 1;
    const { targetDate } = req.body;
    const result = await runDueDateCheck(targetDate || null, clientId);
    res.json({ success: true, message: 'Due date check executed successfully', data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send instant manual reminder SMS to borrower for a loan
router.post('/send-manual', async (req, res) => {
  try {
    const clientId = req.clientId || 1;
    const { loan_id, custom_message } = req.body;
    if (!loan_id) {
      return res.status(400).json({ success: false, message: 'loan_id is required' });
    }

    const loan = db.prepare(`
      SELECT l.*, b.name as borrower_name, b.phone as borrower_phone
      FROM loans l
      JOIN borrowers b ON l.borrower_id = b.id
      WHERE l.id = ? AND l.client_id = ?
    `).get(loan_id, clientId);

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const settings = db.prepare('SELECT * FROM lender_settings WHERE client_id = ?').get(clientId) || {};
    const payments = db.prepare('SELECT * FROM payments WHERE loan_id = ? AND client_id = ?').all(loan.id, clientId);
    const ledger = computeLoanLedger(loan, payments);

    let messageText = custom_message;
    if (!messageText) {
      const templateVars = {
        BORROWER_NAME: loan.borrower_name,
        BORROWER_PHONE: loan.borrower_phone,
        LOAN_ID: loan.id,
        PRINCIPAL_AMOUNT: ledger.currentPrincipal,
        INTEREST_AMOUNT: ledger.monthlyInterest,
        DUE_DATE: ledger.nextDueDate,
        UPI_ID: settings.upi_id || '',
        LENDER_NAME: settings.lender_name || 'Financier',
        LENDER_PHONE: settings.lender_phone || ''
      };
      messageText = formatMessage(settings.borrower_sms_template || 'Dear {BORROWER_NAME}, interest of Rs.{INTEREST_AMOUNT} for loan #{LOAN_ID} is due tomorrow ({DUE_DATE}). UPI: {UPI_ID}', templateVars);
    }

    const result = await sendSms({
      clientId,
      loanId: loan.id,
      borrowerId: loan.borrower_id,
      recipientType: 'BORROWER',
      recipientPhone: loan.borrower_phone,
      recipientName: loan.borrower_name,
      messageText,
      triggerType: 'MANUAL',
      dueDateCycle: ledger.nextDueDate
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Generate WhatsApp reminder link for a loan
router.get('/whatsapp-link/:loanId', (req, res) => {
  try {
    const clientId = req.clientId || 1;
    const loan = db.prepare(`
      SELECT l.*, b.name as borrower_name, b.phone as borrower_phone
      FROM loans l
      JOIN borrowers b ON l.borrower_id = b.id
      WHERE l.id = ? AND l.client_id = ?
    `).get(req.params.loanId, clientId);

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const settings = db.prepare('SELECT * FROM lender_settings WHERE client_id = ?').get(clientId) || {};
    const payments = db.prepare('SELECT * FROM payments WHERE loan_id = ? AND client_id = ?').all(loan.id, clientId);
    const ledger = computeLoanLedger(loan, payments);

    const templateVars = {
      BORROWER_NAME: loan.borrower_name,
      BORROWER_PHONE: loan.borrower_phone,
      LOAN_ID: loan.id,
      PRINCIPAL_AMOUNT: ledger.currentPrincipal,
      INTEREST_AMOUNT: ledger.monthlyInterest,
      DUE_DATE: ledger.nextDueDate,
      UPI_ID: settings.upi_id || '',
      LENDER_NAME: settings.lender_name || 'Financier',
      LENDER_PHONE: settings.lender_phone || ''
    };

    const template = settings.borrower_sms_template || 'Dear {BORROWER_NAME}, interest of Rs.{INTEREST_AMOUNT} for loan #{LOAN_ID} is due tomorrow ({DUE_DATE}). - {LENDER_NAME}';
    const messageText = formatMessage(template, templateVars);
    const whatsappUrl = generateWhatsAppUrl(loan.borrower_phone, messageText);

    res.json({
      success: true,
      data: {
        whatsappUrl,
        messageText,
        borrowerPhone: loan.borrower_phone,
        borrowerName: loan.borrower_name
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
