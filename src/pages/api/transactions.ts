import type { NextApiRequest, NextApiResponse } from 'next';
import { DataStore } from '@/lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    if (id && typeof id === 'string') {
      const tx = DataStore.getTransactionById(id);
      if (!tx) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      return res.status(200).json({ success: true, transaction: tx });
    }

    const transactions = DataStore.getTransactions();
    const merchant = DataStore.getMerchant();
    return res.status(200).json({
      success: true,
      transactions,
      merchant
    });
  }

  if (req.method === 'PATCH') {
    const { merchantUpdates } = req.body;
    if (merchantUpdates) {
      const updated = DataStore.updateMerchant(merchantUpdates);
      return res.status(200).json({ success: true, merchant: updated });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
