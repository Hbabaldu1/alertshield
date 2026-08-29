import React, { useState } from 'react';
import { X, Check, Sparkles, ShieldCheck, Zap, ArrowRight, HelpCircle } from 'lucide-react';
import { MerchantProfile } from '@/types';

interface PricingModalProps {
  currentPlan: 'PAY_AS_YOU_GO' | 'PRO';
  onSelectPlan: (plan: 'PAY_AS_YOU_GO' | 'PRO') => void;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  currentPlan,
  onSelectPlan,
  onClose
}) => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  const handleUpgrade = (plan: 'PAY_AS_YOU_GO' | 'PRO') => {
    onSelectPlan(plan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0b1329] border border-slate-700/80 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-slate-800 bg-slate-900/40">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>PRICING THAT PAYS FOR ITSELF IN 1 PREVENTED FAKE ALERT</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Choose Your Merchant Protection Plan
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Zero hardware POS maintenance fees. Zero fake transfer losses.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          {/* Pay As You Go */}
          <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            currentPlan === 'PAY_AS_YOU_GO'
              ? 'bg-slate-900/90 border-slate-700'
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
          }`}>
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">Starter / Micro</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">For casual sellers &amp; beginners</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  ₦0 / mo
                </span>
              </div>

              <div className="mt-4 mb-4">
                <span className="text-3xl font-black text-white font-mono">₦50</span>
                <span className="text-xs text-slate-400 font-medium"> / verified transfer</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Dynamic 10-digit virtual accounts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Web cashier dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Basic digital receipts</span>
                </li>
                <li className="flex items-center gap-2 text-slate-500 line-through">
                  <span>Cashier voice audio soundbox</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleUpgrade('PAY_AS_YOU_GO')}
              className={`w-full mt-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
                currentPlan === 'PAY_AS_YOU_GO'
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {currentPlan === 'PAY_AS_YOU_GO' ? 'Current Plan' : 'Select Starter'}
            </button>
          </div>

          {/* Pro Merchant Plan */}
          <div className="p-5 rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 flex flex-col justify-between relative shadow-xl shadow-emerald-950/50">
            
            <div className="absolute -top-3 right-4">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 uppercase tracking-wide shadow-md">
                MOST POPULAR
              </span>
            </div>

            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-emerald-300 text-sm">Pro Merchant Soundbox</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">For active stores &amp; Instagram vendors</p>
                </div>
              </div>

              <div className="mt-4 mb-4">
                <span className="text-3xl font-black text-white font-mono">₦3,500</span>
                <span className="text-xs text-slate-400 font-medium"> / month</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-emerald-200">Unlimited free verifications (₦0 fee)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Real-time Voice Cashier Speaker</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Branded WhatsApp e-receipts with your logo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Instant auto-sweep to OPay/GTBank</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Multiple Cashier staff sub-logins</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleUpgrade('PRO')}
              className="w-full mt-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>{currentPlan === 'PRO' ? 'Active Plan' : 'Upgrade to Pro Now'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 text-center flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Pay with Naira Debit Card or Bank Transfer via Paystack</span>
          </div>
          <button onClick={onClose} className="hover:text-white font-semibold">
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
