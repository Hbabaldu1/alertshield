import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { 
  ShieldCheck, 
  Sparkles, 
  Volume2, 
  Smartphone, 
  ArrowRight, 
  CheckCircle2, 
  CreditCard, 
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Zap,
  Lock,
  ChevronRight
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SoundboxTerminal } from '@/components/SoundboxTerminal';
import { TransactionsTable } from '@/components/TransactionsTable';
import { PaymentModal } from '@/components/PaymentModal';
import { DigitalReceipt } from '@/components/DigitalReceipt';
import { WebhookSimulator } from '@/components/WebhookSimulator';
import { MerchantSettings } from '@/components/MerchantSettings';
import { PricingModal } from '@/components/PricingModal';
import { PaymentRequest, MerchantProfile } from '@/types';
import { DEFAULT_MERCHANT, INITIAL_TRANSACTIONS } from '@/lib/store';
import { soundEngine } from '@/lib/audio';

export default function Dashboard() {
  const [merchant, setMerchant] = useState<MerchantProfile>(DEFAULT_MERCHANT);
  const [transactions, setTransactions] = useState<PaymentRequest[]>(INITIAL_TRANSACTIONS);
  const [activePayment, setActivePayment] = useState<PaymentRequest | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<PaymentRequest | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);

  // Keep track of announced transaction IDs to avoid double-speaking
  const announcedTxIds = useRef<Set<string>>(new Set(['tx_01', 'tx_02', 'tx_03']));

  // Fetch initial data
  const fetchData = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      if (data.success) {
        if (data.transactions) {
          setTransactions(data.transactions);

          // Check if any transaction just became SUCCESSFUL and hasn't been announced yet
          data.transactions.forEach((tx: PaymentRequest) => {
            if (tx.status === 'SUCCESSFUL' && !announcedTxIds.current.has(tx.id)) {
              announcedTxIds.current.add(tx.id);
              
              // Trigger Cashier Voice Alert!
              if (merchant.voiceAlertEnabled) {
                soundEngine.speakAlert(tx.amount, tx.senderName, tx.senderBank);
              }

              // Also update active modal if currently opened
              if (activePayment && activePayment.id === tx.id) {
                setActivePayment(tx);
              }
            }
          });
        }
        if (data.merchant) {
          setMerchant(data.merchant);
        }
      }
    } catch (err) {
      console.error('Error fetching live transactions:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2500); // Live poll every 2.5s
    return () => clearInterval(interval);
  }, [activePayment, merchant.voiceAlertEnabled]);

  // Handle generating a new payment request
  const handleGeneratePayment = async (params: {
    amount: number;
    description: string;
    customerName?: string;
    customerPhone?: string;
  }): Promise<PaymentRequest | null> => {
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (data.success && data.payment) {
        setActivePayment(data.payment);
        setTransactions(prev => [data.payment, ...prev]);
        return data.payment;
      }
      return null;
    } catch (err) {
      console.error('Failed to create payment:', err);
      return null;
    }
  };

  // Handle simulation result
  const handleSimulateSuccess = (updatedTx: PaymentRequest) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
    setActivePayment(updatedTx);
    if (!announcedTxIds.current.has(updatedTx.id)) {
      announcedTxIds.current.add(updatedTx.id);
      if (merchant.voiceAlertEnabled) {
        soundEngine.speakAlert(updatedTx.amount, updatedTx.senderName, updatedTx.senderBank);
      }
    }
  };

  // Save merchant updates
  const handleSaveMerchant = async (updates: Partial<MerchantProfile>) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantUpdates: updates })
      });
      const data = await res.json();
      if (data.success && data.merchant) {
        setMerchant(data.merchant);
      }
    } catch (err) {
      console.error('Error saving merchant profile:', err);
    }
  };

  // Calculate totals
  const totalToday = transactions
    .filter(t => t.status === 'SUCCESSFUL')
    .reduce((sum, t) => sum + t.amount, 0);

  const successfulTxCount = transactions.filter(t => t.status === 'SUCCESSFUL').length;

  // Find the latest pending payment for simulator hook
  const latestPending = transactions.find(t => t.status === 'PENDING') || activePayment;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Head>
        <title>AlertShield 🇳🇬 | Anti-Fake Alert & Instant Virtual Account Soundbox</title>
      </Head>

      {/* Top Navigation */}
      <Navbar
        merchant={merchant}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPricing={() => setIsPricingOpen(true)}
        onToggleVoice={() => handleSaveMerchant({ voiceAlertEnabled: !merchant.voiceAlertEnabled })}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* Value Hero Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/20 p-5 sm:p-7 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <Zap className="h-3.5 w-3.5" />
              <span>Nigerian Merchant Protection Engine</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              Stop Fake Bank Alerts &amp; POS Network Downtime.
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Generate 1-time dynamic virtual accounts for customers. Get loud voice alerts the millisecond money enters your bank.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsPricingOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
            >
              <span>Pricing &amp; Plans</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
            >
              Configure Settlement Bank
            </button>
          </div>
        </div>

        {/* 2-Column Grid: Left Terminal, Right Simulator & Guides */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Cashier Soundbox Terminal (7 Cols) */}
          <div className="lg:col-span-7 space-y-8">
            <SoundboxTerminal
              onGeneratePayment={handleGeneratePayment}
              totalToday={totalToday}
              txCount={successfulTxCount}
            />
          </div>

          {/* Right Column: Interactive Simulator + Quick Setup (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Interactive Bank Webhook Simulator */}
            <WebhookSimulator
              activePendingPayment={latestPending && latestPending.status === 'PENDING' ? latestPending : null}
              onSimulateSuccess={handleSimulateSuccess}
            />

            {/* How It Works Explainer Card */}
            <div className="rounded-3xl border border-slate-800 bg-[#0d1527]/80 p-5 space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>How AlertShield Protects You in 3 Steps</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex items-start space-x-3">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <p className="text-slate-300"><strong className="text-white">Cashier enters amount:</strong> A dedicated 10-digit account number (Wema/Providus) is generated instantly.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <p className="text-slate-300"><strong className="text-white">Customer pays via bank app:</strong> Interbank NIP webhook triggers in &lt; 2 seconds.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                  <p className="text-slate-300"><strong className="text-white">Loud Voice &amp; WhatsApp Alert:</strong> Speaker says *"Confirmed ₦15,000 from [Name]"* and funds auto-sweep to your bank.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Section: Transactions History Table */}
        <div className="pt-2">
          <TransactionsTable
            transactions={transactions}
            onSelectPayment={(tx) => setActivePayment(tx)}
            onViewReceipt={(tx) => setReceiptPayment(tx)}
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-800/80 bg-[#060a12] py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="font-bold text-slate-200">AlertShield 🇳🇬</span>
            <span>— Built for Nigerian Retailers, Boutiques &amp; Instagram Merchants</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Powered by Paystack &amp; Monnify Dedicated Virtual Account APIs
          </p>
        </div>
      </footer>

      {/* Active Payment Modal */}
      {activePayment && (
        <PaymentModal
          payment={activePayment}
          onClose={() => setActivePayment(null)}
          onViewReceipt={(tx) => {
            setActivePayment(null);
            setReceiptPayment(tx);
          }}
        />
      )}

      {/* Digital Receipt Modal */}
      {receiptPayment && (
        <DigitalReceipt
          payment={receiptPayment}
          merchant={merchant}
          onClose={() => setReceiptPayment(null)}
        />
      )}

      {/* Merchant Settings Modal */}
      {isSettingsOpen && (
        <MerchantSettings
          merchant={merchant}
          onSave={handleSaveMerchant}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Pricing Modal */}
      {isPricingOpen && (
        <PricingModal
          currentPlan={merchant.plan}
          onSelectPlan={(plan) => handleSaveMerchant({ plan })}
          onClose={() => setIsPricingOpen(false)}
        />
      )}

    </div>
  );
}
