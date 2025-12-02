import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}));
    console.log('Received Farcaster webhook', payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook handler error', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

