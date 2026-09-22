import React, { useState, useEffect } from 'react';
import { 
  X, 
  IndianRupee, 
  Calendar, 
  Clock, 
  Phone, 
  ShieldCheck, 
  MessageSquare, 
  Send, 
  Trash2, 
  PlusCircle, 
  UserCheck,
  CheckCircle,
  FileText
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

export default function LoanDetailModal({ 
  isOpen, 
  loanId, 
  onClose, 
  onOpenPayment, 
  onSendManualSms,
  onOpenWhatsApp,
  onRefreshParent
}) {
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && loanId) {
      fetchLoanDetails();
    }
  }, [isOpen, loanId]);

  const fetchLoanDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/loans/${loanId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch loan details');
      setLoan(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment entry? The loan ledger balance will be restored.')) return;
    try {
      const res = await fetch(`/api/payments/${paymentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Delete failed');
      fetchLoanDetails();
      onRefreshParent && onRefreshParent();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-white">Loan Passbook & Statement</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold border border-slate-700">
                Loan #{loanId}
              </span>
              {loan && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  loan.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  loan.status === 'CLOSED' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {loan.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete borrower KYC, live interest accrual, and payment transactions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {loading || !loan ? (
          <div className="flex items-center justify-center p-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Action Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-800/60 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-base">
                  {loan.borrower_name?.charAt(0) || 'B'}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <span>{loan.borrower_name}</span>
                    {loan.borrower_alias && (
                      <span className="text-xs text-slate-400">({loan.borrower_alias})</span>
                    )}
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{loan.borrower_phone}</span>
                    {loan.id_number && <span>• {loan.id_type}: {loan.id_number}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSendManualSms(loan.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Send SMS</span>
                </button>

                <button
                  onClick={() => onOpenWhatsApp(loan.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                {loan.status === 'ACTIVE' && (
                  <button
                    onClick={() => onOpenPayment(loan.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Receive Payment</span>
                  </button>
                )}
              </div>
            </div>

            {/* Live Financial Health & Accruals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Principal</div>
                <div className="text-xl font-black text-white mt-1">
                  {formatCurrency(loan.ledger?.currentPrincipal)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Original: {formatCurrency(loan.principal_amount)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="text-xs text-emerald-400 uppercase tracking-wider font-semibold">Monthly Interest</div>
                <div className="text-xl font-black text-emerald-400 mt-1">
                  {formatCurrency(loan.ledger?.monthlyInterest)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Rate: {loan.interest_rate}% {loan.rate_type === 'monthly_pct' ? '/ mo' : 'p.a.'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="text-xs text-teal-400 uppercase tracking-wider font-semibold">Daily Interest</div>
                <div className="text-xl font-black text-teal-400 mt-1">
                  {formatCurrency(loan.ledger?.dailyInterest)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Accrues per 24 hrs
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/30 to-slate-800/40 border border-indigo-500/30">
                <div className="text-xs text-indigo-300 uppercase tracking-wider font-semibold">To Close Loan Today</div>
                <div className="text-xl font-black text-indigo-300 mt-1">
                  {formatCurrency(loan.ledger?.totalSettlementAmount)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Principal + Pending Interest
                </div>
              </div>
            </div>

            {/* Loan Terms & Security Collateral Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Loan Dates & Billing Schedule
                </h4>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Disbursement Date:</span>
                  <span className="text-white font-medium">{formatDate(loan.disbursement_date)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Monthly Due Day:</span>
                  <span className="text-white font-medium">{loan.due_day}th of every month</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Next Due Date:</span>
                  <span className="text-emerald-400 font-bold">{formatDate(loan.ledger?.nextDueDate)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Days Elapsed:</span>
                  <span className="text-white font-medium">{loan.ledger?.totalDaysElapsed} days since start</span>
                </div>
              </div>

              <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Security & Collateral Held
                </h4>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Security Type:</span>
                  <span className="text-white font-medium">{loan.security_type || 'None'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Cheque / Document Ref:</span>
                  <span className="text-white font-medium">{loan.cheque_details || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Guarantor Name:</span>
                  <span className="text-white font-medium">
                    {loan.guarantor_name ? `${loan.guarantor_name} (${loan.guarantor_phone || 'No phone'})` : 'None'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Remarks / Purpose:</span>
                  <span className="text-slate-300 italic">{loan.notes || 'No notes'}</span>
                </div>
              </div>
            </div>

            {/* Payment Transactions Passbook */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Payment Transactions Passbook ({loan.payments?.length || 0})
                </h4>
              </div>

              {(!loan.payments || loan.payments.length === 0) ? (
                <div className="p-8 text-center bg-slate-800/20 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                  No payments recorded for this loan yet. Click "Receive Payment" when the borrower pays.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Mode & Ref</th>
                        <th className="p-3 text-right">Interest Paid</th>
                        <th className="p-3 text-right">Principal Paid</th>
                        <th className="p-3 text-right">Total Amount</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      {loan.payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/30">
                          <td className="p-3 text-white font-medium">{formatDate(p.payment_date)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-semibold ${
                              p.payment_type === 'INTEREST' ? 'bg-indigo-500/10 text-indigo-400' :
                              p.payment_type === 'PRINCIPAL' ? 'bg-emerald-500/10 text-emerald-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>
                              {p.payment_type}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">
                            {p.payment_mode} {p.transaction_ref ? `(${p.transaction_ref})` : ''}
                          </td>
                          <td className="p-3 text-right text-indigo-300 font-medium">
                            {formatCurrency(p.interest_component)}
                          </td>
                          <td className="p-3 text-right text-emerald-300 font-medium">
                            {formatCurrency(p.principal_component)}
                          </td>
                          <td className="p-3 text-right text-white font-bold">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeletePayment(p.id)}
                              title="Delete Payment Entry"
                              className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
