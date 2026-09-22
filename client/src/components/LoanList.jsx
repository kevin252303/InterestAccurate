import React, { useState } from 'react';
import { 
  ReceiptIndianRupee, 
  Search, 
  Filter, 
  Send, 
  MessageSquare, 
  PlusCircle, 
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function LoanList({ 
  loans = [], 
  onSelectLoan, 
  onOpenPayment, 
  onOpenNewLoan, 
  onSendManualSms,
  onOpenWhatsApp
}) {
  const [filterStatus, setFilterStatus] = useState('ACTIVE'); // 'ALL', 'ACTIVE', 'CLOSED'
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = loans.filter((l) => {
    const matchesStatus = filterStatus === 'ALL' || l.status === filterStatus;
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      l.borrower_name?.toLowerCase().includes(q) ||
      l.borrower_phone?.includes(q) ||
      String(l.id).includes(q) ||
      l.security_type?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/40 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ReceiptIndianRupee className="w-6 h-6 text-emerald-400" />
            Loans Portfolio ({loans.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track active principal, monthly dues, daily interest rates, and loan statuses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="inline-flex p-1 bg-slate-900 rounded-xl border border-slate-700">
            {['ACTIVE', 'CLOSED', 'ALL'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search loan or borrower..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={onOpenNewLoan}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Loan</span>
          </button>
        </div>
      </div>

      {/* Loans Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/20 rounded-2xl border border-slate-800">
          <ReceiptIndianRupee className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">No loans found</p>
          <p className="text-xs text-slate-500 mt-1">Try changing filter or disburse a new loan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-800/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Loan</th>
                <th className="p-3.5">Borrower</th>
                <th className="p-3.5 text-right">Current Principal</th>
                <th className="p-3.5">Interest Rate</th>
                <th className="p-3.5 text-right">Monthly Interest</th>
                <th className="p-3.5 text-right">Daily Interest</th>
                <th className="p-3.5">Next Due</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
              {filtered.map((l) => {
                const ledger = l.ledger || {};
                return (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold font-mono text-emerald-400">
                      #{l.id}
                    </td>

                    <td className="p-3.5">
                      <div
                        className="font-bold text-white text-sm hover:text-emerald-400 cursor-pointer"
                        onClick={() => onSelectLoan(l.id)}
                      >
                        {l.borrower_name}
                      </div>
                      <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                        {l.borrower_phone}
                      </div>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="font-extrabold text-white text-sm">
                        {formatCurrency(ledger.currentPrincipal || l.current_principal)}
                      </div>
                      {l.principal_amount !== (ledger.currentPrincipal || l.current_principal) && (
                        <div className="text-[10px] text-slate-500 line-through">
                          {formatCurrency(l.principal_amount)}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-emerald-400">
                        {l.interest_rate}% {l.rate_type === 'monthly_pct' ? '/mo' : 'p.a.'}
                      </span>
                    </td>

                    <td className="p-3.5 text-right font-bold text-indigo-300">
                      {formatCurrency(ledger.monthlyInterest || 0)}
                    </td>

                    <td className="p-3.5 text-right font-medium text-teal-300">
                      {formatCurrency(ledger.dailyInterest || 0)}
                    </td>

                    <td className="p-3.5">
                      <div className="font-medium text-white">
                        {formatDate(ledger.nextDueDate)}
                      </div>
                      <div className="text-[10px] mt-0.5">
                        {ledger.daysUntilDue === 1 && (
                          <span className="text-indigo-400 font-bold">Due Tomorrow</span>
                        )}
                        {ledger.daysUntilDue === 0 && (
                          <span className="text-emerald-400 font-bold">Due Today</span>
                        )}
                        {ledger.daysUntilDue < 0 && (
                          <span className="text-rose-400 font-bold">{Math.abs(ledger.daysUntilDue)}d Overdue</span>
                        )}
                        {ledger.daysUntilDue > 1 && (
                          <span className="text-slate-400">in {ledger.daysUntilDue} days</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        l.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        l.status === 'CLOSED' ? 'bg-slate-800 text-slate-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {l.status}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectLoan(l.id)}
                          title="View Passbook / Ledger"
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
                        >
                          Passbook
                        </button>

                        {l.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => onOpenPayment(l.id)}
                              title="Record Payment"
                              className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer"
                            >
                              Pay
                            </button>
                            <button
                              onClick={() => onOpenWhatsApp(l.id)}
                              title="Send WhatsApp Reminder"
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
