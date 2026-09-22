const express = require('express');
const router = express.Router();
const db = require('../db');
const { computeLoanLedger } = require('../services/interestEngine');

// List borrowers for current client
router.get('/', (req, res) => {
  try {
    const clientId = req.clientId || 1;
    const borrowers = db.prepare(`
      SELECT b.*,
        (SELECT COUNT(*) FROM loans WHERE borrower_id = b.id AND client_id = ? AND status = 'ACTIVE') as active_loans_count,
        (SELECT COALESCE(SUM(current_principal), 0) FROM loans WHERE borrower_id = b.id AND client_id = ? AND status = 'ACTIVE') as total_principal_outstanding
      FROM borrowers b
      WHERE b.client_id = ?
      ORDER BY b.id DESC
    `).all(clientId, clientId, clientId);

    res.json({ success: true, data: borrowers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single borrower details
router.get('/:id', (req, res) => {
  try {
    const clientId = req.clientId || 1;
    const borrower = db.prepare('SELECT * FROM borrowers WHERE id = ? AND client_id = ?').get(req.params.id, clientId);
    if (!borrower) {
      return res.status(404).json({ success: false, message: 'Borrower not found' });
    }

    const loans = db.prepare('SELECT * FROM loans WHERE borrower_id = ? AND client_id = ? ORDER BY id DESC').all(borrower.id, clientId);
    const enrichedLoans = loans.map(loan => {
      const payments = db.prepare('SELECT * FROM payments WHERE loan_id = ? AND client_id = ? ORDER BY payment_date DESC').all(loan.id, clientId);
      const ledger = computeLoanLedger(loan, payments);
      return {
        ...loan,
        ledger,
        payments
      };
    });

    res.json({
      success: true,
      data: {
        ...borrower,
        loans: enrichedLoans
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new borrower for current client
router.post('/', (req, res) => {
  try {
    const clientId = req.clientId || 1;
    const {
      name,
      alias,
      phone,
      alt_phone,
      email,
      residential_address,
      work_address,
      id_type,
      id_number,
      guarantor_name,
      guarantor_phone,
      guarantor_address,
      guarantor_relation,
      notes
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Borrower Name and Phone are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO borrowers (
        client_id, name, alias, phone, alt_phone, email, 
        residential_address, work_address, id_type, id_number,
        guarantor_name, guarantor_phone, guarantor_address, guarantor_relation, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      clientId,
      name.trim(),
      alias ? alias.trim() : '',
      phone.trim(),
      alt_phone ? alt_phone.trim() : '',
      email ? email.trim() : '',
      residential_address || '',
      work_address || '',
      id_type || 'Aadhaar',
      id_number || '',
      guarantor_name || '',
      guarantor_phone || '',
      guarantor_address || '',
      guarantor_relation || '',
      notes || ''
    );

    const newBorrower = db.prepare('SELECT * FROM borrowers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newBorrower });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update borrower
router.put('/:id', (req, res) => {
  try {
    const clientId = req.clientId || 1;
    const {
      name,
      alias,
      phone,
      alt_phone,
      email,
      residential_address,
      work_address,
      id_type,
      id_number,
      guarantor_name,
      guarantor_phone,
      guarantor_address,
      guarantor_relation,
      notes
    } = req.body;

    const stmt = db.prepare(`
      UPDATE borrowers SET
        name = ?, alias = ?, phone = ?, alt_phone = ?, email = ?,
        residential_address = ?, work_address = ?, id_type = ?, id_number = ?,
        guarantor_name = ?, guarantor_phone = ?, guarantor_address = ?, guarantor_relation = ?, notes = ?
      WHERE id = ? AND client_id = ?
    `);

    stmt.run(
      name.trim(),
      alias ? alias.trim() : '',
      phone.trim(),
      alt_phone ? alt_phone.trim() : '',
      email ? email.trim() : '',
      residential_address || '',
      work_address || '',
      id_type || 'Aadhaar',
      id_number || '',
      guarantor_name || '',
      guarantor_phone || '',
      guarantor_address || '',
      guarantor_relation || '',
      notes || '',
      req.params.id,
      clientId
    );

    const updated = db.prepare('SELECT * FROM borrowers WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete borrower
router.delete('/:id', (req, res) => {
  try {
    const clientId = req.clientId || 1;
    const activeLoan = db.prepare("SELECT id FROM loans WHERE borrower_id = ? AND client_id = ? AND status = 'ACTIVE' LIMIT 1").get(req.params.id, clientId);
    if (activeLoan) {
      return res.status(400).json({ success: false, message: 'Cannot delete borrower with active loans. Close loans first.' });
    }

    db.prepare('DELETE FROM borrowers WHERE id = ? AND client_id = ?').run(req.params.id, clientId);
    res.json({ success: true, message: 'Borrower deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
