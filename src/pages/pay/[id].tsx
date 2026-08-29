import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  Clock, 
  Building, 
  CheckCircle2, 
  Share2, 
  Lock, 
  AlertCircle,
  HelpCircle,
  ArrowDown
} from 'lucide-react';
import { PaymentRequest } from '@/types';
import { formatNaira } from '@/lib/payment-rails';

export default function CustomerPaymentPage() {
  const router = useRouter();
  const { id } = router.query;

  const [payment, setPayment] = useState<PaymentRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);

  // Fetch and poll transaction state
  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const fetchPayment = async () => {
      try {
        const res = await fetch(`/api/transactions?id=${id}`);
        const data = await res.json();
        if (data.success && data.transaction) {
          setPayment(data.transaction);
        }
      } catch (err) {
        console.error('Error loading transaction:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayment();
    const pollInterval = setInterval(fetchPayment, 3000); // poll every 3s
    return () => clearInterval(pollInterval);
  }, [id]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const copyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center p-4 font-sans">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading secure checkout...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold">Payment Link Expired or Not Found</h2>
          <p className="text-xs text-slate-400">
            Please ask the vendor to generate a fresh payment link for you.
          </p>
        </div>
      </div>
    );
  }

  const isPaid = payment.status === 'SUCCESSFUL';
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6 font-['Plus_Jakarta_Sans',sans-serif]">
      <Head>
        <title>Pay {formatNaira(payment.amount)} to {payment.accountName} | AlertShield</title>
      </Head>

      {/* Top Header */}
      <div className="max-w-md w-full mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 mb-4">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>AlertShield 🇳🇬 Verified Checkout</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">{payment.accountName}</h1>
        <p className="text-xs text-slate-400 mt-0.5">{payment.description}</p>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-4">
        <div className="rounded-3xl border border-slate-800 bg-[#0d1628] shadow-2xl p-6 sm:p-7 relative overflow-hidden">
          
          {isPaid ? (
            /* Confirmed State */
            <div className="text-center space-y-5 py-4 animate-fadeIn">
              <div className="h-20 w-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-800">
                  PAYMENT SUCCESSFUL
                </span>
                <h2 className="text-3xl font-black text-white font-mono mt-3">
                  {formatNaira(payment.amount)}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Received from <span className="text-slate-200 font-bold">{payment.senderName || 'Your Account'}</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ref:</span>
                  <span className="text-slate-300">{payment.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank:</span>
                  <span className="text-slate-300">{payment.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="text-slate-300">{new Date(payment.paidAt || Date.now()).toLocaleTimeString()}</span>
                </div>
              </div>

              <p className="text-xs text-emerald-400 font-semibold">
                The vendor has been notified and goods can be released.
              </p>
            </div>
          ) : (
            /* Transfer Instructions */
            <div className="space-y-5">
              
              {/* Amount Box */}
              <div className="text-center bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Transfer Exact Amount
                </p>
                <p className="text-3xl sm:text-4xl font-black text-emerald-400 font-['JetBrains_Mono',monospace] mt-1">
                  {formatNaira(payment.amount)}
                </p>
              </div>

              {/* Instructions */}
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <ArrowDown className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Open your bank app (OPay, Kuda, GTB, Zenith, etc.) and transfer to:</span>
              </div>

              {/* Account Details Box */}
              <div className="rounded-2xl bg-slate-900 border-2 border-emerald-500/40 p-4 space-y-3 shadow-inner">
                
                {/* Account Number & Copy */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Account Number</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-2xl sm:text-3xl font-black text-white font-['JetBrains_Mono',monospace]">
                      {payment.virtualAccountNumber}
                    </span>
                    <button
                      onClick={() => copyAccount(payment.virtualAccountNumber)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 transition-all active:scale-95 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Bank Name</p>
                    <p className="text-sm font-bold text-slate-100 flex items-center gap-1 mt-0.5">
                      <Building className="h-3.5 w-3.5 text-emerald-400" />
                      {payment.bankName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Account Name</p>
                    <p className="text-xs font-bold text-slate-100 truncate mt-0.5" title={payment.accountName}>
                      {payment.accountName}
                    </p>
                  </div>
                </div>

              </div>

              {/* Listening radar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-300 font-medium">Auto-confirming transfer...</span>
                </div>
                <span className="font-mono text-slate-400 font-bold">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 max-w-md mx-auto space-y-1">
        <div className="flex items-center justify-center space-x-1">
          <Lock className="h-3 w-3 text-emerald-400" />
          <span>Secured by NIP Central Interbank Settlement Rail</span>
        </div>
        <p className="text-[10px] text-slate-600">
          Powered by AlertShield 🇳🇬 • Instant Transfer Protection
        </p>
      </footer>
    </div>
  );
}
