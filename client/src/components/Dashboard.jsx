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
      bgColor: 'bg-emerald-50',
      borderColor: 'border-slate-200',
      textColor: 'text-emerald-700'
    },
    {
      label: 'Monthly Interest Income',
      value: formatCurrency(metrics.totalMonthlyInterest),
      subtext: 'Expected monthly cash flow',
      icon: TrendingUp,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-slate-200',
      textColor: 'text-indigo-700'
    },
    {
      label: 'Daily Accrued Interest',
      value: `${formatCurrency(metrics.totalDailyInterest)} / day`,
      subtext: 'Money earned every 24 hours',
      icon: Clock,
      color: 'teal',
      bgColor: 'bg-teal-50',
      borderColor: 'border-slate-200',
      textColor: 'text-teal-700'
    },
    {
      label: 'Interest Collected This Month',
      value: formatCurrency(metrics.interestCollectedThisMonth),
      subtext: `Total collected: ${formatCurrency(metrics.totalCollectedThisMonth)}`,
      icon: CheckCircle2,
      color: 'cyan',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-slate-200',
      textColor: 'text-cyan-700'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financier Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time capital tracking, daily interest accruals, and collection pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewLoan}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
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
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{kpi.label}</span>
                <div className={`w-9 h-9 rounded-xl ${kpi.bgColor} flex items-center justify-center ${kpi.textColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{kpi.value}</div>
              <div className="text-xs text-slate-500 mt-1.5">{kpi.subtext}</div>
            </div>
          );
        })}
      </div>

      {/* Action Centers: Dues Tomorrow & Dues Today */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dues Tomorrow (Borrower SMS List) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Dues Tomorrow (Borrower Reminders)</h3>
                  <p className="text-xs text-slate-500">Automated SMS scheduled for borrowers 1 day before due date</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                {metrics.dueTomorrowList?.length || 0} Dues
              </span>
            </div>

            {metrics.dueTomorrowList?.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                No loans with interest due tomorrow.
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.dueTomorrowList.map((item) => (
                  <div
                    key={item.loanId}
                    className="p-3.5 bg-slate-50/80 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="cursor-pointer" onClick={() => onSelectLoan(item.loanId)}>
                      <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                        <span>{item.borrowerName}</span>
                        {item.borrowerAlias && (
                          <span className="text-xs text-slate-500 font-normal">({item.borrowerAlias})</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Due: <span className="text-emerald-700 font-semibold">{formatCurrency(item.monthlyInterest)}</span> • Principal: {formatCurrency(item.principal)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSendManualSms(item.loanId)}
                        title="Send SMS"
                        className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      >
                        <Send className="w-4 h-4 text-emerald-600" />
                      </button>
                      <button
                        onClick={() => onOpenWhatsApp(item.loanId)}
                        title="Open WhatsApp Reminder"
                        className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenPayment(item.loanId)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Dues Today (Lender Action List)</h3>
                  <p className="text-xs text-slate-500">Interest payments expected today</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                {metrics.dueTodayList?.length || 0} Due Today
              </span>
            </div>

            {metrics.dueTodayList?.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                No interest due today. Next scheduled collections will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.dueTodayList.map((item) => (
                  <div
                    key={item.loanId}
                    className="p-3.5 bg-emerald-50/40 border border-emerald-200 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="cursor-pointer" onClick={() => onSelectLoan(item.loanId)}>
                      <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                        <span>{item.borrowerName}</span>
                        <span className="text-xs text-emerald-700 font-mono font-medium">Loan #{item.loanId}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Amount Due: <span className="text-emerald-700 font-bold">{formatCurrency(item.monthlyInterest)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenWhatsApp(item.loanId)}
                        title="WhatsApp Reminder"
                        className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-emerald-700 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenPayment(item.loanId)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
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
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-800">Overdue Collections ({metrics.overdueList.length})</h3>
                <p className="text-xs text-rose-600">Loans past due date requiring follow-up</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {metrics.overdueList.map((item) => (
              <div
                key={item.loanId}
                className="p-3.5 bg-white border border-rose-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs"
              >
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{item.borrowerName}</span>
                    <span className="text-xs text-rose-600 font-mono">({Math.abs(item.daysUntilDue)}d overdue)</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Pending: <span className="text-rose-700 font-bold">{formatCurrency(item.monthlyInterest)}</span> • Ph: {item.borrowerPhone}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenWhatsApp(item.loanId)}
                    className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer"
                    title="Send WhatsApp Follow-up"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenPayment(item.loanId)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Recent Collection Activity
          </h3>
        </div>

        {(!metrics.recentPayments || metrics.recentPayments.length === 0) ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            No payment transactions recorded yet. They will display here as you collect payments.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Date</th>
                  <th className="py-2.5 px-3 font-semibold">Borrower</th>
                  <th className="py-2.5 px-3 font-semibold">Type</th>
                  <th className="py-2.5 px-3 font-semibold">Mode</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-slate-600 text-xs">{formatDate(p.payment_date)}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">{p.borrower_name}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        p.payment_type === 'INTEREST' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        p.payment_type === 'PRINCIPAL' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {p.payment_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600">{p.payment_mode}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">
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
