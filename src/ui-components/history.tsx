import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, Clock, CheckCircle2, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HistoryPage() {
  const transactions = [
    { id: 1, type: 'Consolidation', date: '2026-01-05', value: '+$12.45', tokens: 8, status: 'Success', txHash: '0x123...abc' },
    { id: 2, type: 'Consolidation', date: '2025-12-28', value: '+$45.20', tokens: 15, status: 'Success', txHash: '0x456...def' },
    { id: 3, type: 'Consolidation', date: '2025-11-15', value: '+$8.90', tokens: 5, status: 'Success', txHash: '0x789...ghi' },
  ];

  return (
    <div className="container mx-auto px-4 pt-32 pb-20 max-w-5xl min-h-screen">
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
            className="pl-10 pr-6 py-3 rounded-2xl border border-slate-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 w-full md:w-80 transition-all font-medium"
          />
        </div>
      </div>
      
      <Card variant="premium" className="border-white/60 shadow-2xl shadow-slate-200/50 backdrop-blur-xl bg-white/80">
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between hover:bg-indigo-50/30 transition-all duration-300 group cursor-pointer border-l-4 border-transparent hover:border-indigo-500">
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                    <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-3 text-lg font-display">
                      {tx.type} 
                      <Badge variant="secondary" className="text-[10px] font-bold text-slate-500 bg-slate-100 border-slate-200">{tx.tokens} Tokens</Badge>
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-2 mt-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {tx.date}
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="font-mono text-xs opacity-70 bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{tx.txHash}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right w-full md:w-auto mt-4 md:mt-0 flex items-center justify-between md:block">
                  <span className="md:hidden text-sm font-medium text-slate-500">Amount</span>
                  <div>
                    <div className="font-bold text-emerald-600 text-xl font-mono tracking-tight">{tx.value}</div>
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">Success</span>
                    </div>
                  </div>
                </div>
                
                <div className="hidden md:block opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ml-8">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-indigo-50 text-indigo-600">
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl flex justify-center">
            <Button variant="ghost" className="text-slate-500 hover:text-indigo-600 text-sm font-medium">
              Load More History
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
