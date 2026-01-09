/**
 * Vortex Protocol - Frame Intro OG Image
 * Dynamic image generation for Farcaster Frames
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
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
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)',
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
              background: 'radial-gradient(circle at 30% 20%, rgba(139, 92, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
            }}
          />

          {/* Logo Circle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 120,
              height: 120,
              borderRadius: 30,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)',
              marginBottom: 40,
            }}
          >
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
            </svg>
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <h1
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: 'white',
                margin: 0,
                letterSpacing: '-0.03em',
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              Vortex Protocol
            </h1>
            <p
              style={{
                fontSize: 28,
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                fontWeight: 500,
              }}
            >
              Clean Your Wallet, Zero Gas Fees
            </p>
          </div>

          {/* Features */}
          <div
            style={{
              display: 'flex',
              gap: 32,
              marginTop: 48,
            }}
          >
            {[
              { icon: '🔍', text: '10 Chains' },
              { icon: '🛡️', text: '20-Layer Risk' },
              { icon: '⚡', text: 'Gasless' },
              { icon: '🏆', text: 'Earn XP' },
            ].map((feature, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 16,
                  padding: '12px 24px',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <span style={{ fontSize: 24 }}>{feature.icon}</span>
                <span
                  style={{
                    fontSize: 20,
                    color: 'white',
                    fontWeight: 600,
                  }}
                >
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* Built on Base */}
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
                background: '#0052FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>B</span>
            </div>
            <span
              style={{
                fontSize: 18,
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500,
              }}
            >
              Built on Base
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
