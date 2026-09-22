import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  CheckCircle2, 
  ShieldCheck, 
  Phone, 
  CreditCard, 
  MessageSquare,
  Sparkles
} from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, onSettingsUpdated }) {
  const [settings, setSettings] = useState({
    lender_name: '',
    business_name: '',
    lender_phone: '',
    upi_id: '',
    sms_provider: 'SIMULATOR',
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: '',
    fast2sms_api_key: '',
    borrower_sms_template: '',
    lender_sms_template: '',
    daily_sms_hour: 9
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Settings saved successfully!');
        onSettingsUpdated && onSettingsUpdated(data.data);
        setTimeout(() => onClose(), 800);
      } else {
        setMsg(`Error: ${data.message || 'Failed'}`);
      }
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Lender Profile & SMS Gateway Settings</h2>
              <p className="text-xs text-slate-400">Configure lender alerts, UPI ID, and SMS credentials.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {msg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              {msg}
            </div>
          )}

          {/* 1. Lender Profile */}
          <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              Lender Identity & Due Date Alerts
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Financier / Lender Name</label>
                <input
                  type="text"
                  value={settings.lender_name || ''}
                  onChange={(e) => setSettings({ ...settings, lender_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Business / Firm Name</label>
                <input
                  type="text"
                  value={settings.business_name || ''}
                  onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Lender Mobile (Receives Due Date SMS) *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={settings.lender_phone || ''}
                  onChange={(e) => setSettings({ ...settings, lender_phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Lender UPI ID (Included in borrower SMS)</label>
                <input
                  type="text"
                  placeholder="e.g. myfirm@upi"
                  value={settings.upi_id || ''}
                  onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 2. SMS Gateway Configuration */}
          <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              SMS Delivery Gateway
            </h4>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Active SMS Provider</label>
              <div className="grid grid-cols-3 gap-2">
                {['SIMULATOR', 'FAST2SMS', 'TWILIO'].map((prov) => (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => setSettings({ ...settings, sms_provider: prov })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      settings.sms_provider === prov
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {prov === 'SIMULATOR' ? 'Free Simulator' : prov}
                  </button>
                ))}
              </div>
            </div>

            {settings.sms_provider === 'SIMULATOR' && (
              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs text-teal-300">
                <span className="font-bold">Simulator Active:</span> SMS reminders are simulated and safely logged directly in the app. No paid account required!
              </div>
            )}

            {settings.sms_provider === 'FAST2SMS' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Fast2SMS Authorization API Key</label>
                <input
                  type="password"
                  value={settings.fast2sms_api_key || ''}
                  onChange={(e) => setSettings({ ...settings, fast2sms_api_key: e.target.value })}
                  placeholder="Paste Fast2SMS API Key"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {settings.sms_provider === 'TWILIO' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Twilio Account SID</label>
                  <input
                    type="text"
                    value={settings.twilio_account_sid || ''}
                    onChange={(e) => setSettings({ ...settings, twilio_account_sid: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Twilio Auth Token</label>
                  <input
                    type="password"
                    value={settings.twilio_auth_token || ''}
                    onChange={(e) => setSettings({ ...settings, twilio_auth_token: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Twilio Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1234567890"
                    value={settings.twilio_phone_number || ''}
                    onChange={(e) => setSettings({ ...settings, twilio_phone_number: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Customizable Message Templates */}
          <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              SMS Message Templates
            </h4>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Borrower Reminder Template (Sent 1 Day Before Due Date)
              </label>
              <textarea
                rows="3"
                value={settings.borrower_sms_template || ''}
                onChange={(e) => setSettings({ ...settings, borrower_sms_template: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Lender Alert Template (Sent on Due Date)
              </label>
              <textarea
                rows="2"
                value={settings.lender_sms_template || ''}
                onChange={(e) => setSettings({ ...settings, lender_sms_template: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="text-[11px] text-slate-500">
              Placeholders: <span className="text-emerald-400 font-mono">&#123;BORROWER_NAME&#125;</span>, <span className="text-emerald-400 font-mono">&#123;INTEREST_AMOUNT&#125;</span>, <span className="text-emerald-400 font-mono">&#123;LOAN_ID&#125;</span>, <span className="text-emerald-400 font-mono">&#123;DUE_DATE&#125;</span>, <span className="text-emerald-400 font-mono">&#123;UPI_ID&#125;</span>, <span className="text-emerald-400 font-mono">&#123;LENDER_NAME&#125;</span>
            </div>
          </div>

          {/* Footer */}
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
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
