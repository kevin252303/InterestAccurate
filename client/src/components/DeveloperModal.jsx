import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  KeyRound, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Lock, 
  Unlock, 
  Sparkles, 
  Save, 
  UserCheck
} from 'lucide-react';
import { formatDate } from '../utils/formatters';

export default function DeveloperModal({ isOpen, onClose, onLicenseUpdated }) {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [licenseData, setLicenseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Editable config state
  const [configForm, setConfigForm] = useState({
    clientName: '',
    planType: 'MONTHLY',
    gracePeriodDays: 3,
    developerName: '',
    developerPhone: '',
    developerUpi: '',
    newPin: ''
  });

  useEffect(() => {
    if (isOpen) {
      setError('');
      setMsg('');
      if (isAuthenticated) {
        fetchStatus();
      }
    } else {
      // Don't reset authentication immediately on brief close unless desired
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/license/status');
      const data = await res.json();
      if (data.success && data.data) {
        setLicenseData(data.data);
        setConfigForm({
          clientName: data.data.clientName || '',
          planType: data.data.planType || 'MONTHLY',
          gracePeriodDays: data.data.gracePeriodDays ?? 3,
          developerName: data.data.developerName || '',
          developerPhone: data.data.developerPhone || '',
          developerUpi: data.data.developerUpi || '',
          newPin: ''
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/license/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        fetchStatus();
      } else {
        setError(data.message || 'Incorrect Developer PIN');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (days, plan = null) => {
    setActionLoading(true);
    setError('');
    setMsg('');
    try {
      const res = await fetch('/api/license/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, extensionDays: days, planType: plan })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(data.message);
        setLicenseData(data.data);
        onLicenseUpdated && onLicenseUpdated(data.data);
      } else {
        setError(data.message || 'Renewal failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!window.confirm('Are you sure you want to SUSPEND access immediately? The client will be locked out until reactivated.')) return;
    setActionLoading(true);
    setError('');
    setMsg('');
    try {
      const res = await fetch('/api/license/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(data.message);
        setLicenseData(data.data);
        onLicenseUpdated && onLicenseUpdated(data.data);
      } else {
        setError(data.message || 'Suspend failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    setActionLoading(true);
    setError('');
    setMsg('');
    try {
      const res = await fetch('/api/license/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(data.message);
        setLicenseData(data.data);
        onLicenseUpdated && onLicenseUpdated(data.data);
      } else {
        setError(data.message || 'Reactivate failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setMsg('');
    try {
      const res = await fetch('/api/license/update-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, ...configForm })
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Developer config saved successfully!');
        if (configForm.newPin) {
          setPin(configForm.newPin); // Update active PIN in session
        }
        setLicenseData(data.data);
        onLicenseUpdated && onLicenseUpdated(data.data);
      } else {
        setError(data.message || 'Update failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Developer Master Access & License Portal</h3>
              <p className="text-xs text-slate-400">Control client subscription, validity, and lock/unlock triggers.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}
          {msg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              {msg}
            </div>
          )}

          {!isAuthenticated ? (
            /* Master PIN Login Form */
            <form onSubmit={handleLogin} className="max-w-sm mx-auto py-8 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Enter Developer Master PIN</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Default PIN is <code className="text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded">dev@1234</code>
                </p>
              </div>

              <div>
                <input
                  type="password"
                  required
                  placeholder="Master PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-white text-base tracking-widest font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Unlock Developer Portal'}
              </button>
            </form>
          ) : (
            /* Authenticated Developer Admin Panel */
            <div className="space-y-6">
              {/* Subscription Status Card */}
              {licenseData && (
                <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Client Name</div>
                      <div className="text-base font-bold text-white">{licenseData.clientName}</div>
                    </div>

                    <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                      licenseData.isSuspended ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                      licenseData.isExpired ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                      licenseData.isGracePeriod ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {licenseData.isSuspended ? 'SUSPENDED' :
                       licenseData.isExpired ? 'EXPIRED (LOCKED)' :
                       licenseData.isGracePeriod ? `GRACE PERIOD (${licenseData.daysRemaining}d)` :
                       `ACTIVE (${licenseData.daysRemaining} Days Left)`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div>
                      <span className="text-slate-400">Valid Until:</span>
                      <div className="text-white font-bold">{formatDate(licenseData.validUntil)}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Subscription Plan:</span>
                      <div className="text-amber-400 font-bold">{licenseData.planType}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Grace Period:</span>
                      <div className="text-slate-200 font-bold">{licenseData.gracePeriodDays} Days</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 1-Click Subscription Renewal Actions */}
              <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Quick License Renewal & Access Controls
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => handleRenew(30, 'MONTHLY')}
                    disabled={actionLoading}
                    className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30 transition-all cursor-pointer text-center"
                  >
                    + 30 Days (Monthly)
                  </button>

                  <button
                    onClick={() => handleRenew(90, 'QUARTERLY')}
                    disabled={actionLoading}
                    className="py-2.5 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-bold text-xs border border-teal-500/30 transition-all cursor-pointer text-center"
                  >
                    + 90 Days (3 Months)
                  </button>

                  <button
                    onClick={() => handleRenew(365, 'YEARLY')}
                    disabled={actionLoading}
                    className="py-2.5 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold text-xs border border-indigo-500/30 transition-all cursor-pointer text-center"
                  >
                    + 365 Days (1 Year)
                  </button>
                </div>

                {/* Suspend or Reactivate */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                  {licenseData?.isSuspended ? (
                    <button
                      onClick={handleReactivate}
                      disabled={actionLoading}
                      className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Reactivate Access
                    </button>
                  ) : (
                    <button
                      onClick={handleSuspend}
                      disabled={actionLoading}
                      className="flex-1 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30 transition-colors cursor-pointer"
                    >
                      Emergency Lock / Suspend Client Now
                    </button>
                  )}
                </div>
              </div>

              {/* Developer Info & Client Configuration Form */}
              <form onSubmit={handleSaveConfig} className="p-5 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  Client & Developer Payment Profile
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Client Business Name</label>
                    <input
                      type="text"
                      value={configForm.clientName}
                      onChange={(e) => setConfigForm({ ...configForm, clientName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Subscription Plan</label>
                    <select
                      value={configForm.planType}
                      onChange={(e) => setConfigForm({ ...configForm, planType: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="MONTHLY">Monthly Subscription</option>
                      <option value="YEARLY">Yearly Subscription</option>
                      <option value="LIFETIME">Lifetime License</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Developer Contact Name</label>
                    <input
                      type="text"
                      value={configForm.developerName}
                      onChange={(e) => setConfigForm({ ...configForm, developerName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Developer Phone (For Renewal Calls/WhatsApp)</label>
                    <input
                      type="tel"
                      value={configForm.developerPhone}
                      onChange={(e) => setConfigForm({ ...configForm, developerPhone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Developer Renewal UPI ID</label>
                    <input
                      type="text"
                      placeholder="e.g. developer@upi"
                      value={configForm.developerUpi}
                      onChange={(e) => setConfigForm({ ...configForm, developerUpi: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Change Developer Master PIN</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current"
                      value={configForm.newPin}
                      onChange={(e) => setConfigForm({ ...configForm, newPin: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Configuration</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
