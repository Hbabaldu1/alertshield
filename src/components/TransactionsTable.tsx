import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Search, 
  ExternalLink, 
  FileText, 
  ArrowUpRight, 
  ShieldCheck,
  Building,
  Filter
} from 'lucide-react';
import { PaymentRequest } from '@/types';
import { formatNaira } from '@/lib/payment-rails';

interface TransactionsTableProps {
  transactions: PaymentRequest[];
  onSelectPayment: (payment: PaymentRequest) => void;
  onViewReceipt: (payment: PaymentRequest) => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  onSelectPayment,
  onViewReceipt
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SUCCESSFUL' | 'PENDING'>('ALL');

  const filtered = transactions.filter((tx) => {
    const matchesSearch = 
      tx.virtualAccountNumber.includes(searchTerm) ||
      (tx.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.senderName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.senderBank || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.reference.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'ALL' || tx.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0d1527]/90 backdrop-blur-xl p-5 sm:p-6 shadow-xl">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Recent Payment Activity</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
              {transactions.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Real-time direct bank transfers into your dynamic virtual accounts
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search payer, bank, acc..."
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 sm:w-56"
            />
          </div>

          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs">
            {(['ALL', 'SUCCESSFUL', 'PENDING'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status === 'ALL' ? 'All' : status === 'SUCCESSFUL' ? 'Paid' : 'Pending'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table / List */}
      <div className="mt-4 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            No transactions found matching criteria.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800/80 uppercase text-[10px] tracking-wider font-semibold">
                <th className="pb-3 pl-2">Status</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Virtual Account</th>
                <th className="pb-3">Payer Details</th>
                <th className="pb-3">Time</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filtered.map((tx) => {
                const isPaid = tx.status === 'SUCCESSFUL';
                return (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors group">
                    
                    {/* Status Badge */}
                    <td className="py-3.5 pl-2">
                      {isPaid ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>VERIFIED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <Clock className="h-3 w-3" />
                          <span>Awaiting</span>
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 font-bold text-white text-sm font-['JetBrains_Mono',monospace]">
                      {formatNaira(tx.amount)}
                    </td>

                    {/* Virtual Account */}
                    <td className="py-3.5">
                      <p className="font-mono font-bold text-slate-200">{tx.virtualAccountNumber}</p>
                      <p className="text-[10px] text-slate-400">{tx.bankName}</p>
                    </td>

                    {/* Payer Details */}
                    <td className="py-3.5">
                      <p className="font-semibold text-slate-200 truncate max-w-[150px]">
                        {tx.senderName || tx.customerName || 'In-store customer'}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span>{tx.senderBank || 'Direct Transfer'}</span>
                      </p>
                    </td>

                    {/* Time */}
                    <td className="py-3.5 text-slate-400 text-[11px]">
                      {new Date(tx.paidAt || tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 text-right pr-2">
                      <div className="flex items-center justify-end space-x-1.5">
                        {isPaid ? (
                          <button
                            onClick={() => onViewReceipt(tx)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                            title="View Receipt"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectPayment(tx)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-[11px] border border-emerald-500/40 transition-colors"
                          >
                            View Account
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};
