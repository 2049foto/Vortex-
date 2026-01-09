/**
 * Vortex Protocol - Leaderboard Frame Handler
 * Interactive Farcaster Frame for leaderboard
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'weekly';
    
    // Get FID from frame message (if available)
    const fid = body?.untrustedData?.fid;
    
    // TODO: Fetch real leaderboard from database
    const mockUsers = [
      { rank: 1, address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', dustCleaned: 1234.56, xp: 12500 },
      { rank: 2, address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', dustCleaned: 987.34, xp: 9800 },
      { rank: 3, address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', dustCleaned: 756.21, xp: 7500 },
      { rank: 4, address: '0x6B175474E89094C44Da98b954EesddFFD44564789', dustCleaned: 543.12, xp: 5400 },
      { rank: 5, address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', dustCleaned: 321.09, xp: 3200 },
    ];

    const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vortexbase.vercel.app'}/api/og/leaderboard?` +
      new URLSearchParams({
        period,
        users: JSON.stringify(mockUsers),
      }).toString();

    const frameHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${imageUrl}" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  <meta property="fc:frame:button:1" content="📊 Weekly" />
  <meta property="fc:frame:button:1:action" content="post" />
  <meta property="fc:frame:button:1:target" content="${process.env.NEXT_PUBLIC_APP_URL}/api/frame/leaderboard?period=weekly" />
  <meta property="fc:frame:button:2" content="📈 Monthly" />
  <meta property="fc:frame:button:2:action" content="post" />
  <meta property="fc:frame:button:2:target" content="${process.env.NEXT_PUBLIC_APP_URL}/api/frame/leaderboard?period=monthly" />
  <meta property="fc:frame:button:3" content="🏆 All-Time" />
  <meta property="fc:frame:button:3:action" content="post" />
  <meta property="fc:frame:button:3:target" content="${process.env.NEXT_PUBLIC_APP_URL}/api/frame/leaderboard?period=all-time" />
  <meta property="fc:frame:button:4" content="🎯 Join Challenge" />
  <meta property="fc:frame:button:4:action" content="link" />
  <meta property="fc:frame:button:4:target" content="${process.env.NEXT_PUBLIC_APP_URL}/scan" />
</head>
<body>
  <h1>Vortex Leaderboard - ${period}</h1>
</body>
</html>`;

    return new NextResponse(frameHtml, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Leaderboard frame error:', error);
    return NextResponse.json({ error: 'Failed to generate frame' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
