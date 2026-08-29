import crypto from 'crypto';
import { BankType, PaymentRequest } from '@/types';

// Supported Banks for Dynamic Virtual Accounts in Nigeria
const DVA_BANKS: BankType[] = ['Wema Bank', 'Providus Bank', 'Titan Trust Bank', 'Sterling Bank'];

export function generateDynamicVirtualAccount(prefix: string = '99'): { accountNumber: string; bankName: BankType } {
  // Generate a realistic 10-digit NIP-compatible virtual account number
  const random8Digits = Math.floor(10000000 + Math.random() * 90000000).toString();
  const accountNumber = `${prefix}${random8Digits.substring(0, 8)}`;
  const bankName = DVA_BANKS[Math.floor(Math.random() * DVA_BANKS.length)];

  return {
    accountNumber,
    bankName
  };
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount).replace('NGN', '₦');
}

export function verifyPaystackSignature(body: string, signature: string, secretKey: string): boolean {
  if (!signature || !secretKey) return false;
  const hash = crypto.createHmac('sha512', secretKey).update(body).digest('hex');
  return hash === signature;
}

export function verifyMonnifySignature(body: string, signature: string, secretKey: string): boolean {
  if (!signature || !secretKey) return false;
  const hash = crypto.createHmac('sha512', secretKey).update(body).digest('hex');
  return hash === signature;
}

export function createNewPaymentRequest(params: {
  amount: number;
  description: string;
  customerName?: string;
  customerPhone?: string;
  merchantName: string;
}): PaymentRequest {
  const { accountNumber, bankName } = generateDynamicVirtualAccount('99');
  const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 mins validity

  return {
    id,
    amount: params.amount,
    customerName: params.customerName || 'Customer',
    customerPhone: params.customerPhone || '',
    description: params.description || 'Payment for goods/services',
    virtualAccountNumber: accountNumber,
    bankName,
    accountName: `AlertShield - ${params.merchantName.substring(0, 16)}`,
    status: 'PENDING',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    reference: `AS_REF_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    fee: 0
  };
}
