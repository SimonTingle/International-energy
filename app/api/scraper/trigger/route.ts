/**
 * UI-facing scraper trigger endpoint
 * Called by the Refresh Data button in the browser.
 * Adds the CRON_SECRET server-side so it never needs to be exposed
 * to the client. NEXT_PUBLIC_* vars are baked at build time and are
 * unavailable when env vars are set at runtime (e.g. CapRover).
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || process.env.NEXT_PUBLIC_CRON_SECRET;

  // Build the internal URL to /api/scraper/run
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const scraperUrl = `${protocol}://${host}/api/scraper/run`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (cronSecret) {
    headers['authorization'] = `Bearer ${cronSecret}`;
  }

  try {
    const res = await fetch(scraperUrl, { method: 'POST', headers });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to reach scraper endpoint' },
      { status: 500 }
    );
  }
}
