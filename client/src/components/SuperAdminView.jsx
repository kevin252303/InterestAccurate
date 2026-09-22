import React, { useState, useEffect } from 'react';
import { 
  Users, 
  PlusCircle, 
  TrendingUp, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  KeyRound, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Search, 
  Phone, 
  LogOut, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  CreditCard,
  Building,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function SuperAdminView({ masterPin, onLogout, onLoginAsClient }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Modals
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // Add Client Form State
  const [newClient, setNewClient] = useState({
    business_name: '',
    owner_name: '',
    phone: '',
    password: '',
    plan_type: 'MONTHLY',
    subscription_fee: 1500,
    valid_days: 30,
    notes: ''
  });

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    developer_name: '',
    developer_phone: '',
    developer_upi: '',
    current_master_pin: '',
    new_master_pin: '',
    confirm_master_pin: ''
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/dashboard', {
        headers: { 'x-master-pin': masterPin }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setProfileForm({
          developer_name: json.data.developerProfile.name || '',
          developer_phone: json.data.developerProfile.phone || '',
          developer_upi: json.data.developerProfile.upi || '',
          current_master_pin: '',
          new_master_pin: '',
          confirm_master_pin: ''
        });
      } else {
        showToast(json.message || 'Failed to load dashboard', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRenewClient = async (clientId, days) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/super-admin/clients/${clientId}/renew`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-master-pin': masterPin
        },
        body: JSON.stringify({ days })
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        fetchDashboard();
      } else {
        showToast(json.message || 'Renewal failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendClient = async (clientId) => {
    if (!window.confirm('Suspend access for this client immediately? They will be locked out until reactivated.')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/super-admin/clients/${clientId}/suspend`, {
        method: 'PUT',
        headers: { 'x-master-pin': masterPin }
      });
      const json = await res.json();
      if (json.success) {
        showToast('Client access suspended');
        fetchDashboard();
      } else {
        showToast(json.message || 'Suspend failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateClient = async (clientId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/super-admin/clients/${clientId}/reactivate`, {
        method: 'PUT',
        headers: { 'x-master-pin': masterPin }
      });
      const json = await res.json();
      if (json.success) {
        showToast('Client access reactivated');
        fetchDashboard();
      } else {
        showToast(json.message || 'Reactivation failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to permanently delete this client and all their loans and borrower records? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/super-admin/clients/${clientId}`, {
        method: 'DELETE',
        headers: { 'x-master-pin': masterPin }
      });
      const json = await res.json();
      if (json.success) {
        showToast('Client deleted successfully');
        fetchDashboard();
      } else {
        showToast(json.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/super-admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-master-pin': masterPin
        },
        body: JSON.stringify(newClient)
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        setIsAddClientOpen(false);
        setNewClient({
          business_name: '',
          owner_name: '',
          phone: '',
          password: '',
          plan_type: 'MONTHLY',
          subscription_fee: 1500,
          valid_days: 30,
          notes: ''
        });
        fetchDashboard();
      } else {
        showToast(json.message || 'Creation failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (profileForm.new_master_pin) {
      if (!profileForm.current_master_pin) {
        showToast('Current Master PIN is required to set a new PIN', 'error');
        return;
      }
      if (profileForm.new_master_pin.length < 4) {
        showToast('New Master PIN must be at least 4 characters long', 'error');
        return;
      }
      if (profileForm.new_master_pin !== profileForm.confirm_master_pin) {
        showToast('New Master PIN and confirmation do not match', 'error');
        return;
      }
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/super-admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-master-pin': masterPin
        },
        body: JSON.stringify(profileForm)
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        setIsEditProfileOpen(false);
        fetchDashboard();
      } else {
        showToast(json.message || 'Profile update failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const clientsList = data?.clients || [];
  const filteredClients = clientsList.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.business_name?.toLowerCase().includes(q) ||
      c.owner_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col antialiased">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-rose-950 border-rose-500/50 text-rose-300' : 'bg-emerald-950 border-emerald-500/50 text-emerald-300'
          }`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-white">Developer Super-Admin Hub</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Master Mode
                  </span>
                </div>
                <p className="text-xs text-slate-400">Multi-Client Subscription & Monetization Control</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                Developer Profile & UPI
              </button>

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/20 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Active Clients</div>
            <div className="text-3xl font-black text-white">{data?.metrics?.activeClients ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">out of {data?.metrics?.totalClients ?? 0} registered</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/50 border border-emerald-500/30">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Monthly Recurring Revenue (MRR)</div>
            <div className="text-3xl font-black text-emerald-400">{formatCurrency(data?.metrics?.totalMRR ?? 0)}</div>
            <div className="text-xs text-slate-500 mt-1">Expected monthly subscription fees</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/50 border border-amber-500/30">
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Expiring Soon (≤ 7 Days)</div>
            <div className="text-3xl font-black text-amber-400">{data?.metrics?.expiringSoon ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Clients due for renewal follow-up</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/50 border border-rose-500/30">
            <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">Expired / Locked Clients</div>
            <div className="text-3xl font-black text-rose-400">{data?.metrics?.expiredOrSuspended ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Currently locked out (unpaid)</div>
          </div>
        </div>

        {/* Client Directory & Action Bar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/40 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search clients by name, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={fetchDashboard}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Refresh List"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsAddClientOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add New Client</span>
            </button>
          </div>

          {/* Clients Master Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-800/30">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Client / Firm</th>
                  <th className="p-4">Owner & Phone</th>
                  <th className="p-4">Plan & Fee</th>
                  <th className="p-4">Expiry & Status</th>
                  <th className="p-4 text-right">Active Loans</th>
                  <th className="p-4 text-center">Subscription Controls</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                {filteredClients.map((client) => {
                  const lic = client.license || {};
                  return (
                    <tr key={client.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          <span>{client.business_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">#{client.id}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          Pass: <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded">{client.password}</code>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="text-white font-medium">{client.owner_name}</div>
                        <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>{client.phone}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-emerald-400">{formatCurrency(client.subscription_fee)}</div>
                        <div className="text-slate-400 text-[10px] uppercase tracking-wider">{client.plan_type}</div>
                      </td>

                      <td className="p-4">
                        <div className="font-medium text-white">{formatDate(client.valid_until)}</div>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            lic.isSuspended ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            lic.isExpired ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            lic.isGracePeriod ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {lic.isSuspended ? 'SUSPENDED' :
                             lic.isExpired ? 'EXPIRED' :
                             lic.isGracePeriod ? `GRACE (${lic.daysRemaining}d)` :
                             `${lic.daysRemaining}d Left`}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="font-bold text-white text-sm">{client.activeLoansCount || 0} Loans</div>
                        <div className="text-slate-400 text-[11px]">{formatCurrency(client.totalCapitalDeployed || 0)}</div>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleRenewClient(client.id, 30)}
                            title="Renew +30 Days"
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer"
                          >
                            +30d
                          </button>

                          <button
                            onClick={() => handleRenewClient(client.id, 365)}
                            title="Renew +365 Days (1 Year)"
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-colors cursor-pointer"
                          >
                            +1yr
                          </button>

                          {lic.isSuspended ? (
                            <button
                              onClick={() => handleReactivateClient(client.id)}
                              title="Reactivate Access"
                              className="p-1 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspendClient(client.id)}
                              title="Suspend / Lock Client"
                              className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-pointer"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onLoginAsClient(client)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold text-xs transition-colors cursor-pointer"
                            title="Open Client's Lending Dashboard"
                          >
                            <span>Open App</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          {client.id !== 1 && (
                            <button
                              onClick={() => handleDeleteClient(client.id)}
                              title="Delete Client"
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Client Modal */}
      {isAddClientOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-400" />
                Onboard New Client (Financier)
              </h3>
              <button onClick={() => setIsAddClientOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Business / Firm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sharma Capital & Credit"
                  value={newClient.business_name}
                  onChange={(e) => setNewClient({ ...newClient, business_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ashok Sharma"
                    value={newClient.owner_name}
                    onChange={(e) => setNewClient({ ...newClient, owner_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Login Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9845012345"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Client Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sharma@123"
                    value={newClient.password}
                    onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Subscription Plan</label>
                  <select
                    value={newClient.plan_type}
                    onChange={(e) => setNewClient({ ...newClient, plan_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="TRIAL">Trial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Subscription Fee (₹)</label>
                  <input
                    type="number"
                    value={newClient.subscription_fee}
                    onChange={(e) => setNewClient({ ...newClient, subscription_fee: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Initial Validity (Days)</label>
                  <input
                    type="number"
                    value={newClient.valid_days}
                    onChange={(e) => setNewClient({ ...newClient, valid_days: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddClientOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {actionLoading ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95">
              <h3 className="font-bold text-white text-base">Developer Profile & UPI Settings</h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Developer Contact Name</label>
                <input
                  type="text"
                  value={profileForm.developer_name}
                  onChange={(e) => setProfileForm({ ...profileForm, developer_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Developer Mobile Phone (Receives Calls & WhatsApp)</label>
                <input
                  type="tel"
                  value={profileForm.developer_phone}
                  onChange={(e) => setProfileForm({ ...profileForm, developer_phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Developer Payment UPI ID (Shown on client lockout screen)</label>
                <input
                  type="text"
                  value={profileForm.developer_upi}
                  onChange={(e) => setProfileForm({ ...profileForm, developer_upi: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Change Super-Admin Master PIN</span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Current Master PIN</label>
                  <input
                    type="password"
                    placeholder="Enter current PIN to confirm"
                    value={profileForm.current_master_pin || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, current_master_pin: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 mb-1">New Master PIN</label>
                    <input
                      type="password"
                      placeholder="Min 4 chars"
                      value={profileForm.new_master_pin || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, new_master_pin: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Confirm New PIN</label>
                    <input
                      type="password"
                      placeholder="Re-enter new PIN"
                      value={profileForm.confirm_master_pin || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, confirm_master_pin: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
