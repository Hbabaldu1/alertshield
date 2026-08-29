import type { NextApiRequest, NextApiResponse } from 'next';
import { DataStore } from '@/lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { virtualAccountNumber, senderName, senderBank, amount } = req.body;

    if (!virtualAccountNumber) {
      return res.status(400).json({ error: 'virtualAccountNumber is required' });
    }

    const tx = DataStore.getTransactionById(virtualAccountNumber);

    if (!tx) {
      return res.status(404).json({ error: 'Virtual account not found or expired' });
    }

    if (tx.status === 'SUCCESSFUL') {
      return res.status(400).json({ error: 'This payment has already been completed' });
    }

    const updatedTx = DataStore.updateTransaction(virtualAccountNumber, {
      status: 'SUCCESSFUL',
      paidAt: new Date().toISOString(),
      senderName: senderName || 'TAOFEEQ OLAMILEKAN ADEYEMI',
      senderBank: senderBank || 'OPay (PayCom)',
      amount: amount ? Number(amount) : tx.amount
    });

    return res.status(200).json({
      success: true,
      message: 'Transfer verified and settled via NIP interbank network',
      transaction: updatedTx
    });
  } catch (err) {
    console.error('Simulation error:', err);
    return res.status(500).json({ error: 'Failed to process simulated transfer' });
  }
}
