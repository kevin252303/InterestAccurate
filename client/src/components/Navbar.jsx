import React from 'react';
import { 
  LayoutDashboard, 
  Calculator as CalcIcon, 
  Users, 
  ReceiptIndianRupee, 
  MessageSquare, 
  Settings, 
  PlusCircle,
  Landmark,
  KeyRound,
  LogOut
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenNewLoan, 
  onOpenSettings,
  license,
  onOpenDeveloperModal,
  onLogout,
  clientInfo
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calculator', label: 'Interest Calculator', icon: CalcIcon },
    { id: 'loans', label: 'All Loans', icon: ReceiptIndianRupee },
    { id: 'borrowers', label: 'Borrowers', icon: Users },
    { id: 'sms', label: 'SMS & Reminders', icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  {clientInfo?.businessName || 'InterestAccurate'}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Lender OS
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {clientInfo?.ownerName ? `Financier: ${clientInfo.ownerName}` : 'Private Lending & Interest Management'}
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons & License Info */}
          <div className="flex items-center gap-2.5">
            {license && !license.isLocked && license.daysRemaining <= 7 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Subscription: {license.daysRemaining <= 0 ? 'Grace Period' : `${license.daysRemaining}d left`}
              </span>
            )}

            <button
              onClick={onOpenNewLoan}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Give Loan</span>
            </button>

            <button
              onClick={onOpenSettings}
              title="Settings"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Developer Key Access */}
            <button
              onClick={onOpenDeveloperModal}
              title="Developer License Admin (Shortcut: Ctrl+Shift+D)"
              className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Logout from Workspace"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-200 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
