import React, { useState } from 'react';
import { Play, Sparkles, AlertCircle, ArrowUpRight, CheckCircle2, Building, User } from 'lucide-react';
import { PaymentRequest } from '@/types';
import { formatNaira } from '@/lib/payment-rails';

interface WebhookSimulatorProps {
  activePendingPayment: PaymentRequest | null;
  onSimulateSuccess: (updatedTx: PaymentRequest) => void;
}

const NAIJA_BANKS = [
  'OPay (PayCom)',
  'Kuda Microfinance Bank',
  'Moniepoint MFB',
  'GTBank (Guaranty Trust)',
  'Zenith Bank',
  'Access Bank',
  'PalmPay',
  'UBA (United Bank for Africa)'
];

const SAMPLE_BUYERS = [
  'TAOFEEQ OLAMILEKAN ADEYEMI',
  'CHIDINMA BLESSING OKAFOR',
  'BABATUNDE SEGUN LAWAL',
  'AISHA BELLO ABUBAKAR',
  'EMMANUEL CHIBUZOR EZE'
];

export const WebhookSimulator: React.FC<WebhookSimulatorProps> = ({
  activePendingPayment,
  onSimulateSuccess
}) => {
  const [selectedBank, setSelectedBank] = useState<string>(NAIJA_BANKS[0]);
  const [senderName, setSenderName] = useState<string>(SAMPLE_BUYERS[0]);
  const [isFiring, setIsFiring] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const handleFireTransfer = async () => {
    if (!activePendingPayment) return;

    setIsFiring(true);
    setResultMessage(null);

    try {
      const res = await fetch('/api/simulate-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          virtualAccountNumber: activePendingPayment.virtualAccountNumber,
          senderName,
          senderBank: selectedBank,
          amount: activePendingPayment.amount
        })
      });

      const data = await res.json();
      if (data.success && data.transaction) {
        setResultMessage(`✅ Simulated NIP Transfer from ${selectedBank} confirmed in 1.2s!`);
        onSimulateSuccess(data.transaction);
      } else {
        setResultMessage(`❌ ${data.error || 'Transfer simulation failed'}`);
      }
    } catch (err) {
      console.error('Error firing simulated webhook:', err);
      setResultMessage('❌ Network error during simulation');
    } finally {
      setIsFiring(false);
    }
  };

  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#091e1d]/80 to-[#0c1524]/90 backdrop-blur-xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-emerald-900/40">
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Interactive Transfer Simulator (NIP Webhook)
            </h3>
            <p className="text-[11px] text-emerald-400/80 font-medium">
              Simulate a customer sending a bank transfer from their mobile banking app
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          TEST RUNNER
        </span>
      </div>

      {/* Body */}
      <div className="mt-4 space-y-4">
        
        {activePendingPayment ? (
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Target Dynamic Account:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {activePendingPayment.virtualAccountNumber} ({activePendingPayment.bankName})
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Amount Due:</span>
              <span className="font-bold text-white font-mono text-sm">
                {formatNaira(activePendingPayment.amount)}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
            Generate an amount above or click any pending invoice to test transfer simulation.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Customer&apos;s Sending Bank (NIP Source)
            </label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {NAIJA_BANKS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Sender Name on Bank App
            </label>
            <select
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {SAMPLE_BUYERS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Trigger Button */}
        <button
          onClick={handleFireTransfer}
          disabled={!activePendingPayment || isFiring || activePendingPayment.status === 'SUCCESSFUL'}
          className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isFiring ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
              Settling via NIP Gateway...
            </span>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" />
              <span>SIMULATE CUSTOMER TRANSFER NOW</span>
            </>
          )}
        </button>

        {resultMessage && (
          <p className="text-xs text-center font-semibold text-emerald-400 animate-fadeIn">
            {resultMessage}
          </p>
        )}

      </div>
    </div>
  );
};
