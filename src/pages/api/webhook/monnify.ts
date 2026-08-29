import type { NextApiRequest, NextApiResponse } from 'next';
import { DataStore } from '@/lib/store';
import { verifyMonnifySignature } from '@/lib/payment-rails';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const secret = process.env.MONNIFY_SECRET_KEY || 'mock_secret';
  const signature = req.headers['monnify-signature'] as string;

  if (process.env.NODE_ENV === 'production' && !verifyMonnifySignature(JSON.stringify(req.body), signature, secret)) {
    return res.status(401).json({ error: 'Invalid Monnify webhook signature' });
  }

  const event = req.body;

  try {
    // Monnify Event: SUCCESSFUL_TRANSACTION
    if (event.eventType === 'SUCCESSFUL_TRANSACTION') {
      const data = event.eventData;
      const accountNumber = data.destinationAccountInformation?.accountNumber;
      const amount = data.amountPaid;
      const senderName = data.paymentSourceInformation?.[0]?.accountName || 'Bank Transfer Customer';
      const senderBank = data.paymentSourceInformation?.[0]?.bankName || 'Interbank NIP';

      if (accountNumber) {
        DataStore.updateTransaction(accountNumber, {
          status: 'SUCCESSFUL',
          paidAt: new Date().toISOString(),
          senderName,
          senderBank,
          reference: data.transactionReference
        });
      }
    }

    return res.status(200).json({ requestSuccessful: true, responseMessage: 'Success' });
  } catch (err) {
    console.error('Monnify webhook error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
