/**
 * Vortex Protocol - Farcaster Frame V2 Route
 * Main entry point for viral Farcaster integration
 * Features: Wallet scanning, leaderboard, challenges
 * Updated: Jan 9, 2026 - Optimized for virality
 */

import { NextRequest, NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dust-sweeper-yrjq.vercel.app';

export async function GET(request: NextRequest) {
  // Return initial frame HTML with enhanced viral features
  const frameHtml = `<!DOCTYPE html>
<html>
  <head>
    <!-- Farcaster Frame V2 -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${APP_URL}/api/og/frame-intro" />
    <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    
    <!-- Buttons -->
    <meta property="fc:frame:button:1" content="🔍 Scan My Wallet" />
    <meta property="fc:frame:button:1:action" content="post" />
    <meta property="fc:frame:button:1:target" content="${APP_URL}/api/frame/scan" />
    
    <meta property="fc:frame:button:2" content="🏆 Leaderboard" />
    <meta property="fc:frame:button:2:action" content="post" />
    <meta property="fc:frame:button:2:target" content="${APP_URL}/api/frame/leaderboard" />
    
    <meta property="fc:frame:button:3" content="🎯 Weekly Challenge" />
    <meta property="fc:frame:button:3:action" content="link" />
    <meta property="fc:frame:button:3:target" content="${APP_URL}/scan?challenge=weekly" />
    
    <meta property="fc:frame:button:4" content="🌐 Open App" />
    <meta property="fc:frame:button:4:action" content="link" />
    <meta property="fc:frame:button:4:target" content="${APP_URL}" />
    
    <!-- Wallet Input -->
    <meta property="fc:frame:input:text" content="Enter wallet or base.eth name" />
    <meta property="fc:frame:post_url" content="${APP_URL}/api/frame/scan" />
    
    <!-- Open Graph -->
    <meta property="og:image" content="${APP_URL}/api/og/frame-intro" />
    <meta property="og:title" content="Vortex Protocol 🌀 Clean Your Crypto Dust" />
    <meta property="og:description" content="Find and clean dust tokens across 10 chains. Gasless on Base. Free forever." />
    <meta property="og:url" content="${APP_URL}" />
    <meta property="og:type" content="website" />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Vortex Protocol - Portfolio Hygiene" />
    <meta name="twitter:description" content="Scan your wallet. Find dust. Clean gaslessly." />
    <meta name="twitter:image" content="${APP_URL}/api/og/frame-intro" />
    
    <title>Vortex Protocol - Crypto Dust Cleaner</title>
    
    <!-- Theme Color -->
    <meta name="theme-color" content="#6366F1" />
  </head>
  <body style="font-family: system-ui; background: #0F172A; color: #fff; padding: 40px; text-align: center;">
    <h1>🌀 Vortex Protocol</h1>
    <p style="font-size: 18px; color: #94A3B8;">Premium Portfolio Hygiene Engine</p>
    <ul style="text-align: left; max-width: 400px; margin: 20px auto; color: #A5B4FC;">
      <li>🔍 Scan wallets across 10 chains</li>
      <li>🧹 Clean dust tokens in one click</li>
      <li>⛽ Gasless swaps on Base</li>
      <li>🛡️ 20-layer risk analysis</li>
      <li>🏆 Weekly challenges & leaderboard</li>
    </ul>
    <a href="${APP_URL}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: #fff; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 20px;">Launch App →</a>
  </body>
</html>`;

  return new NextResponse(frameHtml, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=300', // Cache for 5 mins
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { untrustedData } = body;
    const inputText = untrustedData?.inputText;
    const buttonIndex = untrustedData?.buttonIndex;

    // Handle button clicks
    if (buttonIndex === 2) {
      // Leaderboard button
      return Response.redirect(`${APP_URL}/api/frame/leaderboard`, 302);
    }

    // If user provided input (wallet address or base name)
    if (inputText) {
      // Resolve Base Name if needed
      let walletAddress = inputText.trim();
      
      if (inputText.endsWith('.base.eth') || inputText.endsWith('.eth')) {
        // TODO: Resolve ENS/Base name
        // For now, redirect to app with name
        return Response.redirect(`${APP_URL}/scan?name=${encodeURIComponent(inputText)}`, 302);
      }
      
      // Validate wallet address
      if (/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        // Redirect to scan frame handler
        return Response.redirect(`${APP_URL}/api/frame/scan?wallet=${walletAddress}`, 302);
      }
    }

    // Default: Show scan prompt again
    return Response.redirect(`${APP_URL}/api/frame/scan`, 302);
  } catch (error) {
    console.error('Frame handler error:', error);
    
    const errorHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${APP_URL}/api/og/error?message=Something%20went%20wrong" />
    <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    <meta property="fc:frame:button:1" content="🔄 Try Again" />
    <meta property="fc:frame:button:1:action" content="post" />
    <meta property="fc:frame:button:1:target" content="${APP_URL}/frame" />
    <meta property="fc:frame:button:2" content="🌐 Open App" />
    <meta property="fc:frame:button:2:action" content="link" />
    <meta property="fc:frame:button:2:target" content="${APP_URL}" />
    <title>Error - Vortex</title>
  </head>
  <body>
    <h1>Error</h1>
    <p>Something went wrong. Please try again.</p>
  </body>
</html>`;

    return new NextResponse(errorHtml, {
      status: 200, // Return 200 even for errors in frames
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}

