import React, { useState } from 'react';
import { 
  X, 
  IndianRupee, 
  CheckCircle2, 
  Calendar, 
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function PaymentModal({ isOpen, onClose, loan, onSuccess }) {
  if (!isOpen || !loan) return null;

  const [paymentType, setPaymentType] = useState('INTEREST'); // 'INTEREST', 'PRINCIPAL', 'SETTLEMENT'
  const [amount, setAmount] = useState(() => {
    return loan.ledger?.monthlyInterest || 0;
  });
  const [paymentMode, setPaymentMode] = useState('UPI'); // 'CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentPrincipal = loan.ledger?.currentPrincipal || loan.current_principal;
  const monthlyInterest = loan.ledger?.monthlyInterest || 0;
  const payAmt = parseFloat(amount) || 0;

  let newPrincipalAfterPay = currentPrincipal;
  if (paymentType === 'PRINCIPAL' || paymentType === 'SETTLEMENT') {
    newPrincipalAfterPay = Math.max(0, currentPrincipal - payAmt);
  }

  const handleTypeChange = (type) => {
    setPaymentType(type);
    if (type === 'INTEREST') {
      setAmount(monthlyInterest);
    } else if (type === 'SETTLEMENT') {
      setAmount(loan.ledger?.totalSettlementAmount || currentPrincipal);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (payAmt <= 0) {
        throw new Error('Please enter a valid payment amount');
      }

      let princComp = 0;
      let intComp = 0;
      if (paymentType === 'INTEREST') {
        intComp = payAmt;
      } else if (paymentType === 'PRINCIPAL') {
        princComp = payAmt;
      } else if (paymentType === 'SETTLEMENT') {
        princComp = Math.min(currentPrincipal, payAmt);
        intComp = Math.max(0, payAmt - princComp);
      }

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loan_id: loan.id,
          payment_date: paymentDate,
          amount: payAmt,
          payment_type: paymentType,
          principal_component: princComp,
          interest_component: intComp,
          payment_mode: paymentMode,
          transaction_ref: transactionRef,
          notes
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Payment recording failed');

      onSuccess && onSuccess(data.data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h3 className="text-base font-bold text-white">Record Loan Payment</h3>
            <p className="text-xs text-slate-400">
              Borrower: <span className="text-emerald-400 font-semibold">{loan.borrower_name}</span> (Loan #{loan.id})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Payment Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Payment Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('INTEREST')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  paymentType === 'INTEREST'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-600'
                }`}
              >
                Monthly Interest
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('PRINCIPAL')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  paymentType === 'PRINCIPAL'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-600'
                }`}
              >
                Principal Part-Pay
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('SETTLEMENT')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  paymentType === 'SETTLEMENT'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-600'
                }`}
              >
                Full Settlement
              </button>
            </div>
          </div>

          {/* Amount Received */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex justify-between">
              <span>Amount Received (₹) *</span>
              {paymentType === 'INTEREST' && (
                <span className="text-indigo-400 font-semibold">Monthly Due: {formatCurrency(monthlyInterest)}</span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 pl-8 pr-4 text-white text-lg font-black focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Mode & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="UPI">UPI (GPay / PhonePe)</option>
                <option value="CASH">Cash in Hand</option>
                <option value="BANK_TRANSFER">Bank IMPS / NEFT</option>
                <option value="CHEQUE">Cheque Deposit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Transaction Ref / Note */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">UPI / Cheque Ref</label>
              <input
                type="text"
                placeholder="e.g. UPI Ref #492819"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Notes</label>
              <input
                type="text"
                placeholder="e.g. Paid in person"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Impact preview */}
          {paymentType === 'PRINCIPAL' && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span>Current Principal:</span>
                <span className="font-semibold text-white">{formatCurrency(currentPrincipal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>New Reduced Principal:</span>
                <span className="font-bold text-emerald-400">{formatCurrency(newPrincipalAfterPay)}</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Future monthly interest will automatically reduce to match the new principal.
              </p>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {submitting ? 'Recording...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
