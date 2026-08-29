import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Clock, 
  ShieldCheck, 
  Share2, 
  Smartphone, 
  ExternalLink, 
  CheckCircle2, 
  FileText,
  AlertTriangle,
  Building,
  CreditCard
} from 'lucide-react';
import { PaymentRequest } from '@/types';
import { formatNaira } from '@/lib/payment-rails';
import { soundEngine } from '@/lib/audio';

interface PaymentModalProps {
  payment: PaymentRequest | null;
  onClose: () => void;
  onViewReceipt: (payment: PaymentRequest) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  payment,
  onClose,
  onViewReceipt
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // 30 minutes in seconds

  useEffect(() => {
    if (!payment) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [payment]);

  if (!payment) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyWhatsAppFormat = () => {
    const message = `*PAYMENT INVOICE - ${payment.accountName}*\n\n` +
      `💰 *Amount to Pay:* ${formatNaira(payment.amount)}\n` +
      `🏦 *Bank:* ${payment.bankName}\n` +
      `🔢 *Account Number:* ${payment.virtualAccountNumber}\n` +
      `👤 *Account Name:* ${payment.accountName}\n\n` +
      `⚠️ *Note:* This is a dedicated 1-time account. Please transfer the exact amount for instant confirmation.\n` +
      `🔗 *Live Status:* ${window.location.origin}/pay/${payment.id}`;
    
    copyToClipboard(message, 'whatsapp');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isPaid = payment.status === 'SUCCESSFUL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0e172a] border border-slate-700/80 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-base font-bold text-white">
              {isPaid ? 'Payment Confirmed' : 'Awaiting Bank Transfer'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {isPaid ? (
            /* Success State */
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto h-20 w-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              </div>

              <div>
                <h4 className="text-2xl font-black text-white">PAYMENT CONFIRMED!</h4>
                <p className="text-sm text-emerald-400 font-semibold mt-1">
                  Settled instantly via NIP Interbank Rail
                </p>
              </div>

              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 text-left space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Amount Received:</span>
                  <span className="font-bold text-white text-sm font-mono">{formatNaira(payment.amount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Sender Name:</span>
                  <span className="font-semibold text-slate-200">{payment.senderName || 'CHISOM EMMANUEL EZE'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Sender Bank:</span>
                  <span className="font-semibold text-slate-200">{payment.senderBank || 'OPay / GTBank'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Reference:</span>
                  <span className="font-mono text-slate-400">{payment.reference}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => onViewReceipt(payment)}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <FileText className="h-4 w-4" />
                  <span>View Branded Receipt</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Pending Transfer State */
            <>
              {/* Amount Display */}
              <div className="text-center bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exact Amount to Transfer</p>
                <p className="text-3xl sm:text-4xl font-black text-emerald-400 font-['JetBrains_Mono',monospace] mt-1">
                  {formatNaira(payment.amount)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">For: {payment.description}</p>
              </div>

              {/* Bank Account Details Box */}
              <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-4 border-2 border-emerald-500/50 shadow-lg space-y-3.5">
                
                {/* Account Number Row */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase">Bank Account Number</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-800">
                      Dedicated Dynamic Account
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-2xl sm:text-3xl font-black text-white font-['JetBrains_Mono',monospace] tracking-wider">
                      {payment.virtualAccountNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(payment.virtualAccountNumber, 'account')}
                      className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all active:scale-95"
                      title="Copy Account Number"
                    >
                      {copiedField === 'account' ? (
                        <Check className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Bank Name & Account Name */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <p className="text-[11px] text-slate-400 font-medium">Bank Name</p>
                    <p className="text-sm font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
                      <Building className="h-3.5 w-3.5 text-emerald-400" />
                      {payment.bankName}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <p className="text-[11px] text-slate-400 font-medium">Account Name</p>
                    <p className="text-xs font-bold text-slate-100 truncate mt-0.5" title={payment.accountName}>
                      {payment.accountName}
                    </p>
                  </div>
                </div>

              </div>

              {/* Status Radar & Countdown */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-slate-300 font-medium">Listening for bank transfer...</span>
                </div>
                <div className="flex items-center space-x-1 font-mono text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={copyWhatsAppFormat}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
                >
                  {copiedField === 'whatsapp' ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Copied WhatsApp Invoice Format!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      <span>Copy Formatted WhatsApp Invoice to Send Customer</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
