import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ShieldCheck, Zap, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LandingProps {
  onConnect: () => void;
  isConnected: boolean;
}

export default function LandingPage({ onConnect, isConnected }: LandingProps) {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

  const handleCta = () => {
    if (isConnected) {
      navigate('/dashboard');
    } else {
      onConnect();
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
  };

  return (
    <div className="flex flex-col min-h-screen pt-24 overflow-hidden relative selection:bg-primary/20">
      
      {/* Premium Background */}
      <div className="fixed inset-0 -z-20 bg-background" />
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-background to-background" />
      
      {/* Mesh Gradients - Subtler & More Sophisticated */}
      <motion.div style={{ y: y1 }} className="fixed top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-indigo-100/30 to-purple-100/30 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 -z-10 opacity-60" />
      <motion.div style={{ y: y2 }} className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-t from-emerald-50/40 to-teal-50/40 blur-[120px] rounded-full -translate-x-1/3 translate-y-1/3 -z-10 opacity-60" />

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center pt-20 pb-40 px-4">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="text-center max-w-5xl mx-auto space-y-10"
        >
          {/* Badge */}
          <motion.div variants={item} className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/60 shadow-sm text-sm font-medium text-slate-600 ring-1 ring-black/5 hover:bg-white/80 transition-colors cursor-pointer group">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-display tracking-tight text-slate-800">Vortex Premium v2.0</span>
              <span className="w-px h-3 bg-slate-300 mx-1" />
              <span className="text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                Read Updates <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            variants={item}
            className="text-6xl md:text-8xl font-display font-bold tracking-tight leading-[1] md:leading-[0.9]"
          >
            <span className="text-slate-900 drop-shadow-sm">Portfolio Hygiene</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 animate-gradient-x pb-4">
              Reimagined
            </span>
          </motion.h1>

          <motion.p 
            variants={item}
            className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-light"
          >
            The premium engine to consolidate dust, analyze risks, and optimize your assets across <span className="font-medium text-slate-800">12+ chains</span> with bank-grade security.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="xl" variant="iridescent" onClick={handleCta} className="shadow-2xl shadow-indigo-500/25 w-full sm:w-auto hover:scale-105 transition-transform duration-300">
              {isConnected ? 'Launch Dashboard' : 'Connect Wallet'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="xl" variant="outline" className="w-full sm:w-auto border-2 hover:bg-white/60 bg-white/40 backdrop-blur-sm">
              Watch Demo
              <div className="ml-2 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">▶</div>
            </Button>
          </motion.div>

          {/* Trust Metrics */}
          <motion.div variants={item} className="pt-12 grid grid-cols-3 gap-8 md:gap-16 border-t border-slate-200/60 max-w-3xl mx-auto text-center">
            <div>
              <div className="text-3xl font-bold font-display text-slate-900">$45M+</div>
              <div className="text-sm text-slate-500 font-medium mt-1">Volume Cleaned</div>
            </div>
            <div>
              <div className="text-3xl font-bold font-display text-slate-900">120K+</div>
              <div className="text-sm text-slate-500 font-medium mt-1">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold font-display text-slate-900">Zero</div>
              <div className="text-sm text-slate-500 font-medium mt-1">Gas Fees</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-32 relative">
        <div className="container mx-auto max-w-7xl px-4">
           <div className="text-center mb-20">
             <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-slate-900">Everything you need,<br/>nothing you don't.</h2>
             <p className="text-lg text-slate-500 font-light">Built for the modern DeFi power user.</p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-8">
             <FeatureCard 
               icon={Layers}
               color="indigo"
               title="Intelligent Classification"
               description="Our 20-layer scoring engine automatically categorizes your assets into Legit, Dust, and Risk tiers."
             />
             <FeatureCard 
               icon={Zap}
               color="amber"
               title="Gasless Consolidation"
               description="Sweep hundreds of dust tokens into ETH or USDC in a single transaction, fully sponsored by our paymasters."
             />
             <FeatureCard 
               icon={ShieldCheck}
               color="emerald"
               title="Deep Risk Analysis"
               description="Every contract is audited in real-time. We flag honeypots, rugs, and malicious approvals before you interact."
             />
           </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color }: { icon: any, title: string, description: string, color: string }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
    amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white",
    emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
  };

  return (
    <Card variant="glass" className="group overflow-hidden relative hover:border-transparent transition-all duration-500">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-${color}-50/50 to-white -z-10`} />
      
      <CardContent className="p-10 space-y-6">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${colors[color as keyof typeof colors]}`}>
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-2xl font-bold font-display mb-3 text-slate-900">{title}</h3>
          <p className="text-muted-foreground leading-relaxed text-lg font-light">
            {description}
          </p>
        </div>
        
        <div className="pt-4 flex items-center text-sm font-bold text-slate-900 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          Learn more <ArrowRight className="w-4 h-4 ml-2" />
        </div>
      </CardContent>
    </Card>
  );
}
