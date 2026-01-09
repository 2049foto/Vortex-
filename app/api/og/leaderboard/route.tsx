/**
 * Vortex Protocol - Leaderboard OG Image Generator
 * Creates shareable leaderboard images for Farcaster
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const period = searchParams.get('period') || 'weekly';
  const usersJson = searchParams.get('users') || '[]';
  const userRank = searchParams.get('userRank');
  const userDust = searchParams.get('userDust');

  let users: Array<{ rank: number; address: string; dustCleaned: number; xp: number }> = [];
  try {
    users = JSON.parse(usersJson);
  } catch {
    users = [];
  }

  // Mock data if empty
  if (users.length === 0) {
    users = [
      { rank: 1, address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', dustCleaned: 1234.56, xp: 12500 },
      { rank: 2, address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', dustCleaned: 987.34, xp: 9800 },
      { rank: 3, address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', dustCleaned: 756.21, xp: 7500 },
      { rank: 4, address: '0x6B175474E89094C44Da98b954EesddFFD44564789', dustCleaned: 543.12, xp: 5400 },
      { rank: 5, address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', dustCleaned: 321.09, xp: 3200 },
    ];
  }

  const periodLabel = period === 'weekly' ? '🗓️ This Week' : period === 'monthly' ? '📅 This Month' : '🏆 All Time';
  const medals = ['🥇', '🥈', '🥉', '4', '5'];

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
            <span style={{ fontSize: '36px' }}>🏆</span>
            <span style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold' }}>Top Dust Cleaners</span>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            borderRadius: '20px',
            padding: '8px 20px',
            color: '#fff',
            fontSize: '18px',
            fontWeight: 'bold',
          }}>
            {periodLabel}
          </div>
        </div>

        {/* Leaderboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {users.slice(0, 5).map((user, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: index === 0 
                  ? 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,215,0,0.05))'
                  : 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '16px 20px',
                border: index === 0 ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <span style={{ 
                fontSize: index < 3 ? '32px' : '24px', 
                marginRight: '16px',
                minWidth: '40px',
                textAlign: 'center',
              }}>
                {medals[index]}
              </span>
              <span style={{ 
                color: '#94A3B8', 
                fontSize: '18px',
                flex: 1,
              }}>
                {`${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
              </span>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <span style={{ color: '#A5B4FC', fontSize: '16px' }}>
                  🧹 ${user.dustCleaned.toFixed(2)}
                </span>
                <span style={{ 
                  color: '#22C55E', 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                }}>
                  {user.xp.toLocaleString()} XP
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* User Rank */}
        {userRank && (
          <div style={{
            marginTop: '20px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid rgba(139,92,246,0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ color: '#A5B4FC', fontSize: '18px' }}>Your Rank</span>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>#{userRank}</span>
              {userDust && (
                <span style={{ color: '#94A3B8', fontSize: '16px' }}>${userDust} cleaned</span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#64748B',
          fontSize: '14px',
        }}>
          vortex-protocol.vercel.app • Join the challenge!
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
