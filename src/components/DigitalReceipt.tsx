import React, { useRef } from 'react';
import { X, Printer, Share2, ShieldCheck, Download, CheckCircle2, Building, Calendar, Hash } from 'lucide-react';
import { PaymentRequest, MerchantProfile } from '@/types';
import { formatNaira } from '@/lib/payment-rails';

interface DigitalReceiptProps {
  payment: PaymentRequest | null;
  merchant: MerchantProfile;
  onClose: () => void;
}

export const DigitalReceipt: React.FC<DigitalReceiptProps> = ({
  payment,
  merchant,
  onClose
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = `🧾 *OFFICIAL RECEIPT - ${merchant.businessName}*\n\n` +
      `✅ *Status:* PAYMENT VERIFIED\n` +
      `💰 *Amount:* ${formatNaira(payment.amount)}\n` +
      `👤 *Paid By:* ${payment.senderName || payment.customerName || 'Customer'}\n` +
      `🏦 *Via:* ${payment.senderBank || 'Direct Bank Transfer'}\n` +
      `📦 *Item:* ${payment.description}\n` +
      `🔖 *Ref:* ${payment.reference}\n` +
      `📅 *Date:* ${new Date(payment.paidAt || payment.createdAt).toLocaleString()}\n\n` +
      `🔒 _Verified securely via AlertShield 🇳🇬 (Zero Fake Alert Guarantee)_\n` +
      `👉 Get AlertShield for your store: https://alertshield.ng`;

    const encoded = encodeURIComponent(text);
    const phone = payment.customerPhone?.replace(/\D/g, '') || '';
    const url = phone ? `https://wa.me/234${phone.startsWith('0') ? phone.slice(1) : phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">Verified Payment Receipt</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6">
          <div 
            ref={receiptRef}
            className="bg-white text-slate-900 p-6 rounded-2xl shadow-inner relative font-['JetBrains_Mono',monospace]"
          >
            {/* Top Zig-Zag or Watermark */}
            <div className="text-center pb-4 border-b-2 border-dashed border-slate-300">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 mb-2">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-base font-black tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                {merchant.businessName}
              </h3>
              <p className="text-[11px] text-slate-500 font-['Plus_Jakarta_Sans',sans-serif]">
                Official Proof of Payment
              </p>
            </div>

            {/* Amount Banner */}
            <div className="my-4 text-center bg-slate-100 py-3 rounded-xl border border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Amount Paid</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
                {formatNaira(payment.amount)}
              </p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase">
                VERIFIED &amp; SETTLED
              </span>
            </div>

            {/* Receipt Key-Values */}
            <div className="space-y-2 text-xs py-2 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Payer Name:</span>
                <span className="font-bold text-slate-900 text-right truncate max-w-[190px]">
                  {payment.senderName || payment.customerName || 'Customer'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payer Bank:</span>
                <span className="font-semibold text-slate-800">
                  {payment.senderBank || 'NIP Bank Transfer'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Item Description:</span>
                <span className="font-medium text-slate-800 text-right truncate max-w-[180px]">
                  {payment.description}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Virtual Account:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {payment.virtualAccountNumber} ({payment.bankName})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date &amp; Time:</span>
                <span className="text-slate-700">
                  {new Date(payment.paidAt || payment.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono text-[10px] text-slate-600">
                  {payment.reference}
                </span>
              </div>
            </div>

            {/* Viral Footer Watermark */}
            <div className="pt-3 text-center">
              <div className="flex items-center justify-center space-x-1 text-[10px] font-bold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verified in 1.5s by AlertShield 🇳🇬</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">
                Zero fake alerts • www.alertshield.ng
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              onClick={handleWhatsAppShare}
              className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>Share on WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
