import React, { useState } from 'react';
import { 
  Landmark, 
  KeyRound, 
  Lock, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  User, 
  Sparkles,
  Building
} from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const [roleMode, setRoleMode] = useState('client'); // 'client' or 'superadmin'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [masterPin, setMasterPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClientLogin = async (e) => {
    e?.preventDefault();
    setError('');
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

  const handleQuickAdminDemo = () => {
    setMasterPin('dev@1234');
    setTimeout(() => {
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'dev@1234' })
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          onLoginSuccess(data);
        } else {
          setError(data.message || 'Quick login failed: Master PIN has been changed. Please enter your new PIN.');
        }
      })
      .catch(err => setError(err.message));
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 antialiased">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 mx-auto shadow-xl shadow-emerald-500/20">
            <Landmark className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">InterestAccurate</h1>
          <p className="text-xs text-slate-400">
            Multi-Tenant Loan Provider & Daily Interest Management Platform
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Role Toggle */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setRoleMode('client'); setError(''); }}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleMode === 'client'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Client (Financier)
            </button>
            <button
              type="button"
              onClick={() => { setRoleMode('superadmin'); setError(''); }}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleMode === 'superadmin'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Developer Admin
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {roleMode === 'client' ? (
            /* Client Login Form */
            <form onSubmit={handleClientLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                  Registered Mobile Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                  Client Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Logging in...' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Developer Super-Admin Form */
            <form onSubmit={handleSuperAdminLogin} className="space-y-4">
              <div className="text-center py-1">
                <div className="text-xs text-amber-400 font-semibold mb-1">
                  Master Multi-Client Management Portal
                </div>
                <p className="text-[11px] text-slate-400">
                  Control all clients, extend subscriptions, and track MRR.
                </p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                  Super-Admin Master PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Enter Master PIN"
                    value={masterPin}
                    onChange={(e) => setMasterPin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 font-mono tracking-widest"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Verifying...' : 'Access Super-Admin Hub'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="text-[11px] text-slate-500 text-center uppercase tracking-wider font-semibold">
              Quick One-Click Demo Access
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickClientDemo}
                className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 text-[11px] font-semibold rounded-lg border border-slate-800 text-center transition-colors cursor-pointer"
              >
                ⚡ Client Demo (Venkatesh)
              </button>
              <button
                type="button"
                onClick={handleQuickAdminDemo}
                className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-amber-400 text-[11px] font-semibold rounded-lg border border-slate-800 text-center transition-colors cursor-pointer"
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
