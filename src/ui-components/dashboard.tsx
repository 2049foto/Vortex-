import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ScanLine, ArrowRight, TrendingUp, ShieldCheck, Coins, PieChart, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
  address?: string;
  history?: any;
  isLoading?: boolean;
  error?: string | null;
  onNavigate?: (path: string) => void;
}

export function Dashboard({ address, history, isLoading, error, onNavigate }: DashboardProps) {

  // Mock user stats
  const stats = [
    { label: "Net Worth", value: "$4,245.50", icon: Coins, color: "text-indigo-600 bg-indigo-50", trend: "+12.5%" },
    { label: "Dust Value", value: "$42.15", icon: Sparkles, color: "text-amber-600 bg-amber-50", trend: "Cleanable" },
    { label: "Risk Score", value: "98/100", icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50", trend: "Safe" },
    { label: "Gas Saved", value: "$125.00", icon: TrendingUp, color: "text-pink-600 bg-pink-50", trend: "Lifetime" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="container mx-auto px-4 pt-32 pb-12 max-w-7xl space-y-10"
    >
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/30 to-transparent -z-10" />

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.h1 variants={item} className="text-4xl md:text-5xl font-display font-bold tracking-tight text-slate-900">Dashboard</motion.h1>
          <motion.p variants={item} className="text-lg text-slate-500 mt-2 font-light">Welcome back, <span className="text-indigo-600 font-semibold font-mono bg-indigo-50 px-2 py-0.5 rounded-md">0x123...4567</span></motion.p>
        </div>
        <motion.div variants={item}>
          <Button onClick={() => onNavigate && onNavigate('/scan')} variant="iridescent" size="lg" className="shadow-xl shadow-indigo-500/20" glow>
            <ScanLine className="w-5 h-5 mr-2" />
            Start New Scan
          </Button>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} variants={item}>
            <Card variant="glass" hover className="h-full border-white/60 bg-white/60 backdrop-blur-md">
              <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-2xl ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-white border border-slate-100 text-xs font-bold text-slate-600 shadow-sm">
                    {stat.trend}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-bold tracking-tight font-display text-slate-900">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Action Area */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card variant="premium" className="h-full border-white/50">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100/50 pb-6">
              <div>
                <CardTitle>Portfolio Health</CardTitle>
                <CardDescription>Asset distribution across 12 chains.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
                <Activity className="w-5 h-5 text-slate-400" />
              </Button>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="h-[250px] w-full bg-gradient-to-b from-slate-50 to-white rounded-3xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-inner">
                 <div className="flex flex-col items-center gap-3">
                   <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                      <PieChart className="w-8 h-8 opacity-40" />
                   </div>
                   <span className="text-sm font-medium">Visualization Placeholder</span>
                 </div>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-6">
                <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-100/60">
                  <div className="text-3xl font-bold text-emerald-600 font-display">85%</div>
                  <div className="text-sm font-medium text-emerald-800/60 mt-1">Legit Assets</div>
                </div>
                <div className="p-5 rounded-3xl bg-amber-50/50 border border-amber-100/60">
                  <div className="text-3xl font-bold text-amber-500 font-display">12%</div>
                  <div className="text-sm font-medium text-amber-800/60 mt-1">Dust</div>
                </div>
                <div className="p-5 rounded-3xl bg-red-50/50 border border-red-100/60">
                  <div className="text-3xl font-bold text-red-500 font-display">3%</div>
                  <div className="text-sm font-medium text-red-800/60 mt-1">Risk</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item} className="space-y-6">
           <Card variant="mesh" className="text-white border-none shadow-2xl shadow-indigo-500/20 bg-indigo-600 overflow-hidden">
             <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-gradient-to-br from-white/20 to-transparent blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
             <CardHeader>
               <CardTitle className="text-white !bg-none">Clean Dust</CardTitle>
               <CardDescription className="text-indigo-100">Found 12 tokens worth $42.15</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="mb-6 flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-indigo-600 bg-indigo-800" />
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-600 bg-indigo-900 flex items-center justify-center text-[10px] font-bold">+8</div>
               </div>
               <Button variant="secondary" size="lg" className="w-full text-indigo-600 font-bold bg-white hover:bg-indigo-50 border-none shadow-lg" onClick={() => onNavigate && onNavigate('/scan')}>
                 Review & Clean
                 <ArrowRight className="w-4 h-4 ml-2" />
               </Button>
             </CardContent>
           </Card>

           <Card variant="glass" className="border-white/50">
             <CardHeader className="pb-4">
               <CardTitle className="text-lg">Recent History</CardTitle>
             </CardHeader>
             <CardContent className="space-y-1">
               {[1,2,3].map((_, i) => (
                 <div key={i} className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                       <Sparkles className="w-4 h-4 text-indigo-600" />
                     </div>
                     <div>
                       <div className="font-bold text-sm text-slate-900">Consolidation</div>
                       <div className="text-xs text-slate-500">2 days ago</div>
                     </div>
                   </div>
                   <div className="font-bold text-emerald-600 text-sm font-mono">+$12.45</div>
                 </div>
               ))}
               <Button variant="ghost" className="w-full mt-2 text-slate-500 hover:text-indigo-600" onClick={() => onNavigate && onNavigate('/history')}>
                 View All Activity
               </Button>
             </CardContent>
           </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
