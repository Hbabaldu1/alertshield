import { PaymentRequest, MerchantProfile } from '@/types';

export const DEFAULT_MERCHANT: MerchantProfile = {
  businessName: "Lekki Luxury Gadgets & Wears",
  phone: "+2348012345678",
  settlementBank: "OPay (PayCom)",
  settlementAccountNumber: "8012345678",
  settlementAccountName: "LEKKI LUXURY VENTURES",
  plan: "PRO",
  voiceAlertEnabled: true,
  voiceVolume: 100,
  soundEffect: "pos_beep",
  apiKey: "as_live_9983481029481"
};

export const INITIAL_TRANSACTIONS: PaymentRequest[] = [
  {
    id: "tx_01",
    amount: 28500,
    customerName: "Chisom Eze",
    customerPhone: "08034567890",
    description: "iPhone 15 Screen Guard + Fast Charger",
    virtualAccountNumber: "9928341029",
    bankName: "Wema Bank",
    accountName: "AlertShield - Lekki Luxury",
    status: "SUCCESSFUL",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 18).toISOString(),
    paidAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    senderName: "CHISOM EMMANUEL EZE",
    senderBank: "GTBank",
    reference: "REF_DVA_9928341",
    fee: 0
  },
  {
    id: "tx_02",
    amount: 14000,
    customerName: "Babatunde Lawal",
    customerPhone: "08129876543",
    description: "Wireless Earbuds Pro",
    virtualAccountNumber: "9910482910",
    bankName: "Providus Bank",
    accountName: "AlertShield - Lekki Luxury",
    status: "SUCCESSFUL",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    expiresAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    paidAt: new Date(Date.now() - 1000 * 60 * 43).toISOString(),
    senderName: "BABATUNDE OLUMIDE LAWAL",
    senderBank: "Kuda Bank",
    reference: "REF_DVA_9910482",
    fee: 0
  },
  {
    id: "tx_03",
    amount: 65000,
    customerName: "Amina Bello",
    customerPhone: "09087654321",
    description: "Designer Leather Handbag",
    virtualAccountNumber: "9937461928",
    bankName: "Wema Bank",
    accountName: "AlertShield - Lekki Luxury",
    status: "SUCCESSFUL",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    expiresAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    paidAt: new Date(Date.now() - 1000 * 60 * 118).toISOString(),
    senderName: "AMINA MOHAMMED BELLO",
    senderBank: "Zenith Bank",
    reference: "REF_DVA_9937461",
    fee: 0
  }
];

// In-Memory store fallback for API routes and SSR
export class DataStore {
  private static transactions: PaymentRequest[] = [...INITIAL_TRANSACTIONS];
  private static merchant: MerchantProfile = { ...DEFAULT_MERCHANT };

  public static getTransactions(): PaymentRequest[] {
    return this.transactions;
  }

  public static addTransaction(tx: PaymentRequest): void {
    this.transactions.unshift(tx);
  }

  public static getTransactionById(id: string): PaymentRequest | undefined {
    return this.transactions.find(t => t.id === id || t.reference === id || t.virtualAccountNumber === id);
  }

  public static updateTransaction(id: string, updates: Partial<PaymentRequest>): PaymentRequest | undefined {
    const idx = this.transactions.findIndex(t => t.id === id || t.reference === id || t.virtualAccountNumber === id);
    if (idx !== -1) {
      this.transactions[idx] = { ...this.transactions[idx], ...updates };
      return this.transactions[idx];
    }
    return undefined;
  }

  public static getMerchant(): MerchantProfile {
    return this.merchant;
  }

  public static updateMerchant(updates: Partial<MerchantProfile>): MerchantProfile {
    this.merchant = { ...this.merchant, ...updates };
    return this.merchant;
  }
}
