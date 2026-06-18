/**
 * GET /api/vessels
 *
 * Returns live vessel positions from AISStream in key energy shipping lanes.
 * Used for map visualization of real-time maritime traffic.
 */

import { fetchAllVessels } from '@/lib/fuel/maritime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const vessels = await fetchAllVessels();
  return Response.json(
    {
      vessels,
      count: vessels.length,
      fetchedAt: new Date().toISOString(),
    },
    {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    }
  );
}
