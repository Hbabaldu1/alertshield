import React, { useState } from 'react';
import { 
  CreditCard, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Store,
  QrCode,
  Zap
} from 'lucide-react';
import { formatNaira } from '@/lib/payment-rails';
import { PaymentRequest } from '@/types';

interface SoundboxTerminalProps {
  onGeneratePayment: (params: {
    amount: number;
    description: string;
    customerName?: string;
    customerPhone?: string;
  }) => Promise<PaymentRequest | null>;
  totalToday: number;
  txCount: number;
}

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

export const SoundboxTerminal: React.FC<SoundboxTerminalProps> = ({
  onGeneratePayment,
  totalToday,
  txCount
}) => {
  const [amountStr, setAmountStr] = useState<string>('5000');
  const [description, setDescription] = useState<string>('In-store sale');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setAmountStr('0');
    } else if (val === 'DEL') {
      setAmountStr(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (val === '00') {
      if (amountStr !== '0' && amountStr.length < 9) {
        setAmountStr(prev => prev + '00');
      }
    } else {
      if (amountStr === '0') {
        setAmountStr(val);
      } else if (amountStr.length < 9) {
        setAmountStr(prev => prev + val);
      }
    }
  };

  const handleQuickAmount = (val: number) => {
    setAmountStr(val.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amountStr, 10);
    if (!parsedAmount || parsedAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await onGeneratePayment({
        amount: parsedAmount,
        description: description || 'Store purchase',
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAmount = parseInt(amountStr || '0', 10);

  return (
    <div className="w-full">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/40 border border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Today&apos;s Verified Settlements</p>
            <p className="text-xl sm:text-2xl font-extrabold text-white font-['JetBrains_Mono',monospace]">
              {formatNaira(totalToday)}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/40 border border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-teal-950/80 border border-teal-800 text-teal-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Instant Confirmations</p>
            <p className="text-xl sm:text-2xl font-extrabold text-white font-['JetBrains_Mono',monospace]">
              {txCount} <span className="text-xs font-medium text-slate-400">transfers</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/40 border border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Fake Alert Shield</p>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-sm font-bold text-emerald-300">100% Protected (Active)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Terminal Card */}
      <div className="rounded-3xl border border-slate-800 bg-[#0d1527]/90 backdrop-blur-xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        
        {/* Glow Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-5 border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Cashier Virtual Soundbox Terminal</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                LIVE
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Zero POS Paper • Zero Network Delay • Instant Audio Beep
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          
          {/* Big Amount Screen */}
          <div className="relative rounded-2xl bg-slate-950/90 border-2 border-emerald-500/40 p-4 sm:p-6 text-center shadow-inner group transition-all hover:border-emerald-400">
            <div className="text-xs font-semibold text-emerald-400/90 uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              <span>Enter Amount to Collect</span>
            </div>
            
            <div className="text-3xl sm:text-5xl font-black text-white font-['JetBrains_Mono',monospace] tracking-tight py-2">
              {formatNaira(currentAmount)}
            </div>

            {/* Quick amount chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-3 pt-3 border-t border-slate-800/80">
              {QUICK_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAmount(amt)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    currentAmount === amt
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 scale-105'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
                >
                  +{formatNaira(amt).replace('.00', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Keypad & Input Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Numeric Keypad (7 cols on desktop) */}
            <div className="lg:col-span-7 grid grid-cols-3 gap-2 sm:gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'DEL'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypadPress(key)}
                  className={`py-3.5 sm:py-4 rounded-xl text-lg sm:text-xl font-bold font-['JetBrains_Mono',monospace] transition-all active:scale-95 select-none ${
                    key === 'DEL'
                      ? 'bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/50'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-800/80 shadow-sm'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Customer Details & Options (5 cols on desktop) */}
            <div className="lg:col-span-5 space-y-3.5 flex flex-col justify-between h-full">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Item / Sale Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 2 Perfumes &amp; Wristwatch"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  <span>{showAdvanced ? '− Hide' : '+ Add'} Customer WhatsApp for E-Receipt</span>
                </button>

                {showAdvanced && (
                  <div className="space-y-3 mt-2.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Customer Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Tunde Balogun"
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Customer WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="e.g. 08012345678"
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={isSubmitting || currentAmount <= 0}
                className="w-full mt-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-base sm:text-lg tracking-wide shadow-xl shadow-emerald-950/60 border border-emerald-400/40 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    Generating Account...
                  </span>
                ) : (
                  <>
                    <QrCode className="h-5 w-5" />
                    <span>GENERATE TRANSFER ACCOUNT</span>
                    <ArrowRight className="h-5 w-5 ml-1" />
                  </>
                )}
              </button>

            </div>

          </div>

        </form>

      </div>
    </div>
  );
};
