import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Calculator from './components/Calculator';
import LoanList from './components/LoanList';
import BorrowerList from './components/BorrowerList';
import SmsHistory from './components/SmsHistory';
import NewLoanModal from './components/NewLoanModal';
import PaymentModal from './components/PaymentModal';
import LoanDetailModal from './components/LoanDetailModal';
import SettingsModal from './components/SettingsModal';
import SubscriptionLockout from './components/SubscriptionLockout';
import DeveloperModal from './components/DeveloperModal';
import SuperAdminView from './components/SuperAdminView';
import LoginScreen from './components/LoginScreen';

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  // Client Data States
  const [metrics, setMetrics] = useState(null);
  const [loans, setLoans] = useState([]);
  const [borrowers, setBorrowers] = useState([]);
  const [smsLogs, setSmsLogs] = useState([]);
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);
  const [newLoanBorrowerId, setNewLoanBorrowerId] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState(false);
  const [viewLoanId, setViewLoanId] = useState(null);
  const [paymentLoan, setPaymentLoan] = useState(null);

  // Notification Banner
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Keyboard shortcut Ctrl+Shift+D to open Developer Portal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setIsDeveloperModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoginSuccess = (loginData) => {
    setSession(loginData);
    localStorage.setItem('ia_session', JSON.stringify(loginData));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('ia_session');
  };

  const handleLoginAsClient = (client) => {
    const clientSession = {
      role: 'CLIENT',
      clientId: client.id,
      client: {
        id: client.id,
        businessName: client.business_name,
        ownerName: client.owner_name,
        phone: client.phone
      },
      isImpersonating: true,
      originalMasterPin: session?.masterPin,
      token: session?.token
    };
    setSession(clientSession);
    localStorage.setItem('ia_session', JSON.stringify(clientSession));
  };

  const handleReturnToAdmin = () => {
    const adminSession = {
      role: 'SUPER_ADMIN',
      masterPin: session?.originalMasterPin,
      token: session?.token
    };
    setSession(adminSession);
    localStorage.setItem('ia_session', JSON.stringify(adminSession));
  };

  useEffect(() => {
    if (session?.role === 'CLIENT') {
      fetchAllData();
    }
  }, [session]);

  const clientHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
      'x-client-id': session?.clientId || 1
    };
    if (session?.token) {
      headers['authorization'] = `Bearer ${session.token}`;
    }
    return headers;
  };

  const fetchLicense = async () => {
    if (!session?.clientId) return null;
    try {
      const res = await fetch('/api/client/license-status', {
        headers: { 'x-client-id': session.clientId }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setLicense(data.data);
        return data.data;
      }
    } catch (e) {
      console.error('Error fetching license:', e);
    }
    return null;
  };

  const fetchAllData = async () => {
    if (!session?.clientId) return;
    setLoading(true);
    try {
      const lic = await fetchLicense();
      if (!lic?.isLocked) {
        await Promise.all([
          fetchMetrics(),
          fetchLoans(),
          fetchBorrowers(),
          fetchSmsLogs()
        ]);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/dashboard/metrics', { headers: clientHeaders() });
      const data = await res.json();
      if (data.success) setMetrics(data.data);
      else if (data.error === 'SUBSCRIPTION_LOCKED') fetchLicense();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLoans = async () => {
    try {
      const res = await fetch('/api/loans', { headers: clientHeaders() });
      const data = await res.json();
      if (data.success) setLoans(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBorrowers = async () => {
    try {
      const res = await fetch('/api/borrowers', { headers: clientHeaders() });
      const data = await res.json();
      if (data.success) setBorrowers(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSmsLogs = async () => {
    try {
      const res = await fetch('/api/sms/logs', { headers: clientHeaders() });
      const data = await res.json();
      if (data.success) setSmsLogs(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenNewLoan = (preselectedBorrowerId = null) => {
    setNewLoanBorrowerId(preselectedBorrowerId);
    setIsNewLoanOpen(true);
  };

  const handleOpenPayment = (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    if (loan) {
      setPaymentLoan(loan);
    } else {
      fetch(`/api/loans/${loanId}`, { headers: clientHeaders() })
        .then(r => r.json())
        .then(d => {
          if (d.success) setPaymentLoan(d.data);
        });
    }
  };

  const handleSendManualSms = async (loanId) => {
    try {
      const res = await fetch('/api/sms/send-manual', {
        method: 'POST',
        headers: clientHeaders(),
        body: JSON.stringify({ loan_id: loanId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`SMS sent to borrower! (Status: ${data.data.status})`);
        fetchSmsLogs();
      } else {
        showToast(`Failed: ${data.message || 'Error'}`, 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleOpenWhatsApp = async (loanId) => {
    try {
      const res = await fetch(`/api/sms/whatsapp-link/${loanId}`, { headers: clientHeaders() });
      const data = await res.json();
      if (data.success && data.data.whatsappUrl) {
        window.open(data.data.whatsappUrl, '_blank');
      } else {
        showToast('Could not generate WhatsApp link', 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  // 1. If not logged in, show Universal Login Screen
  if (!session) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. If logged in as Super-Admin, show Master Super-Admin Hub
  if (session.role === 'SUPER_ADMIN') {
    return (
      <SuperAdminView
        masterPin={session.masterPin}
        onLogout={handleLogout}
        onLoginAsClient={handleLoginAsClient}
        onUpdateMasterPin={(newPin) => {
          setSession(prev => {
            const updated = { ...prev, masterPin: newPin };
            localStorage.setItem('ia_session', JSON.stringify(updated));
            return updated;
          });
        }}
      />
    );
  }

  // 3. Client Lending Workspace
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-2 ${
            toast.type === 'error'
              ? 'bg-rose-950 border-rose-500/50 text-rose-300'
              : 'bg-emerald-950 border-emerald-500/50 text-emerald-300'
          }`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Developer Impersonation Top Banner (if developer logged in as client) */}
      {session.isImpersonating && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span>👑 Developer Support Mode:</span>
            <span>Viewing as {session.client?.businessName} (Client #{session.clientId})</span>
          </div>
          <button
            onClick={handleReturnToAdmin}
            className="px-2.5 py-0.5 rounded-md bg-slate-950 text-amber-400 font-bold hover:bg-slate-900 transition-colors cursor-pointer"
          >
            ← Return to Super-Admin Hub
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewLoan={() => handleOpenNewLoan(null)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        license={license}
        onOpenDeveloperModal={() => setIsDeveloperModalOpen(true)}
        onLogout={handleLogout}
        clientInfo={session.client}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            metrics={metrics}
            loading={loading}
            onRefresh={fetchAllData}
            onOpenNewLoan={() => handleOpenNewLoan(null)}
            onSelectLoan={(id) => setViewLoanId(id)}
            onOpenPayment={handleOpenPayment}
            onSendManualSms={handleSendManualSms}
            onOpenWhatsApp={handleOpenWhatsApp}
          />
        )}

        {activeTab === 'calculator' && (
          <Calculator />
        )}

        {activeTab === 'loans' && (
          <LoanList
            loans={loans}
            onSelectLoan={(id) => setViewLoanId(id)}
            onOpenPayment={handleOpenPayment}
            onOpenNewLoan={() => handleOpenNewLoan(null)}
            onSendManualSms={handleSendManualSms}
            onOpenWhatsApp={handleOpenWhatsApp}
          />
        )}

        {activeTab === 'borrowers' && (
          <BorrowerList
            borrowers={borrowers}
            onSelectBorrower={(id) => {}}
            onOpenNewLoanForBorrower={(bId) => handleOpenNewLoan(bId)}
            onOpenNewLoan={() => handleOpenNewLoan(null)}
          />
        )}

        {activeTab === 'sms' && (
          <SmsHistory
            logs={smsLogs}
            onRefresh={fetchSmsLogs}
            onRunCheck={fetchSmsLogs}
          />
        )}
      </main>

      {/* Modals */}
      <NewLoanModal
        isOpen={isNewLoanOpen}
        onClose={() => setIsNewLoanOpen(false)}
        existingBorrowers={borrowers}
        onSuccess={() => {
          showToast('Loan disbursed and borrower KYC recorded!');
          fetchAllData();
        }}
      />

      <PaymentModal
        isOpen={Boolean(paymentLoan)}
        loan={paymentLoan}
        onClose={() => setPaymentLoan(null)}
        onSuccess={() => {
          showToast('Payment recorded and ledger balance updated!');
          fetchAllData();
          if (viewLoanId) {
            setViewLoanId(viewLoanId);
          }
        }}
      />

      <LoanDetailModal
        isOpen={Boolean(viewLoanId)}
        loanId={viewLoanId}
        onClose={() => setViewLoanId(null)}
        onOpenPayment={handleOpenPayment}
        onSendManualSms={handleSendManualSms}
        onOpenWhatsApp={handleOpenWhatsApp}
        onRefreshParent={fetchAllData}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsUpdated={() => {
          showToast('Lender settings updated!');
          fetchAllData();
        }}
      />

      {/* Developer Master License Modal */}
      <DeveloperModal
        isOpen={isDeveloperModalOpen}
        onClose={() => setIsDeveloperModalOpen(false)}
        onLicenseUpdated={() => {
          showToast('Subscription license updated!');
          fetchAllData();
        }}
      />

      {/* Client Lockout Paywall (Shown if client subscription is expired) */}
      <SubscriptionLockout
        license={license}
        isImpersonating={session?.isImpersonating}
        onReturnToAdmin={handleReturnToAdmin}
        onLogout={handleLogout}
        onOpenDeveloperModal={() => setIsDeveloperModalOpen(true)}
      />
    </div>
  );
}
