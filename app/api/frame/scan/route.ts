/**
 * Vortex Protocol - Scan Frame Handler
 * Main entry point for Farcaster Frame interactions
 * Supports Frame V2 with wallet input
 */

import { NextRequest, NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dust-sweeper-yrjq.vercel.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract data from frame message
    const { untrustedData, trustedData } = body;
    const fid = untrustedData?.fid;
    const buttonIndex = untrustedData?.buttonIndex;
    const inputText = untrustedData?.inputText;
    const castId = untrustedData?.castId;
    
    // If user provided wallet address in input
    if (inputText && /^0x[a-fA-F0-9]{40}$/.test(inputText)) {
      // Redirect to scan with wallet
      return generateScanResultFrame(inputText, fid);
    }
    
    // If connected wallet available
    if (untrustedData?.address) {
      return generateScanResultFrame(untrustedData.address, fid);
    }
    
    // Default: Show scan prompt frame
    return generateScanPromptFrame();
  } catch (error) {
    console.error('Scan frame error:', error);
    return generateErrorFrame('Failed to process request');
  }
}

export async function GET(request: NextRequest) {
  return generateScanPromptFrame();
}

function generateScanPromptFrame() {
  const imageUrl = `${APP_URL}/api/og/frame-intro`;
  
  const frameHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${imageUrl}" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  <meta property="fc:frame:input:text" content="Enter wallet address (0x...)" />
  <meta property="fc:frame:button:1" content="🔍 Scan Wallet" />
  <meta property="fc:frame:button:1:action" content="post" />
  <meta property="fc:frame:button:1:target" content="${APP_URL}/api/frame/scan" />
  <meta property="fc:frame:button:2" content="🏆 Leaderboard" />
  <meta property="fc:frame:button:2:action" content="post" />
  <meta property="fc:frame:button:2:target" content="${APP_URL}/api/frame/leaderboard" />
  <meta property="fc:frame:button:3" content="🌐 Open App" />
  <meta property="fc:frame:button:3:action" content="link" />
  <meta property="fc:frame:button:3:target" content="${APP_URL}" />
</head>
<body>
  <h1>Vortex Protocol - Dust Sweeper</h1>
  <p>Scan your wallet to find and clean dust tokens across 10 chains!</p>
</body>
</html>`;

  return new NextResponse(frameHtml, {
    headers: { 'Content-Type': 'text/html' },
  });
}

async function generateScanResultFrame(walletAddress: string, fid?: number) {
  // TODO: Actually scan the wallet and get real data
  // For now, return a mock result that links to the full app
  
  const shortWallet = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  
  // Mock data - in production, this would call the scan API
  const mockData = {
    wallet: walletAddress,
    total: '1,234.56',
    dust: '45.67',
    tokens: '23',
    chains: '8',
    risk: '15',
  };
  
  const imageUrl = `${APP_URL}/api/og/portfolio?` + 
    new URLSearchParams({
      wallet: walletAddress,
      total: mockData.total,
      dust: mockData.dust,
      tokens: mockData.tokens,
      chains: mockData.chains,
      risk: mockData.risk,
    }).toString();
  
  const shareText = encodeURIComponent(`🔍 Just scanned my wallet with @vortex\n\n💰 ${mockData.tokens} tokens across ${mockData.chains} chains\n🧹 $${mockData.dust} dust detected\n\nScan yours 👇`);
  const shareUrl = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${APP_URL}/scan`;
  
  const frameHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${imageUrl}" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  <meta property="fc:frame:button:1" content="🧹 Clean Dust" />
  <meta property="fc:frame:button:1:action" content="link" />
  <meta property="fc:frame:button:1:target" content="${APP_URL}/scan?wallet=${walletAddress}" />
  <meta property="fc:frame:button:2" content="📢 Share Results" />
  <meta property="fc:frame:button:2:action" content="link" />
  <meta property="fc:frame:button:2:target" content="${shareUrl}" />
  <meta property="fc:frame:button:3" content="🔄 Scan Another" />
  <meta property="fc:frame:button:3:action" content="post" />
  <meta property="fc:frame:button:3:target" content="${APP_URL}/api/frame/scan" />
</head>
<body>
  <h1>Scan Results for ${shortWallet}</h1>
</body>
</html>`;

  return new NextResponse(frameHtml, {
    headers: { 'Content-Type': 'text/html' },
  });
}

function generateErrorFrame(message: string) {
  const imageUrl = `${APP_URL}/api/og/error?message=${encodeURIComponent(message)}`;
  
  const frameHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${imageUrl}" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  <meta property="fc:frame:button:1" content="🔄 Try Again" />
  <meta property="fc:frame:button:1:action" content="post" />
  <meta property="fc:frame:button:1:target" content="${APP_URL}/api/frame/scan" />
  <meta property="fc:frame:button:2" content="🌐 Open App" />
  <meta property="fc:frame:button:2:action" content="link" />
  <meta property="fc:frame:button:2:target" content="${APP_URL}" />
</head>
<body>
  <h1>Error</h1>
  <p>${message}</p>
</body>
</html>`;

  return new NextResponse(frameHtml, {
    headers: { 'Content-Type': 'text/html' },
  });
}
