/**
 * Vortex Protocol - Success OG Image
 * Share image after successful consolidation
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokens = searchParams.get('tokens') || '0';
  const value = searchParams.get('value') || '0';
  const output = searchParams.get('output') || 'ETH';

  try {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #10b981 100%)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 20%, rgba(52, 211, 153, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(16, 185, 129, 0.3) 0%, transparent 50%)',
            }}
          />

          {/* Success Icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 120,
              height: 120,
              borderRadius: 30,
              background: 'rgba(255, 255, 255, 0.2)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              marginBottom: 40,
            }}
          >
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: 'white',
              margin: 0,
              marginBottom: 16,
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            }}
          >
            Portfolio Cleaned! ✨
          </h1>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              gap: 48,
              marginTop: 32,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 20,
                padding: '24px 40px',
              }}
            >
              <span style={{ fontSize: 48, fontWeight: 700, color: 'white' }}>
                {tokens}
              </span>
              <span style={{ fontSize: 20, color: 'rgba(255, 255, 255, 0.8)' }}>
                Tokens Cleaned
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 20,
                padding: '24px 40px',
              }}
            >
              <span style={{ fontSize: 48, fontWeight: 700, color: 'white' }}>
                ${value}
              </span>
              <span style={{ fontSize: 20, color: 'rgba(255, 255, 255, 0.8)' }}>
                Consolidated to {output}
              </span>
            </div>
          </div>

          {/* CTA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 48,
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 16,
              padding: '16px 32px',
            }}
          >
            <span style={{ fontSize: 24, color: 'white', fontWeight: 600 }}>
              Try Vortex Protocol →
            </span>
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>V</span>
            </div>
            <span
              style={{
                fontSize: 18,
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500,
              }}
            >
              vortex.build • Built on Base
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG Image generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
