import React, { useState } from 'react';
import { 
  Lock, 
  Phone, 
  MessageSquare, 
  CreditCard, 
  Copy, 
  Check, 
  KeyRound, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { formatDate } from '../utils/formatters';

export default function SubscriptionLockout({ 
  license, 
  onOpenDeveloperModal,
  onReturnToAdmin,
  isImpersonating,
  onLogout 
}) {
  const [copied, setCopied] = useState(false);

  if (!license || !license.isLocked) return null;

  const handleCopyUpi = () => {
    if (license.developerUpi) {
      navigator.clipboard.writeText(license.developerUpi);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello ${license.developerName || 'Developer'}, I would like to renew the subscription for my Loan Management Software (${license.clientName || 'Financier'}). Please share payment details / confirmation.`
  );
  const whatsappUrl = `https://wa.me/${(license.developerPhone || '').replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white border border-rose-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in duration-200">
        
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto shadow-md shadow-rose-500/10">
          <Lock className="w-8 h-8" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Subscription Expired / Locked
          </h2>
          <p className="text-sm text-slate-600">
            {license.isSuspended
              ? 'Application access has been suspended by the administrator.'
              : `Access for ${license.clientName || 'this client'} expired on ${formatDate(license.validUntil)}.`}
          </p>
          <p className="text-xs text-rose-600 font-semibold">
            All lending operations, interest tracking, and automated SMS reminders are paused.
          </p>
        </div>

        {/* Developer Contact & Payment Card */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3.5">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Contact Software Developer to Renew
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-slate-500">Developer:</span>
              <span className="font-bold text-slate-900">{license.developerName || 'Software Provider'}</span>
            </div>

            <div className="flex items-center justify-between text-slate-700">
              <span className="text-slate-500">Mobile Phone:</span>
              <a href={`tel:${license.developerPhone}`} className="font-mono text-emerald-700 hover:underline">
                {license.developerPhone || '-'}
              </a>
            </div>

            {license.developerUpi && (
              <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-slate-200">
                <span className="text-slate-500">Payment UPI:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200">
                    {license.developerUpi}
                  </span>
                  <button
                    onClick={handleCopyUpi}
                    className="p-1 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Contact Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Renew</span>
            </a>

            <a
              href={`tel:${license.developerPhone}`}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer border border-slate-300"
            >
              <Phone className="w-4 h-4" />
              <span>Call Developer</span>
            </a>
          </div>
        </div>

        {/* Developer Master Controls & Navigation Actions */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          {/* If in developer support mode, show direct Return to Super-Admin button */}
          {isImpersonating && onReturnToAdmin && (
            <button
              onClick={onReturnToAdmin}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <span>👑 Return to Developer Super-Admin Hub</span>
            </button>
          )}

          <div className="flex items-center justify-between gap-3 text-xs">
            <button
              onClick={onOpenDeveloperModal}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-100"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>Master Unlock PIN</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="text-slate-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-rose-50"
              >
                <span>Log Out / Exit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
