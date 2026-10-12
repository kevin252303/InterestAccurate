import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  KeyRound, 
  Lock, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  User, 
  Sparkles,
  Building,
  RefreshCw
} from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const [roleMode, setRoleMode] = useState('client'); // 'client' or 'superadmin'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [masterPin, setMasterPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Developer Super-Admin OTP State
  const [adminAuthType, setAdminAuthType] = useState('otp'); // 'otp' or 'pin'
  const [devPhone, setDevPhone] = useState('6353520761');
  const [devOtp, setDevOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleClientLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data);
      } else {
        setError(data.message || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuperAdminLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: masterPin })
      });
      const data = await res.json();
      if (data.success && data.role === 'SUPER_ADMIN') {
        onLoginSuccess({
          ...data,
          masterPin
        });
      } else {
        setError(data.message || 'Incorrect Developer Master PIN.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendDeveloperOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setInfoMessage('');
    if (!devPhone.trim()) {
      setError('Please enter your registered developer mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/developer/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: devPhone })
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setMaskedPhone(data.phone || devPhone);
        setInfoMessage(data.message);
        setSimulatedOtp(data.devOtp || '');
        if (data.devOtp) {
          setDevOtp(data.devOtp);
        }
        setOtpTimer(30);
      } else {
        setError(data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setError(err.message || 'Network error while sending OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDeveloperOtp = async (e) => {
    e?.preventDefault();
    setError('');
    if (!devOtp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/developer/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: devPhone, otp: devOtp })
      });
      const data = await res.json();
      if (data.success && data.role === 'SUPER_ADMIN') {
        onLoginSuccess(data);
      } else {
        setError(data.message || 'Invalid verification code.');
      }
    } catch (err) {
      setError(err.message || 'Network error while verifying OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickClientDemo = () => {
    setUsername('9876543210');
    setPassword('client123');
    setTimeout(() => {
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '9876543210', password: 'client123' })
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) onLoginSuccess(data);
      });
    }, 100);
  };

  const handleQuickAdminDemo = async () => {
    setRoleMode('superadmin');
    setAdminAuthType('otp');
    setDevPhone('6353520761');
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/developer/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '6353520761' })
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setMaskedPhone(data.phone || '6353520761');
        setInfoMessage(data.message);
        setSimulatedOtp(data.devOtp || '');
        if (data.devOtp) {
          setDevOtp(data.devOtp);
        }
        setOtpTimer(30);
      } else {
        setError(data.message || 'Failed to request OTP');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 antialiased">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-600/20">
            <Landmark className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">InterestAccurate</h1>
          <p className="text-xs text-slate-500">
            Multi-Tenant Loan Provider & Daily Interest Management Platform
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 space-y-6">
          {/* Role Toggle */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => { setRoleMode('client'); setError(''); }}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleMode === 'client'
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Client (Financier)
            </button>
            <button
              type="button"
              onClick={() => { setRoleMode('superadmin'); setError(''); }}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleMode === 'superadmin'
                  ? 'bg-white text-amber-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Developer Admin
            </button>
          </div>

          {infoMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold text-center">
              {infoMessage}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {roleMode === 'client' ? (
            /* Client Login Form */
            <form onSubmit={handleClientLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-600 uppercase tracking-wider font-semibold mb-1">
                  Registered Mobile Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 uppercase tracking-wider font-semibold mb-1">
                  Client Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Logging in...' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Developer Super-Admin Form (Mobile OTP & Master PIN) */
            <div className="space-y-4">
              <div className="text-center py-1">
                <div className="text-xs text-amber-700 font-semibold mb-1">
                  Master Multi-Client Management Portal
                </div>
                <p className="text-[11px] text-slate-500">
                  Control all clients, extend subscriptions, and track MRR.
                </p>
              </div>

              {/* Developer Auth Method Tabs: OTP vs PIN */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setAdminAuthType('otp'); setError(''); setInfoMessage(''); }}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    adminAuthType === 'otp'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Mobile OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAdminAuthType('pin'); setError(''); setInfoMessage(''); }}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    adminAuthType === 'pin'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Master PIN</span>
                </button>
              </div>

              {adminAuthType === 'otp' ? (
                /* Mobile OTP Flow */
                !otpSent ? (
                  /* Step 1: Request OTP */
                  <form onSubmit={handleSendDeveloperOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-600 uppercase tracking-wider font-semibold mb-1">
                        Registered Developer Mobile
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 6353520761"
                          value={devPhone}
                          onChange={(e) => setDevPhone(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        A 6-digit verification code will be sent to your phone.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>{loading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  /* Step 2: Enter & Verify OTP */
                  <form onSubmit={handleVerifyDeveloperOtp} className="space-y-4">
                    <div className="flex items-center justify-between text-xs px-1 text-slate-600">
                      <span>Sent to <strong>{maskedPhone || devPhone}</strong></span>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setDevOtp(''); setError(''); setInfoMessage(''); }}
                        className="text-amber-700 hover:underline font-semibold cursor-pointer"
                      >
                        Change
                      </button>
                    </div>

                    {simulatedOtp && (
                      <div 
                        onClick={() => setDevOtp(simulatedOtp)}
                        className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
                        title="Click to auto-fill OTP"
                      >
                        <span>✨ Console Demo OTP: <span className="font-mono tracking-widest">{simulatedOtp}</span></span>
                        <span className="text-[10px] uppercase tracking-wider bg-amber-200/60 px-1.5 py-0.5 rounded">Auto-fill</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs text-slate-600 uppercase tracking-wider font-semibold mb-1">
                        Enter 6-Digit OTP Code
                      </label>
                      <div className="relative">
                        <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="••••••"
                          value={devOtp}
                          onChange={(e) => setDevOtp(e.target.value.replace(/\D/g, ''))}
                          autoFocus
                          className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 text-base font-mono tracking-widest text-center focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>{loading ? 'Verifying...' : 'Verify OTP & Access Hub'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="text-center pt-1">
                      {otpTimer > 0 ? (
                        <span className="text-xs text-slate-400">
                          Resend code in <strong className="text-slate-600">{otpTimer}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendDeveloperOtp}
                          disabled={loading}
                          className="text-xs text-amber-700 hover:text-amber-800 font-semibold cursor-pointer inline-flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Resend Verification Code</span>
                        </button>
                      )}
                    </div>
                  </form>
                )
              ) : (
                /* Master PIN Flow */
                <form onSubmit={handleSuperAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-600 uppercase tracking-wider font-semibold mb-1">
                      Super-Admin Master PIN
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="Enter Master PIN"
                        value={masterPin}
                        onChange={(e) => setMasterPin(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono tracking-widest"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Verifying...' : 'Access Super-Admin Hub'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="text-[11px] text-slate-500 text-center uppercase tracking-wider font-semibold">
              Quick One-Click Demo Access
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickClientDemo}
                className="py-2 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-xl border border-slate-200 text-center transition-colors cursor-pointer"
              >
                ⚡ Client Demo (Venkatesh)
              </button>
              <button
                type="button"
                onClick={handleQuickAdminDemo}
                className="py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold rounded-xl border border-amber-200 text-center transition-colors cursor-pointer"
              >
                👑 Developer Super-Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
