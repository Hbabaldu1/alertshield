import React, { useState } from 'react';
import { ShieldCheck, Volume2, VolumeX, Sparkles, Building2, BellRing, Smartphone, CheckCircle } from 'lucide-react';
import { MerchantProfile } from '@/types';
import { soundEngine } from '@/lib/audio';

interface NavbarProps {
  merchant: MerchantProfile;
  onOpenSettings: () => void;
  onOpenPricing: () => void;
  onToggleVoice: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  merchant,
  onOpenSettings,
  onOpenPricing,
  onToggleVoice
}) => {
  const [tested, setTested] = useState(false);

  const handleTestSound = () => {
    soundEngine.speakAlert(15000, "Chidi Okonkwo", "OPay");
    setTested(true);
    setTimeout(() => setTested(false), 3000);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#090e1a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#090e1a]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Value Hook */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-800 flex items-center justify-center shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-500/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-['JetBrains_Mono',monospace]">
                  Alert<span className="text-emerald-400">Shield</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60 uppercase tracking-wide">
                  🇳🇬 Anti-Fake Alert
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden md:block">
                Instant Bank Transfer Soundbox &amp; Virtual Account Invoicing
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* Live Audio Test Button */}
            <button
              onClick={handleTestSound}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tested 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 scale-95' 
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Test the Cashier Voice Alert Speaker"
            >
              <BellRing className={`h-3.5 w-3.5 ${tested ? 'animate-bounce text-emerald-400' : 'text-amber-400'}`} />
              <span className="hidden xs:inline">{tested ? 'Speaking Alert...' : 'Test Speaker'}</span>
            </button>

            {/* Voice Mute/Unmute */}
            <button
              onClick={onToggleVoice}
              className={`p-2 rounded-lg border text-xs transition-colors ${
                merchant.voiceAlertEnabled
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400 hover:bg-emerald-900/60'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
              title={merchant.voiceAlertEnabled ? "Cashier Voice: ON" : "Cashier Voice: OFF"}
            >
              {merchant.voiceAlertEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </button>

            {/* Plan Badge */}
            <button
              onClick={onOpenPricing}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/40 text-amber-300 hover:border-amber-400 transition-all hover:scale-105"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>{merchant.plan === 'PRO' ? 'PRO Plan (Active)' : 'Upgrade Pro'}</span>
            </button>

            {/* Store & Settlement Bank info */}
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <Building2 className="h-4 w-4 text-emerald-400" />
              <div className="text-left hidden lg:block">
                <p className="font-semibold text-slate-100 leading-none truncate max-w-[130px]">{merchant.businessName}</p>
                <p className="text-[10px] text-slate-400 leading-none mt-1">Payout: {merchant.settlementBank}</p>
              </div>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
