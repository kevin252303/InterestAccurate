import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  MapPin, 
  Shield, 
  ReceiptIndianRupee, 
  PlusCircle, 
  ExternalLink,
  UserCheck
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function BorrowerList({ 
  borrowers = [], 
  onSelectBorrower, 
  onOpenNewLoanForBorrower,
  onOpenNewLoan
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = borrowers.filter((b) => {
    const q = searchTerm.toLowerCase();
    return (
      b.name?.toLowerCase().includes(q) ||
      b.alias?.toLowerCase().includes(q) ||
      b.phone?.includes(q) ||
      b.id_number?.toLowerCase().includes(q) ||
      b.guarantor_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/40 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Borrower Directory ({borrowers.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete records of borrower profiles, KYC proofs, and contact details.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={onOpenNewLoan}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Borrower / Loan</span>
          </button>
        </div>
      </div>

      {/* Grid of Borrower Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/20 rounded-2xl border border-slate-800">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">No borrowers found</p>
          <p className="text-xs text-slate-500 mt-1">Try a different search query or add a new borrower.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b) => (
            <div
              key={b.id}
              className="p-5 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all space-y-4 flex flex-col justify-between"
            >
              <div>
                {/* Borrower Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 font-black text-lg">
                      {b.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight flex items-center gap-1.5">
                        <span>{b.name}</span>
                        {b.alias && (
                          <span className="text-xs font-normal text-slate-400">({b.alias})</span>
                        )}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-mono">{b.phone}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    b.active_loans_count > 0
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {b.active_loans_count} Active
                  </span>
                </div>

                {/* KYC and Address info */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                  {b.id_number && (
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{b.id_type}: <span className="text-slate-200 font-mono">{b.id_number}</span></span>
                    </div>
                  )}

                  {b.residential_address && (
                    <div className="flex items-start gap-2 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="text-slate-300 truncate">{b.residential_address}</span>
                    </div>
                  )}

                  {b.guarantor_name && (
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>Guarantor: <span className="text-slate-200">{b.guarantor_name}</span> {b.guarantor_phone ? `(${b.guarantor_phone})` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Outstanding & Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Active Balance</div>
                  <div className="text-base font-black text-white">
                    {formatCurrency(b.total_principal_outstanding || 0)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenNewLoanForBorrower(b.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 cursor-pointer"
                  >
                    + Loan
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
