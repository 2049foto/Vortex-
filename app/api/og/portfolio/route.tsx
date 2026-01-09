/**
 * Vortex Protocol - Portfolio OG Image Generator
 * Creates shareable portfolio summary images for Farcaster
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const wallet = searchParams.get('wallet') || '0x...';
  const total = searchParams.get('total') || '0';
  const dust = searchParams.get('dust') || '0';
  const tokens = searchParams.get('tokens') || '0';
  const chains = searchParams.get('chains') || '0';
  const risk = parseInt(searchParams.get('risk') || '0');

  // Truncate wallet address
  const shortWallet = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  
  // Risk color
  const riskColor = risk < 30 ? '#22C55E' : risk < 60 ? '#F59E0B' : '#EF4444';
  const riskLabel = risk < 30 ? 'SAFE' : risk < 60 ? 'CAUTION' : 'HIGH RISK';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
          padding: '40px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '28px' }}>🌀</span>
            </div>
            <span style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold' }}>VORTEX</span>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding: '8px 16px',
            color: '#94A3B8',
            fontSize: '18px',
          }}>
            {shortWallet}
          </div>
        </div>

        {/* Main Stats */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          {/* Total Value */}
          <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ color: '#94A3B8', fontSize: '16px', marginBottom: '8px' }}>Total Portfolio</div>
            <div style={{ color: '#fff', fontSize: '42px', fontWeight: 'bold' }}>${total}</div>
          </div>

          {/* Dust Value */}
          <div style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(139,92,246,0.3)',
          }}>
            <div style={{ color: '#A5B4FC', fontSize: '16px', marginBottom: '8px' }}>🧹 Dust Detected</div>
            <div style={{ color: '#fff', fontSize: '42px', fontWeight: 'bold' }}>${dust}</div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Tokens */}
          <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: '#94A3B8', fontSize: '16px' }}>Tokens</span>
            <span style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>{tokens}</span>
          </div>

          {/* Chains */}
          <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: '#94A3B8', fontSize: '16px' }}>Chains</span>
            <span style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>{chains}</span>
          </div>

          {/* Risk Score */}
          <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: '#94A3B8', fontSize: '16px' }}>Security</span>
            <span style={{ color: riskColor, fontSize: '18px', fontWeight: 'bold' }}>{riskLabel}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#64748B',
          fontSize: '14px',
        }}>
          vortex-protocol.vercel.app • Scan your wallet for free
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
