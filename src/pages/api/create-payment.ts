import type { NextApiRequest, NextApiResponse } from 'next';
import { DataStore } from '@/lib/store';
import { createNewPaymentRequest } from '@/lib/payment-rails';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { amount, description, customerName, customerPhone } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const merchant = DataStore.getMerchant();
    const newTx = createNewPaymentRequest({
      amount: Number(amount),
      description: description || 'In-store purchase',
      customerName,
      customerPhone,
      merchantName: merchant.businessName
    });

    DataStore.addTransaction(newTx);

    return res.status(201).json({
      success: true,
      payment: newTx
    });
  } catch (error) {
    console.error('Error creating payment request:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
