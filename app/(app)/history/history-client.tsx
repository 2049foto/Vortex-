/**
 * Vortex Protocol - History Page Client Component
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { getUserHistory } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Clock, Search, ArrowRight, ExternalLink, Wallet } from 'lucide-react';

export function HistoryPageClient() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // Always call hooks, but only use values after mount
  const { address, isConnected } = useAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !address) {
      if (mounted) setIsLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const result = await getUserHistory(address, 50, 0);
        setTransactions(result.data?.requests || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [address, mounted]);

  const filteredTransactions = transactions.filter(tx => 
    !searchQuery || 
    tx.txHash?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Not connected state
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-5xl min-h-screen">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Connect Your Wallet</h2>
          <p className="text-slate-500 mb-8">Connect your wallet to view your transaction history.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-slate-900">Transaction History</h1>
          <p className="text-slate-500 mt-2 font-light">View all your past consolidation activities.</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by hash..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-6 py-3 rounded-2xl border border-slate-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 w-full md:w-80 transition-all font-medium"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="py-4">
            <p className="text-red-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredTransactions.length === 0 && !error && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No transactions yet</h3>
          <p className="text-slate-500 mb-6">Start your first consolidation to see history here.</p>
          <Button onClick={() => router.push('/scan')}>
            Start Scanning
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      )}

      {/* Transactions List */}
      {filteredTransactions.length > 0 && (
        <Card className="border-white/60 shadow-2xl shadow-slate-200/50 backdrop-blur-xl bg-white/80">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between hover:bg-indigo-50/30 transition-all duration-300 group cursor-pointer border-l-4 border-transparent hover:border-indigo-500"
                >
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                      tx.status === 'completed' || tx.status === 'COMPLETED'
                        ? 'bg-emerald-50 border border-emerald-100 text-emerald-600'
                        : tx.status === 'failed' || tx.status === 'FAILED'
                        ? 'bg-red-50 border border-red-100 text-red-600'
                        : 'bg-amber-50 border border-amber-100 text-amber-600'
                    }`}>
                      <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-3 text-lg font-display">
                        Consolidation 
                        <Badge variant="secondary" className="text-[10px] font-bold text-slate-500 bg-slate-100 border-slate-200">
                          {tx.tokensCount || tx.inputTokens?.length || 0} Tokens
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-2 mt-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(tx.createdAt || tx.created_at).toLocaleDateString()}
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="font-mono text-xs opacity-70 bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {tx.txHash ? `${tx.txHash.slice(0, 10)}...${tx.txHash.slice(-6)}` : tx.id?.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right w-full md:w-auto mt-4 md:mt-0 flex items-center justify-between md:block">
                    <span className="md:hidden text-sm font-medium text-slate-500">Amount</span>
                    <div>
                      <div className={`font-bold text-xl font-mono tracking-tight ${
                        tx.status === 'completed' || tx.status === 'COMPLETED' 
                          ? 'text-emerald-600' 
                          : 'text-slate-600'
                      }`}>
                        {tx.actualOutput ? `+$${parseFloat(tx.actualOutput).toFixed(2)}` : tx.estimatedOutput ? `~$${parseFloat(tx.estimatedOutput).toFixed(2)}` : '-'}
                      </div>
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        <div className={`h-1.5 w-1.5 rounded-full ${
                          tx.status === 'completed' || tx.status === 'COMPLETED'
                            ? 'bg-emerald-500 animate-pulse'
                            : tx.status === 'failed' || tx.status === 'FAILED'
                            ? 'bg-red-500'
                            : 'bg-amber-500 animate-pulse'
                        }`} />
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${
                          tx.status === 'completed' || tx.status === 'COMPLETED'
                            ? 'text-emerald-700'
                            : tx.status === 'failed' || tx.status === 'FAILED'
                            ? 'text-red-700'
                            : 'text-amber-700'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {tx.txHash && (
                    <a
                      href={`https://basescan.org/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden md:flex opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ml-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-indigo-50 text-indigo-600">
                        <ExternalLink className="w-5 h-5" />
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
