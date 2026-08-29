export type BankType = 
  | 'Wema Bank' 
  | 'Providus Bank' 
  | 'Titan Trust Bank' 
  | 'Sterling Bank' 
  | 'Kuda Bank' 
  | 'OPay' 
  | 'Moniepoint' 
  | 'GTBank' 
  | 'Zenith Bank' 
  | 'Access Bank' 
  | 'UBA';

export interface PaymentRequest {
  id: string;
  amount: number; // in Naira (NGN)
  customerName?: string;
  customerPhone?: string;
  description: string;
  virtualAccountNumber: string;
  bankName: BankType;
  accountName: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'EXPIRED' | 'FAILED';
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
  senderName?: string;
  senderBank?: string;
  reference: string;
  fee: number; // ₦50 fee or ₦0 for pro
}

export interface MerchantProfile {
  businessName: string;
  phone: string;
  settlementBank: string;
  settlementAccountNumber: string;
  settlementAccountName: string;
  plan: 'PAY_AS_YOU_GO' | 'PRO';
  voiceAlertEnabled: boolean;
  voiceVolume: number;
  soundEffect: 'chime' | 'pos_beep' | 'cash_register';
  apiKey?: string;
}

export interface WebhookSimPayload {
  amount: number;
  senderName: string;
  senderBank: string;
  virtualAccount: string;
  sessionId: string;
}
