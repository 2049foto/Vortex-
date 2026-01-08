/**
 * Vortex Protocol - Error OG Image
 * Error state image for Farcaster Frames
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
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* Error Icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 100,
              height: 100,
              borderRadius: 25,
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: '0 20px 40px rgba(239, 68, 68, 0.3)',
              marginBottom: 40,
            }}
          >
            <svg
              width="50"
              height="50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: 'white',
              margin: 0,
              marginBottom: 16,
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              fontSize: 24,
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0,
            }}
          >
            Please try again
          </p>

          {/* Vortex Logo */}
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
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: 500,
              }}
            >
              Vortex Protocol
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
