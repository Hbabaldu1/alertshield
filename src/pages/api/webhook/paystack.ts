import type { NextApiRequest, NextApiResponse } from 'next';
import { DataStore } from '@/lib/store';
import { verifyPaystackSignature } from '@/lib/payment-rails';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const secret = process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock';
  const signature = req.headers['x-paystack-signature'] as string;

  // In production, enforce signature check
  if (process.env.NODE_ENV === 'production' && !verifyPaystackSignature(JSON.stringify(req.body), signature, secret)) {
    return res.status(401).json({ error: 'Invalid Paystack webhook signature' });
  }

  const event = req.body;

  try {
    // Paystack Dedicated Virtual Account Event: 'charge.success' or 'dedicated_account.assign.success'
    if (event.event === 'charge.success') {
      const data = event.data;
      const accountNumber = data.authorization?.receiver_bank_account_number || data.customer?.phone;
      const amount = data.amount / 100; // Paystack is in Kobo
      const senderName = `${data.customer?.first_name || ''} ${data.customer?.last_name || ''}`.trim() || 'Direct Transfer Customer';
      const senderBank = data.authorization?.bank || 'Nigerian Interbank (NIP)';

      if (accountNumber) {
        DataStore.updateTransaction(accountNumber, {
          status: 'SUCCESSFUL',
          paidAt: new Date().toISOString(),
          senderName,
          senderBank,
          reference: data.reference
        });
      }
    }

    return res.status(200).json({ status: true, message: 'Webhook processed' });
  } catch (err) {
    console.error('Paystack webhook error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
