import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  Users, 
  IndianRupee, 
  ShieldCheck, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  FileText
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function NewLoanModal({ isOpen, onClose, onSuccess, existingBorrowers = [] }) {
  const [borrowerMode, setBorrowerMode] = useState('new'); // 'new' or 'existing'
  const [selectedBorrowerId, setSelectedBorrowerId] = useState('');

  // Borrower KYC Form State
  const [borrowerForm, setBorrowerForm] = useState({
    name: '',
    alias: '',
    phone: '',
    alt_phone: '',
    email: '',
    residential_address: '',
    work_address: '',
    id_type: 'Aadhaar',
    id_number: '',
    guarantor_name: '',
    guarantor_phone: '',
    guarantor_relation: '',
    guarantor_address: '',
    notes: ''
  });

  // Loan Terms Form State
  const [loanForm, setLoanForm] = useState({
    principal_amount: 50000,
    interest_rate: 2,
    rate_type: 'monthly_pct', // 'monthly_pct' or 'annual_pct'
    disbursement_date: new Date().toISOString().split('T')[0],
    due_day: new Date().getDate(),
    upfront_interest_deducted: false,
    security_type: 'Promissory Note',
    cheque_details: '',
    security_notes: '',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Live Interest Calculations
  const principal = parseFloat(loanForm.principal_amount) || 0;
  const rate = parseFloat(loanForm.interest_rate) || 0;
  let monthlyInterest = 0;
  let dailyInterest = 0;

  if (loanForm.rate_type === 'monthly_pct') {
    monthlyInterest = (principal * rate) / 100;
    dailyInterest = monthlyInterest / 30;
  } else {
    monthlyInterest = (principal * rate) / (12 * 100);
    dailyInterest = (principal * rate) / (365 * 100);
  }

  const upfrontAmount = loanForm.upfront_interest_deducted ? monthlyInterest : 0;
  const netDisbursed = principal - upfrontAmount;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let finalBorrowerId = selectedBorrowerId;

      // 1. If creating new borrower, save borrower first
      if (borrowerMode === 'new') {
        if (!borrowerForm.name.trim() || !borrowerForm.phone.trim()) {
          throw new Error('Borrower Name and Mobile Phone are required');
        }

        const bRes = await fetch('/api/borrowers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(borrowerForm)
        });
        const bData = await bRes.json();
        if (!bData.success) throw new Error(bData.message || 'Failed to save borrower');
        finalBorrowerId = bData.data.id;
      } else {
        if (!finalBorrowerId) throw new Error('Please select a borrower');
      }

      // 2. Create the Loan
      const loanRes = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrower_id: finalBorrowerId,
          principal_amount: principal,
          interest_rate: rate,
          rate_type: loanForm.rate_type,
          disbursement_date: loanForm.disbursement_date,
          due_day: parseInt(loanForm.due_day, 10),
          upfront_interest_deducted: loanForm.upfront_interest_deducted ? 1 : 0,
          security_type: loanForm.security_type,
          cheque_details: loanForm.cheque_details,
          security_notes: loanForm.security_notes,
          notes: loanForm.notes
        })
      });

      const loanData = await loanRes.json();
      if (!loanData.success) throw new Error(loanData.message || 'Failed to disburse loan');

      onSuccess && onSuccess(loanData.data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Disburse New Loan & Borrower Intake
            </h2>
            <p className="text-xs text-slate-400">
              Record borrower KYC, collateral security, and interest terms.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Section 1: Borrower Selection / Onboarding */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                1. Borrower Information (KYC)
              </span>

              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setBorrowerMode('new')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    borrowerMode === 'new' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  + New Borrower
                </button>
                <button
                  type="button"
                  onClick={() => setBorrowerMode('existing')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    borrowerMode === 'existing' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Existing ({existingBorrowers.length})
                </button>
              </div>
            </div>

            {borrowerMode === 'existing' ? (
              <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800">
                <label className="block text-xs text-slate-400 mb-1">Select Borrower</label>
                <select
                  value={selectedBorrowerId}
                  onChange={(e) => setSelectedBorrowerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">-- Choose Borrower --</option>
                  {existingBorrowers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.alias ? `(${b.alias})` : ''} — {b.phone}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={borrowerForm.name}
                      onChange={(e) => setBorrowerForm({ ...borrowerForm, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Known As / Nickname</label>
                    <input
                      type="text"
                      placeholder="e.g. Tea Stall Ramesh"
                      value={borrowerForm.alias}
                      onChange={(e) => setBorrowerForm({ ...borrowerForm, alias: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Mobile Phone (For SMS) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={borrowerForm.phone}
                      onChange={(e) => setBorrowerForm({ ...borrowerForm, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Alt Phone / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876500000"
                      value={borrowerForm.alt_phone}
                      onChange={(e) => setBorrowerForm({ ...borrowerForm, alt_phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">ID Proof Type</label>
                    <select
                      value={borrowerForm.id_type}
                      onChange={(e) => setBorrowerForm({ ...borrowerForm, id_type: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Passport">Passport</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">ID Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 1234 5678 9012"
                      value={borrowerForm.id_number}
                      onChange={(e) => setBorrowerForm({ ...borrowerForm, id_number: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Residential Address</label>
                    <textarea
                      rows="2"
                      placeholder="House no, Street, Landmark, Village/City"
                      value={borrowerForm.residential_address}
                      onChange={(e) => setBorrowerForm({ ...borrowerForm, residential_address: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Work / Business Address</label>
                    <textarea
                      rows="2"
                      placeholder="Shop name, Office, Business location"
                      value={borrowerForm.work_address}
                      onChange={(e) => setBorrowerForm({ ...borrowerForm, work_address: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Guarantor Details */}
                <div className="pt-3 border-t border-slate-700/60">
                  <div className="text-xs font-semibold text-slate-300 mb-2.5">
                    Guarantor / Surety Information (Optional)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Guarantor Name"
                        value={borrowerForm.guarantor_name}
                        onChange={(e) => setBorrowerForm({ ...borrowerForm, guarantor_name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Guarantor Phone"
                        value={borrowerForm.guarantor_phone}
                        onChange={(e) => setBorrowerForm({ ...borrowerForm, guarantor_phone: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Relationship (Friend, Brother, etc.)"
                        value={borrowerForm.guarantor_relation}
                        onChange={(e) => setBorrowerForm({ ...borrowerForm, guarantor_relation: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Loan Financial Terms */}
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-400" />
              2. Loan & Interest Terms
            </span>

            <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Principal Amount */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Principal Amount (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      value={loanForm.principal_amount}
                      onChange={(e) => setLoanForm({ ...loanForm, principal_amount: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-7 pr-3 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Interest Rate */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Interest Rate *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={loanForm.interest_rate}
                      onChange={(e) => setLoanForm({ ...loanForm, interest_rate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Rate Type */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Rate Type</label>
                  <select
                    value={loanForm.rate_type}
                    onChange={(e) => setLoanForm({ ...loanForm, rate_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="monthly_pct">₹ per ₹100/mo (% monthly)</option>
                    <option value="annual_pct">% Per Annum (p.a.)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Disbursement Date */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Disbursement Date *</label>
                  <input
                    type="date"
                    required
                    value={loanForm.disbursement_date}
                    onChange={(e) => {
                      const d = e.target.value;
                      setLoanForm({
                        ...loanForm,
                        disbursement_date: d,
                        due_day: new Date(d).getDate()
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Due Day of Month */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Monthly Due Day (1..31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={loanForm.due_day}
                    onChange={(e) => setLoanForm({ ...loanForm, due_day: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Upfront Interest Toggle */}
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={loanForm.upfront_interest_deducted}
                      onChange={(e) => setLoanForm({ ...loanForm, upfront_interest_deducted: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Deduct 1st month interest upfront</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Collateral & Security Details */}
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              3. Security & Collateral Documents
            </span>

            <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Security Type Taken</label>
                  <select
                    value={loanForm.security_type}
                    onChange={(e) => setLoanForm({ ...loanForm, security_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Promissory Note">Promissory Note (Signed)</option>
                    <option value="Blank Cheque">Signed Blank Cheque</option>
                    <option value="Both Cheque and Note">Both Cheque & Promissory Note</option>
                    <option value="Gold Collateral">Gold Jewelry / Collateral</option>
                    <option value="Vehicle RC">Vehicle RC Book</option>
                    <option value="Property Documents">Property / Land Documents</option>
                    <option value="None">None / Trust Basis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Cheque / Document Details</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank Cheque #452109"
                    value={loanForm.cheque_details}
                    onChange={(e) => setLoanForm({ ...loanForm, cheque_details: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Loan Remarks / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Shop renovation, emergency medical, given in cash"
                  value={loanForm.notes}
                  onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Live Loan Summary Box */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Monthly Interest</div>
              <div className="text-lg font-black text-emerald-400">{formatCurrency(monthlyInterest)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Daily Accrual</div>
              <div className="text-lg font-black text-teal-400">{formatCurrency(dailyInterest)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Upfront Deducted</div>
              <div className="text-lg font-black text-amber-400">{formatCurrency(upfrontAmount)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Net Cash Handover</div>
              <div className="text-lg font-black text-white">{formatCurrency(netDisbursed)}</div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Disbursing...' : 'Disburse Loan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
