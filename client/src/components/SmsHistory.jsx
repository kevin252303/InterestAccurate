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
        <div className="lg:col-span-2 bg-slate-800/40 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-emerald-400" />
              Automated SMS & Reminders Center
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Audit trail of every reminder message sent to borrowers and alert sent to the lender.
            </p>
          </div>

          {/* Schedule Engine Control */}
          <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Test Date:</span>
              <input
                type="date"
                value={simDate}
                onChange={(e) => setSimDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleTriggerCheck}
              disabled={runningCheck}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${runningCheck ? 'animate-spin' : ''}`} />
              <span>{runningCheck ? 'Checking...' : 'Run Due Date Check Now'}</span>
            </button>

            <button
              onClick={onRefresh}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              title="Refresh Logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {resultMsg && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              {resultMsg}
            </div>
          )}
        </div>

        {/* Right 1 Col: Rule Badges */}
        <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
          <div className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Active Automation Rules
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-indigo-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              1 Day Before Due Date
            </div>
            <p className="text-slate-400 text-[11px]">
              Sends automated reminder SMS to the <span className="text-white font-semibold">Borrower</span> with payment UPI & due amount.
            </p>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              On Due Date
            </div>
            <p className="text-slate-400 text-[11px]">
              Sends collection alert SMS to the <span className="text-white font-semibold">Lender</span> with borrower details.
            </p>
          </div>
        </div>
      </div>

      {/* SMS Logs Table */}
      {logs.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/20 rounded-2xl border border-slate-800">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">No SMS logs yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Click "Run Due Date Check Now" or send a manual reminder from any loan card.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-800/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Sent Time</th>
                <th className="p-3.5">Recipient</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Trigger</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Message Content</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 text-slate-400 whitespace-nowrap">
                    {formatDateTime(log.sent_at)}
                  </td>

                  <td className="p-3.5">
                    <div className="font-bold text-white">
                      {log.recipient_name || log.borrower_name || 'Financier'}
                    </div>
                    <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                      {log.recipient_phone}
                    </div>
                  </td>

                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      log.recipient_type === 'BORROWER'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {log.recipient_type}
                    </span>
                  </td>

                  <td className="p-3.5 text-slate-400">
                    <span className="text-[11px] font-mono">
                      {log.trigger_type}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      log.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-400' :
                      log.status === 'SIMULATED' ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>
                      {log.status === 'SIMULATED' ? 'SIMULATOR (OK)' : log.status}
                    </span>
                  </td>

                  <td className="p-3.5 max-w-md">
                    <p className="text-slate-300 text-xs bg-slate-950/60 p-2 rounded-lg border border-slate-800 whitespace-pre-wrap font-mono">
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
