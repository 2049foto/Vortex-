/**
 * Vortex Protocol - Farcaster Frame Route (Next.js)
 * Proxies to backend frame handler
 */

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  // Return initial frame HTML
  const frameHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_APP_URL}/api/og/frame-intro" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="fc:frame:button:1" content="🔍 Scan Wallet" />
    <meta property="fc:frame:button:1:action" content="post" />
    <meta property="fc:frame:button:2" content="Open App" />
    <meta property="fc:frame:button:2:action" content="link" />
    <meta property="fc:frame:button:2:target" content="${process.env.NEXT_PUBLIC_APP_URL}" />
    <meta property="fc:frame:input:text" content="Enter wallet address (0x...)" />
    <meta property="og:image" content="${process.env.NEXT_PUBLIC_APP_URL}/og-image.png" />
    <meta property="og:title" content="Vortex Protocol - Portfolio Hygiene" />
    <meta property="og:description" content="Clean your crypto portfolio, gasless." />
    <title>Vortex Protocol Frame</title>
  </head>
  <body>
    <h1>Vortex Protocol</h1>
    <p>Premium Portfolio Hygiene Engine</p>
    <p>Scan your wallet to find dust and risky tokens.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}">Open App</a>
  </body>
</html>`;

  return new NextResponse(frameHtml, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward to backend frame handler
    const response = await fetch(`${API_URL}/api/frame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const html = await response.text();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Frame handler error:', error);
    
    const errorHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_APP_URL}/api/og/error" />
    <meta property="fc:frame:button:1" content="Try Again" />
    <meta property="fc:frame:button:1:action" content="post" />
    <title>Error</title>
  </head>
  <body>
    <h1>Error</h1>
    <p>Something went wrong. Please try again.</p>
  </body>
</html>`;

    return new NextResponse(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}

