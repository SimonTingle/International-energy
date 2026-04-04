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

export const revalidate = 900; // 15 min

export async function GET() {
  const data = await fetchAllDisruptions();
  return Response.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' },
  });
}
