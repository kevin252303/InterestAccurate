import React from 'react';
import { 
  Landmark, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Bell, 
  MessageSquare, 
  Phone, 
  PlusCircle, 
  Calendar, 
  ArrowUpRight,
  Send,
  ExternalLink
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function Dashboard({ 
  metrics, 
  loading, 
  onRefresh, 
  onOpenNewLoan, 
  onSelectLoan, 
  onOpenPayment, 
  onSendManualSms,
  onOpenWhatsApp
}) {
  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Capital Deployed',
      value: formatCurrency(metrics.totalCapitalDeployed),
      subtext: `${metrics.activeLoansCount} active loan${metrics.activeLoansCount === 1 ? '' : 's'} in market`,
      icon: Landmark,
      color: 'emerald',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      textColor: 'text-emerald-400'
    },
    {
      label: 'Monthly Interest Income',
      value: formatCurrency(metrics.totalMonthlyInterest),
      subtext: 'Expected monthly cash flow',
      icon: TrendingUp,
      color: 'indigo',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      textColor: 'text-indigo-400'
    },
    {
      label: 'Daily Accrued Interest',
      value: `${formatCurrency(metrics.totalDailyInterest)} / day`,
      subtext: 'Money earned every 24 hours',
      icon: Clock,
      color: 'teal',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-teal-500/20',
      textColor: 'text-teal-400'
    },
    {
      label: 'Interest Collected This Month',
      value: formatCurrency(metrics.interestCollectedThisMonth),
      subtext: `Total collected: ${formatCurrency(metrics.totalCollectedThisMonth)}`,
      icon: CheckCircle2,
      color: 'cyan',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      textColor: 'text-cyan-400'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Financier Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time capital tracking, daily interest accruals, and collection pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewLoan}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Disburse New Loan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl bg-slate-800/50 border ${kpi.borderColor} relative overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{kpi.label}</span>
                <div className={`w-9 h-9 rounded-xl ${kpi.bgColor} flex items-center justify-center ${kpi.textColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white tracking-tight">{kpi.value}</div>
              <div className="text-xs text-slate-400 mt-1.5">{kpi.subtext}</div>
            </div>
          );
        })}
      </div>

      {/* Action Centers: Dues Tomorrow & Dues Today */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dues Tomorrow (Borrower SMS List) */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Dues Tomorrow (Borrower Reminders)</h3>
                  <p className="text-xs text-slate-400">Automated SMS scheduled for borrowers 1 day before due date</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                {metrics.dueTomorrowList?.length || 0} Dues
              </span>
            </div>

            {metrics.dueTomorrowList?.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No loans with interest due tomorrow.
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.dueTomorrowList.map((item) => (
                  <div
                    key={item.loanId}
                    className="p-3.5 bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="cursor-pointer" onClick={() => onSelectLoan(item.loanId)}>
                      <div className="font-semibold text-white text-sm flex items-center gap-2">
                        <span>{item.borrowerName}</span>
                        {item.borrowerAlias && (
                          <span className="text-xs text-slate-400">({item.borrowerAlias})</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Due: <span className="text-emerald-400 font-semibold">{formatCurrency(item.monthlyInterest)}</span> • Principal: {formatCurrency(item.principal)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSendManualSms(item.loanId)}
                        title="Send SMS"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Send className="w-4 h-4 text-emerald-400" />
                      </button>
                      <button
                        onClick={() => onOpenWhatsApp(item.loanId)}
                        title="Open WhatsApp Reminder"
                        className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenPayment(item.loanId)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        Collect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dues Today (Lender Collection Alert List) */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Dues Today (Lender Action List)</h3>
                  <p className="text-xs text-slate-400">Interest payments expected today</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                {metrics.dueTodayList?.length || 0} Due Today
              </span>
            </div>

            {metrics.dueTodayList?.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No interest due today. Next scheduled collections will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.dueTodayList.map((item) => (
                  <div
                    key={item.loanId}
                    className="p-3.5 bg-slate-900/70 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="cursor-pointer" onClick={() => onSelectLoan(item.loanId)}>
                      <div className="font-semibold text-white text-sm flex items-center gap-2">
                        <span>{item.borrowerName}</span>
                        <span className="text-xs text-emerald-400 font-mono">Loan #{item.loanId}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Amount Due: <span className="text-emerald-400 font-bold">{formatCurrency(item.monthlyInterest)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenWhatsApp(item.loanId)}
                        title="WhatsApp Reminder"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenPayment(item.loanId)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Collect ₹
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overdue Defaulters Alert (if any) */}
      {metrics.overdueList && metrics.overdueList.length > 0 && (
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-400">Overdue Collections ({metrics.overdueList.length})</h3>
                <p className="text-xs text-slate-400">Loans past due date requiring follow-up</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {metrics.overdueList.map((item) => (
              <div
                key={item.loanId}
                className="p-3.5 bg-slate-900/80 border border-rose-900/60 rounded-xl flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{item.borrowerName}</span>
                    <span className="text-xs text-rose-400 font-mono">({Math.abs(item.daysUntilDue)}d overdue)</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Pending: <span className="text-rose-400 font-bold">{formatCurrency(item.monthlyInterest)}</span> • Ph: {item.borrowerPhone}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenWhatsApp(item.loanId)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 cursor-pointer"
                    title="Send WhatsApp Follow-up"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenPayment(item.loanId)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs cursor-pointer"
                  >
                    Receive
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Payments Ledger */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Recent Collection Activity
          </h3>
        </div>

        {(!metrics.recentPayments || metrics.recentPayments.length === 0) ? (
          <div className="text-center py-6 text-slate-500 text-sm">
            No payment transactions recorded yet. They will display here as you collect payments.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Borrower</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Mode</th>
                  <th className="pb-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {metrics.recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 text-slate-400 text-xs">{formatDate(p.payment_date)}</td>
                    <td className="py-3 font-medium text-white">{p.borrower_name}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        p.payment_type === 'INTEREST' ? 'bg-indigo-500/10 text-indigo-400' :
                        p.payment_type === 'PRINCIPAL' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {p.payment_type}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-400">{p.payment_mode}</td>
                    <td className="py-3 text-right font-bold text-emerald-400">
                      {formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
