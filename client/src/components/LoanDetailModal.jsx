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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900">Loan Passbook & Statement</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
                Loan #{loanId}
              </span>
              {loan && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  loan.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  loan.status === 'CLOSED' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                  'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {loan.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete borrower KYC, live interest accrual, and payment transactions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {loading || !loan ? (
          <div className="flex items-center justify-center p-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Action Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-base">
                  {loan.borrower_name?.charAt(0) || 'B'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>{loan.borrower_name}</span>
                    {loan.borrower_alias && (
                      <span className="text-xs text-slate-500 font-normal">({loan.borrower_alias})</span>
                    )}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{loan.borrower_phone}</span>
                    {loan.id_number && <span>• {loan.id_type}: {loan.id_number}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSendManualSms(loan.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Send SMS</span>
                </button>

                <button
                  onClick={() => onOpenWhatsApp(loan.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                {loan.status === 'ACTIVE' && (
                  <button
                    onClick={() => onOpenPayment(loan.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Receive Payment</span>
                  </button>
                )}
              </div>
            </div>

            {/* Live Financial Health & Accruals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Active Principal</div>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {formatCurrency(loan.ledger?.currentPrincipal)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Original: {formatCurrency(loan.principal_amount)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 shadow-xs">
                <div className="text-xs text-emerald-800 uppercase tracking-wider font-semibold">Monthly Interest</div>
                <div className="text-xl font-black text-emerald-700 mt-1">
                  {formatCurrency(loan.ledger?.monthlyInterest)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Rate: {loan.interest_rate}% {loan.rate_type === 'monthly_pct' ? '/ mo' : 'p.a.'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200 shadow-xs">
                <div className="text-xs text-teal-800 uppercase tracking-wider font-semibold">Daily Interest</div>
                <div className="text-xl font-black text-teal-700 mt-1">
                  {formatCurrency(loan.ledger?.dailyInterest)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Accrues per 24 hrs
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 shadow-xs">
                <div className="text-xs text-indigo-800 uppercase tracking-wider font-semibold">To Close Loan Today</div>
                <div className="text-xl font-black text-indigo-700 mt-1">
                  {formatCurrency(loan.ledger?.totalSettlementAmount)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Principal + Pending Interest
                </div>
              </div>
            </div>

            {/* Loan Terms & Security Collateral Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Loan Dates & Billing Schedule
                </h4>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Disbursement Date:</span>
                  <span className="text-slate-900 font-medium">{formatDate(loan.disbursement_date)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Monthly Due Day:</span>
                  <span className="text-slate-900 font-medium">{loan.due_day}th of every month</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Next Due Date:</span>
                  <span className="text-emerald-700 font-bold">{formatDate(loan.ledger?.nextDueDate)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Days Elapsed:</span>
                  <span className="text-slate-900 font-medium">{loan.ledger?.totalDaysElapsed} days since start</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Security & Collateral Held
                </h4>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Security Type:</span>
                  <span className="text-slate-900 font-medium">{loan.security_type || 'None'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Cheque / Document Ref:</span>
                  <span className="text-slate-900 font-medium">{loan.cheque_details || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Guarantor Name:</span>
                  <span className="text-slate-900 font-medium">
                    {loan.guarantor_name ? `${loan.guarantor_name} (${loan.guarantor_phone || 'No phone'})` : 'None'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Remarks / Purpose:</span>
                  <span className="text-slate-700 italic">{loan.notes || 'No notes'}</span>
                </div>
              </div>
            </div>

            {/* Payment Transactions Passbook */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Payment Transactions Passbook ({loan.payments?.length || 0})
                </h4>
              </div>

              {(!loan.payments || loan.payments.length === 0) ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs shadow-xs">
                  No payments recorded for this loan yet. Click "Receive Payment" when the borrower pays.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
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
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {loan.payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 text-slate-900 font-medium">{formatDate(p.payment_date)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-semibold ${
                              p.payment_type === 'INTEREST' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                              p.payment_type === 'PRINCIPAL' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {p.payment_type}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">
                            {p.payment_mode} {p.transaction_ref ? `(${p.transaction_ref})` : ''}
                          </td>
                          <td className="p-3 text-right text-indigo-700 font-medium">
                            {formatCurrency(p.interest_component)}
                          </td>
                          <td className="p-3 text-right text-emerald-700 font-medium">
                            {formatCurrency(p.principal_component)}
                          </td>
                          <td className="p-3 text-right text-slate-900 font-bold">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeletePayment(p.id)}
                              title="Delete Payment Entry"
                              className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
