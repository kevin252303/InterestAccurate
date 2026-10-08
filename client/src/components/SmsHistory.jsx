import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Calendar, 
  Sparkles,
  Phone,
  User
} from 'lucide-react';
import { formatDate, formatDateTime } from '../utils/formatters';

export default function SmsHistory({ logs = [], onRefresh, onRunCheck }) {
  const [runningCheck, setRunningCheck] = useState(false);
  const [simDate, setSimDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [resultMsg, setResultMsg] = useState(null);

  const handleTriggerCheck = async () => {
    setRunningCheck(true);
    setResultMsg(null);
    try {
      const res = await fetch('/api/sms/run-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDate: simDate })
      });
      const data = await res.json();
      if (data.success) {
        setResultMsg(`Success! Sent ${data.data.borrowerRemindersSent} borrower reminder(s), ${data.data.lenderAlertsSent} lender alert(s).`);
        onRefresh && onRefresh();
      } else {
        setResultMsg(`Error: ${data.message || 'Failed'}`);
      }
    } catch (err) {
      setResultMsg(`Error: ${err.message}`);
    } finally {
      setRunningCheck(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Rule Summary Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Title and Trigger */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-emerald-600" />
              Automated SMS & Reminders Center
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Audit trail of every reminder message sent to borrowers and alert sent to the lender.
            </p>
          </div>

          {/* Schedule Engine Control */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">Test Date:</span>
              <input
                type="date"
                value={simDate}
                onChange={(e) => setSimDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 text-xs focus:outline-none focus:border-emerald-600"
              />
            </div>

            <button
              onClick={handleTriggerCheck}
              disabled={runningCheck}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${runningCheck ? 'animate-spin' : ''}`} />
              <span>{runningCheck ? 'Checking...' : 'Run Due Date Check Now'}</span>
            </button>

            <button
              onClick={onRefresh}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition-colors cursor-pointer border border-slate-200"
              title="Refresh Logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {resultMsg && (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
              {resultMsg}
            </div>
          )}
        </div>

        {/* Right 1 Col: Rule Badges */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
          <div className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Active Automation Rules
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-indigo-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              1 Day Before Due Date
            </div>
            <p className="text-slate-600 text-[11px]">
              Sends automated reminder SMS to the <span className="text-slate-900 font-semibold">Borrower</span> with payment UPI & due amount.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              On Due Date
            </div>
            <p className="text-slate-600 text-[11px]">
              Sends collection alert SMS to the <span className="text-slate-900 font-semibold">Lender</span> with borrower details.
            </p>
          </div>
        </div>
      </div>

      {/* SMS Logs Table */}
      {logs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No SMS logs yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Click "Run Due Date Check Now" or send a manual reminder from any loan card.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Sent Time</th>
                <th className="p-3.5">Recipient</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Trigger</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Message Content</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 text-slate-600 whitespace-nowrap">
                    {formatDateTime(log.sent_at)}
                  </td>

                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">
                      {log.recipient_name || log.borrower_name || 'Financier'}
                    </div>
                    <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                      {log.recipient_phone}
                    </div>
                  </td>

                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      log.recipient_type === 'BORROWER'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {log.recipient_type}
                    </span>
                  </td>

                  <td className="p-3.5 text-slate-600">
                    <span className="text-[11px] font-mono">
                      {log.trigger_type}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      log.status === 'SENT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      log.status === 'SIMULATED' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                      'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {log.status === 'SIMULATED' ? 'SIMULATOR (OK)' : log.status}
                    </span>
                  </td>

                  <td className="p-3.5 max-w-md">
                    <p className="text-slate-800 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 whitespace-pre-wrap font-mono">
                      {log.message_text}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
