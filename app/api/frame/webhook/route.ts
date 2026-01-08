/**
 * Vortex Protocol - Farcaster Frame Webhook
 * Handles notifications and Mini App events
 */

import { NextRequest, NextResponse } from 'next/server';

// Store notification details (in production, use database)
const notificationStore = new Map<string, {
  fid: number;
  token: string;
  url: string;
}>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, fid, notificationDetails } = body;

    console.log('Farcaster webhook event:', event, fid);

    switch (event) {
      case 'frame_added':
        // User added the Mini App
        if (notificationDetails) {
          notificationStore.set(fid.toString(), {
            fid,
            token: notificationDetails.token,
            url: notificationDetails.url,
          });
          console.log(`User ${fid} added Vortex Mini App`);
        }
        break;

      case 'frame_removed':
        // User removed the Mini App
        notificationStore.delete(fid.toString());
        console.log(`User ${fid} removed Vortex Mini App`);
        break;

      case 'notifications_enabled':
        // User enabled notifications
        if (notificationDetails) {
          const existing = notificationStore.get(fid.toString());
          if (existing) {
            notificationStore.set(fid.toString(), {
              ...existing,
              token: notificationDetails.token,
              url: notificationDetails.url,
            });
          }
          console.log(`User ${fid} enabled notifications`);
        }
        break;

      case 'notifications_disabled':
        // User disabled notifications
        const entry = notificationStore.get(fid.toString());
        if (entry) {
          notificationStore.set(fid.toString(), {
            ...entry,
            token: '',
            url: '',
          });
        }
        console.log(`User ${fid} disabled notifications`);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Helper function to send notification (not exported)
async function sendNotificationInternal(
  fid: number,
  title: string,
  body: string,
  targetUrl?: string
) {
  const entry = notificationStore.get(fid.toString());
  if (!entry || !entry.token || !entry.url) {
    console.log(`No notification token for user ${fid}`);
    return false;
  }

  try {
    const response = await fetch(entry.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${entry.token}`,
      },
      body: JSON.stringify({
        notificationId: `vortex-${Date.now()}`,
        title,
        body,
        targetUrl: targetUrl || 'https://vortex.build',
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
}

// GET endpoint to send a notification (for internal use)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get('fid');
  const title = searchParams.get('title');
  const body = searchParams.get('body');
  
  if (!fid || !title || !body) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const success = await sendNotificationInternal(parseInt(fid), title, body);
  return NextResponse.json({ success });
}

