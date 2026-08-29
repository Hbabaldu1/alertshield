import React, { useState } from 'react';
import { X, Building, Check, Save, Volume2, Key, ShieldCheck, CreditCard } from 'lucide-react';
import { MerchantProfile } from '@/types';
import { soundEngine } from '@/lib/audio';

interface MerchantSettingsProps {
  merchant: MerchantProfile;
  onSave: (updates: Partial<MerchantProfile>) => void;
  onClose: () => void;
}

const SETTLEMENT_BANKS = [
  'OPay (PayCom)',
  'Moniepoint MFB',
  'Kuda Microfinance Bank',
  'GTBank (Guaranty Trust)',
  'Zenith Bank',
  'Access Bank',
  'United Bank for Africa (UBA)',
  'First Bank of Nigeria',
  'Stanbic IBTC Bank',
  'Fidelity Bank',
  'PalmPay'
];

export const MerchantSettings: React.FC<MerchantSettingsProps> = ({
  merchant,
  onSave,
  onClose
}) => {
  const [businessName, setBusinessName] = useState(merchant.businessName);
  const [phone, setPhone] = useState(merchant.phone);
  const [settlementBank, setSettlementBank] = useState(merchant.settlementBank);
  const [settlementAccountNumber, setSettlementAccountNumber] = useState(merchant.settlementAccountNumber);
  const [settlementAccountName, setSettlementAccountName] = useState(merchant.settlementAccountName);
  const [voiceAlertEnabled, setVoiceAlertEnabled] = useState(merchant.voiceAlertEnabled);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      businessName,
      phone,
      settlementBank,
      settlementAccountNumber,
      settlementAccountName,
      voiceAlertEnabled
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0e172a] border border-slate-700 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Merchant &amp; Settlement Payout Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Business Name */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Store / Business Name (Appears on Customer Receipts)
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          {/* WhatsApp Alert Phone */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Merchant WhatsApp Alert Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Settlement Bank Section */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" />
              <span>Direct Bank Settlement (Auto-Sweep Payout)</span>
            </h4>

            <div>
              <label className="block font-medium text-slate-400 mb-1">
                Settlement Bank
              </label>
              <select
                value={settlementBank}
                onChange={(e) => setSettlementBank(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              >
                {SETTLEMENT_BANKS.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-400 mb-1">
                  Account Number (10 Digits)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={settlementAccountNumber}
                  onChange={(e) => setSettlementAccountNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-400 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={settlementAccountName}
                  onChange={(e) => setSettlementAccountName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-bold truncate"
                />
              </div>
            </div>
          </div>

          {/* Voice Soundbox Toggle */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-200">Cashier Voice Audio Speaker</p>
              <p className="text-[11px] text-slate-400">Speaks amount and customer name upon NIP confirmation</p>
            </div>
            <input
              type="checkbox"
              checked={voiceAlertEnabled}
              onChange={(e) => setVoiceAlertEnabled(e.target.checked)}
              className="h-5 w-5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-900 cursor-pointer"
            />
          </div>

          {/* Save Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Settings Saved Successfully!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
