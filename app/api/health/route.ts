/**
 * GET /api/health
 * Railway.app health check endpoint
 */
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
    env: {
      has_eia_key: Boolean(process.env.EIA_API_KEY),
      has_aisstream_key: Boolean(process.env.AISSTREAM_API_KEY),
      has_db: Boolean(process.env.DATABASE_URL),
      node_env: process.env.NODE_ENV,
    },
  });
}
