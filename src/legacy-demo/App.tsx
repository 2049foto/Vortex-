import React, { useState } from 'react';
import { HashRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/navbar';
import LandingPage from '@/pages/landing';
import DashboardPage from '@/pages/dashboard';
import ScanPage from '@/pages/scan';
import ConsolidatePage from '@/pages/consolidate';
import HistoryPage from '@/pages/history';

// Global Styles for Custom Animations and Theme
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;300;400;500;600;700;800;900&display=swap');
    @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');

    :root {
      /* Base Colors - Safe, Secure, Premium */
      --background: 210 40% 98%; /* Light Cool Gray */
      --foreground: 222 47% 11%; /* Deep Navy */
      
      /* Primary - Trustworthy Indigo */
      --primary: 245 80% 60%;
      --primary-foreground: 0 0% 100%;
      
      /* Secondary - Professional Gunmetal */
      --secondary: 215 25% 95%;
      --secondary-foreground: 222 47% 11%;
      
      /* Accent - Secure Emerald */
      --accent: 150 60% 45%;
      --accent-foreground: 0 0% 100%;
      
      /* Destructive - Alert Red */
      --destructive: 0 84% 60%;
      --destructive-foreground: 0 0% 100%;
      
      /* Muted - Subtle Text */
      --muted: 215 16% 47%;
      --muted-foreground: 215 16% 47%;
      
      /* Card & Popover */
      --card: 0 0% 100%;
      --card-foreground: 222 47% 11%;
      --popover: 0 0% 100%;
      --popover-foreground: 222 47% 11%;
      
      /* Borders & Rings */
      --border: 214 32% 91%;
      --input: 214 32% 91%;
      --ring: 245 80% 60%;
      
      /* Radius */
      --radius: 1rem;
    }

    body {
      background-color: hsl(var(--background));
      color: hsl(var(--foreground));
      font-family: 'Outfit', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: 'Clash Display', sans-serif;
      letter-spacing: -0.02em;
    }

    /* Custom Scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: hsl(var(--muted) / 0.3);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: hsl(var(--muted) / 0.5);
    }

    /* Animations */
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    @keyframes gradient-x {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    
    .animate-gradient-x {
      background-size: 200% 200%;
      animation: gradient-x 8s ease infinite;
    }

    .animate-float {
      animation: float 6s ease-in-out infinite;
    }
  `}</style>
);

// Layout wrapper to handle common UI
function Layout({ isConnected, onConnect }: { isConnected: boolean; onConnect: () => void }) {
  return (
    <div className="min-h-screen font-sans bg-background text-foreground relative selection:bg-primary/20 selection:text-primary">
      <GlobalStyles />
      <Navbar isConnected={isConnected} onConnect={onConnect} address="0x1234...5678" />
      <main className="relative z-0">
        <Outlet />
      </main>
    </div>
  );
}

// Protected Route wrapper
function ProtectedRoute({ isConnected, children }: { isConnected: boolean; children: React.ReactNode }) {
  if (!isConnected) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    setIsConnected(true);
  };

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout isConnected={isConnected} onConnect={handleConnect} />}>
          <Route path="/" element={<LandingPage onConnect={handleConnect} isConnected={isConnected} />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute isConnected={isConnected}>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/scan" element={
            <ProtectedRoute isConnected={isConnected}>
              <ScanPage />
            </ProtectedRoute>
          } />
          <Route path="/consolidate" element={
            <ProtectedRoute isConnected={isConnected}>
              <ConsolidatePage />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute isConnected={isConnected}>
              <HistoryPage />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </HashRouter>
  );
}
