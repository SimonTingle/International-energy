/**
 * GET /api/disruptions
 *
 * Returns live maritime disruption data from free sources:
 *  - Nitter RSS (Twitter mirror for @WindwardAI, @MarineTraffic, @Portwatch_IMF)
 *  - MARAD official US Maritime Administration advisories
 *  - gCaptain maritime news RSS
 *  - MarineTraffic blog RSS
 *  - Lloyd's List free RSS
 *
 * No Twitter/X API key required.
 */

import { fetchAllDisruptions } from '@/lib/fuel/maritime';

export const revalidate = 3600; // 1 hour

export async function GET() {
  const data = await fetchAllDisruptions();
  return Response.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
  });
}
