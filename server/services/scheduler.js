const cron = require('node-cron');
const db = require('../db');
const { computeLoanLedger, getNextDueDate, getDaysUntil } = require('./interestEngine');
const { sendSms, formatMessage } = require('./smsService');
const { getClientLicenseStatus } = require('../middleware/auth');

/**
 * Evaluates active loans across all paid client tenants and triggers borrower and lender reminders
 * Can be called with an optional targetDate (YYYY-MM-DD) and optional specificClientId
 */
async function runDueDateCheck(targetDate = null, specificClientId = null) {
  console.log(`[SCHEDULER] Running loan due-date check... ${targetDate ? `(Date: ${targetDate})` : ''} ${specificClientId ? `(Client: #${specificClientId})` : '(All Clients)'}`);

  const results = {
    borrowerRemindersSent: 0,
    lenderAlertsSent: 0,
    skippedAlreadySent: 0,
    skippedUnpaidClients: 0,
    errors: []
  };

  const today = targetDate ? new Date(targetDate) : new Date();
  today.setHours(0, 0, 0, 0);

  // Determine clients to process
  let clientRows = [];
  if (specificClientId) {
    const c = db.prepare('SELECT * FROM clients WHERE id = ?').get(specificClientId);
    if (c) clientRows.push(c);
  } else {
    clientRows = db.prepare('SELECT * FROM clients').all();
  }

  for (const client of clientRows) {
    const license = getClientLicenseStatus(client.id);
    if (license.isLocked) {
      console.warn(`[SCHEDULER] Skipping client #${client.id} (${client.business_name}): Subscription is expired or suspended.`);
      results.skippedUnpaidClients++;
      continue;
    }

    const settings = db.prepare('SELECT * FROM lender_settings WHERE client_id = ?').get(client.id) || {};
    const activeLoans = db.prepare(`
      SELECT l.*, b.name as borrower_name, b.phone as borrower_phone, b.alias as borrower_alias
      FROM loans l
      JOIN borrowers b ON l.borrower_id = b.id
      WHERE l.status = 'ACTIVE' AND l.client_id = ?
    `).all(client.id);

    for (const loan of activeLoans) {
      try {
        const payments = db.prepare('SELECT * FROM payments WHERE loan_id = ? AND client_id = ?').all(loan.id, client.id);
        const ledger = computeLoanLedger(loan, payments);

        const nextDue = new Date(ledger.nextDueDate);
        nextDue.setHours(0, 0, 0, 0);

        const diffTime = nextDue.getTime() - today.getTime();
        const daysUntil = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const dueCycle = ledger.nextDueDate;

        const templateVars = {
          BORROWER_NAME: loan.borrower_name,
          BORROWER_PHONE: loan.borrower_phone,
          LOAN_ID: loan.id,
          PRINCIPAL_AMOUNT: ledger.currentPrincipal,
          INTEREST_AMOUNT: ledger.monthlyInterest,
          DUE_DATE: ledger.nextDueDate,
          UPI_ID: settings.upi_id || '',
          LENDER_NAME: settings.lender_name || client.business_name || 'Financier',
          LENDER_PHONE: settings.lender_phone || client.phone || ''
        };

        // 1. Borrower Reminder: 1 Day Before Due Date (daysUntil === 1)
        if (daysUntil === 1) {
          const alreadySent = db.prepare(`
            SELECT id FROM sms_logs 
            WHERE loan_id = ? AND recipient_type = 'BORROWER' AND due_date_cycle = ? AND client_id = ?
          `).get(loan.id, dueCycle, client.id);

          if (!alreadySent) {
            const template = settings.borrower_sms_template || 'Dear {BORROWER_NAME}, reminder that monthly interest of Rs.{INTEREST_AMOUNT} for loan #{LOAN_ID} is due tomorrow ({DUE_DATE}). - {LENDER_NAME}';
            const msg = formatMessage(template, templateVars);
            await sendSms({
              clientId: client.id,
              loanId: loan.id,
              borrowerId: loan.borrower_id,
              recipientType: 'BORROWER',
              recipientPhone: loan.borrower_phone,
              recipientName: loan.borrower_name,
              messageText: msg,
              triggerType: 'AUTO_CRON',
              dueDateCycle: dueCycle
            });
            results.borrowerRemindersSent++;
          } else {
            results.skippedAlreadySent++;
          }
        }

        // 2. Lender Alert: On Due Date (daysUntil === 0)
        if (daysUntil === 0) {
          const alreadySentLender = db.prepare(`
            SELECT id FROM sms_logs 
            WHERE loan_id = ? AND recipient_type = 'LENDER' AND due_date_cycle = ? AND client_id = ?
          `).get(loan.id, dueCycle, client.id);

          const lenderPhone = settings.lender_phone || client.phone;
          if (!alreadySentLender && lenderPhone) {
            const template = settings.lender_sms_template || 'COLLECTION ALERT: Rs.{INTEREST_AMOUNT} interest from {BORROWER_NAME} (Ph: {BORROWER_PHONE}) is due today ({DUE_DATE}) for loan #{LOAN_ID}.';
            const msg = formatMessage(template, templateVars);
            await sendSms({
              clientId: client.id,
              loanId: loan.id,
              borrowerId: loan.borrower_id,
              recipientType: 'LENDER',
              recipientPhone: lenderPhone,
              recipientName: settings.lender_name || client.owner_name,
              messageText: msg,
              triggerType: 'AUTO_CRON',
              dueDateCycle: dueCycle
            });
            results.lenderAlertsSent++;
          } else if (alreadySentLender) {
            results.skippedAlreadySent++;
          }
        }
      } catch (err) {
        console.error(`Error processing loan #${loan.id} for client #${client.id}:`, err);
        results.errors.push({ loanId: loan.id, clientId: client.id, error: err.message });
      }
    }
  }

  console.log(`[SCHEDULER COMPLETE] Sent ${results.borrowerRemindersSent} borrower SMS, ${results.lenderAlertsSent} lender alerts. Skipped ${results.skippedUnpaidClients} unpaid clients.`);
  return results;
}

function initScheduler() {
  const cronExpression = `0 9 * * *`;
  console.log(`[SCHEDULER] Multi-Tenant daily reminder job scheduled at 9:00 AM ('${cronExpression}')`);

  cron.schedule(cronExpression, async () => {
    try {
      await runDueDateCheck();
    } catch (e) {
      console.error('[SCHEDULER CRON ERROR]:', e);
    }
  });
}

module.exports = {
  initScheduler,
  runDueDateCheck
};
