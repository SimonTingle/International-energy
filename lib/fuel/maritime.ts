/**
 * Maritime disruption data
 *
 * Sources in fallback order:
 *  0. AISStream (primary)  – real-time AIS vessel data, requires AISSTREAM_API_KEY
 *  1. Nitter RSS           – public Nitter instances mirror @WindwardAI tweets as RSS
 *  2. MARAD               – US Maritime Administration official advisories (XML/HTML)
 *  3. gCaptain            – Authoritative maritime news RSS feed (completely free)
 *  4. MarineTraffic blog RSS
 *  5. Lloyd's List RSS (public entries)
 */

import WS from 'ws';

export interface DisruptionPost {
  title: string;
  summary: string;
  link: string;
  pubDate: string;
  source: string;
  tags: string[];
}

// --- Source 0: AISStream real-time AIS data ----------------------------------

const AISSTREAM_WS = 'wss://stream.aisstream.io/v0/stream';

// Bounding boxes [MinLat, MinLon, MaxLat, MaxLon] for key energy shipping lanes
const ENERGY_BOXES: [[number, number], [number, number]][] = [
  [[21.0, 55.0], [27.0, 61.0]],   // Persian Gulf & Strait of Hormuz
  [[11.0, 32.0], [30.0, 43.5]],   // Red Sea & Bab-el-Mandeb
  [[29.0, 32.0], [32.0, 33.5]],   // Suez Canal
  [[1.0,  99.0], [6.0,  104.5]],  // Strait of Malacca
];

const NAV_STATUS_LABEL: Record<number, string> = {
  0: 'Under Way (Engine)',
  1: 'At Anchor',
  2: 'Not Under Command',
  3: 'Restricted Manoeuvrability',
  4: 'Constrained by Draught',
  5: 'Moored',
  6: 'Aground',
  7: 'Engaged in Fishing',
  8: 'Under Way (Sailing)',
  15: 'Unknown',
};

interface AISVessel {
  mmsi: number;
  name: string;
  lat: number;
  lon: number;
  navStatus: number;
  sog: number;
  time: string;
  heading: number;
}

function regionLabel(lat: number, lon: number): string {
  if (lat >= 25.5 && lat <= 26.7 && lon >= 56.0 && lon <= 57.5) return 'Strait of Hormuz';
  if (lat >= 21.0 && lat <= 27.0 && lon >= 55.0 && lon <= 61.0) return 'Persian Gulf';
  if (lat >= 11.5 && lat <= 13.5 && lon >= 42.5 && lon <= 44.5) return 'Bab-el-Mandeb';
  if (lat >= 29.0 && lat <= 32.0 && lon >= 32.0 && lon <= 33.5) return 'Suez Canal';
  if (lat >= 11.0 && lat <= 30.0 && lon >= 32.0 && lon <= 43.5) return 'Red Sea';
  if (lat >= 1.0  && lat <= 6.0  && lon >= 99.0 && lon <= 104.5) return 'Strait of Malacca';
  return 'Unknown Region';
}

function parseAISTime(timeUtc: string): string {
  // AISStream time_utc: "2024-01-01 12:00:00.000000000 +0000 UTC"
  try {
    return new Date(timeUtc.replace(' +0000 UTC', 'Z').replace(' ', 'T')).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function regionTags(region: string): string[] {
  const tags: string[] = ['Oil/Fuel'];
  if (region.includes('Hormuz') || region.includes('Gulf')) tags.push('Gulf');
  if (region.includes('Suez') || region.includes('Red Sea') || region.includes('Bab')) tags.push('Red Sea / Suez');
  return tags;
}

function vesselsToDisruptions(vessels: AISVessel[]): DisruptionPost[] {
  const posts: DisruptionPost[] = [];

  // Tier 1: Individual posts for all noteworthy statuses (non-under-way)
  const noteworthy = vessels.filter(v => v.navStatus >= 1 && v.navStatus <= 6);
  for (const v of noteworthy) {
    const region = regionLabel(v.lat, v.lon);
    const statusLabel = NAV_STATUS_LABEL[v.navStatus] ?? 'Unknown';
    const name = v.name || `MMSI ${v.mmsi}`;
    const isCritical = v.navStatus === 2 || v.navStatus === 6;
    const emoji = isCritical ? '🚨' : '⚠️';
    const tags = isCritical ? ['Disruption', region] : regionTags(region);
    posts.push({
      title: `${emoji} ${name} — ${statusLabel} in ${region}`,
      summary: `Vessel ${name} (MMSI: ${v.mmsi}) reporting status "${statusLabel}" at ${v.lat.toFixed(3)}°, ${v.lon.toFixed(3)}°. Speed: ${v.sog.toFixed(1)} kn.`,
      link: `https://www.marinetraffic.com/en/ais/details/ships/mmsi:${v.mmsi}`,
      pubDate: v.time,
      source: 'AISStream (Real-time AIS)',
      tags,
    });
  }

  // Tier 2: Aggregate under-way vessels (status 0, 7, 8, 15) by region
  const normalByRegion = new Map<string, number>();
  for (const v of vessels) {
    if (v.navStatus >= 1 && v.navStatus <= 6) continue;
    const region = regionLabel(v.lat, v.lon);
    normalByRegion.set(region, (normalByRegion.get(region) ?? 0) + 1);
  }
  for (const [region, count] of normalByRegion) {
    const representative = vessels.find(v => regionLabel(v.lat, v.lon) === region);
    posts.push({
      title: `🚢 ${count} vessel${count !== 1 ? 's' : ''} under way — ${region}`,
      summary: `AIS data shows ${count} vessel${count !== 1 ? 's' : ''} actively transiting the ${region} area.`,
      link: representative
        ? `https://www.marinetraffic.com/en/ais/home/centerx:${representative.lon.toFixed(1)}/centery:${representative.lat.toFixed(1)}/zoom:8`
        : 'https://www.marinetraffic.com',
      pubDate: representative?.time ?? new Date().toISOString(),
      source: 'AISStream (Real-time AIS)',
      tags: regionTags(region),
    });
  }

  // Critical first, then warnings, then traffic summaries; cap at 30 AISStream posts
  const critical = posts.filter(p => p.title.startsWith('🚨'));
  const warnings = posts.filter(p => p.title.startsWith('⚠️'));
  const traffic  = posts.filter(p => p.title.startsWith('🚢'));
  return [...critical, ...warnings, ...traffic].slice(0, 30);
}

export async function fetchAISStreamDisruptions(): Promise<DisruptionPost[]> {
  const apiKey = process.env.AISSTREAM_API_KEY;
  if (!apiKey) {
    console.warn('[AISStream] AISSTREAM_API_KEY not set — skipping');
    return [];
  }
  console.log('[AISStream] Connecting to', AISSTREAM_WS);

  return new Promise((resolve) => {
    const vessels = new Map<number, AISVessel>();
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      ws.terminate();
      const posts = vesselsToDisruptions([...vessels.values()]);
      console.log(`[AISStream] Done — ${vessels.size} vessels → ${posts.length} posts`);
      resolve(posts);
    };

    const ws = new WS(AISSTREAM_WS);

    // Collect for 8 seconds then process
    const timer = setTimeout(finish, 20000); // 20s window — more vessels collected

    ws.on('open', () => {
      console.log('[AISStream] Connected — subscribing to', ENERGY_BOXES.length, 'bounding boxes');
      ws.send(JSON.stringify({
        APIKey: apiKey,
        BoundingBoxes: ENERGY_BOXES,
        FilterMessageTypes: ['PositionReport'],
      }));
    });

    ws.on('message', (data: WS.RawData) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.MessageType !== 'PositionReport') return;

        const meta = msg.MetaData;
        const report = msg.Message?.PositionReport;
        if (!meta || !report) return;

        const navStatus: number = report.NavigationalStatus ?? 15;
        const heading: number = report.Heading ?? report.CourseOverGround ?? 0;

        vessels.set(meta.MMSI, {
          mmsi: meta.MMSI,
          name: (meta.ShipName ?? '').trim(),
          lat: meta.latitude,
          lon: meta.longitude,
          navStatus,
          sog: report.Sog ?? 0,
          time: parseAISTime(meta.time_utc ?? ''),
          heading,
        });

        if (vessels.size % 10 === 0)
          console.log(`[AISStream] ${vessels.size} vessels received so far...`);
      } catch { /* ignore malformed messages */ }
    });

    ws.on('error', (err) => {
      console.error('[AISStream] WebSocket error:', err.message);
      clearTimeout(timer);
      finish();
    });
    ws.on('close', () => {
      console.log('[AISStream] Connection closed');
      clearTimeout(timer);
      finish();
    });
  });
}

export async function fetchAllVessels(): Promise<AISVessel[]> {
  const apiKey = process.env.AISSTREAM_API_KEY;
  if (!apiKey) {
    console.warn('[AISStream-Vessels] AISSTREAM_API_KEY not set — skipping');
    return [];
  }

  return new Promise((resolve) => {
    const vessels = new Map<number, AISVessel>();
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      ws.terminate();
      console.log(`[AISStream-Vessels] Done — ${vessels.size} vessels collected`);
      resolve([...vessels.values()]);
    };

    const ws = new WS(AISSTREAM_WS);
    const timer = setTimeout(finish, 20000); // 20s window — more vessels collected

    ws.on('open', () => {
      console.log('[AISStream-Vessels] Connected');
      ws.send(JSON.stringify({
        APIKey: apiKey,
        BoundingBoxes: ENERGY_BOXES,
        FilterMessageTypes: ['PositionReport'],
      }));
    });

    ws.on('message', (data: WS.RawData) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.MessageType !== 'PositionReport') return;

        const meta = msg.MetaData;
        const report = msg.Message?.PositionReport;
        if (!meta || !report) return;

        const navStatus: number = report.NavigationalStatus ?? 15;
        const heading: number = report.Heading ?? report.CourseOverGround ?? 0;

        vessels.set(meta.MMSI, {
          mmsi: meta.MMSI,
          name: (meta.ShipName ?? '').trim(),
          lat: meta.latitude,
          lon: meta.longitude,
          navStatus,
          sog: report.Sog ?? 0,
          time: parseAISTime(meta.time_utc ?? ''),
          heading,
        });
      } catch { /* ignore malformed messages */ }
    });

    ws.on('error', (err) => {
      console.error('[AISStream-Vessels] WebSocket error:', err.message);
      clearTimeout(timer);
      finish();
    });
    ws.on('close', () => {
      console.log('[AISStream-Vessels] Connection closed');
      clearTimeout(timer);
      finish();
    });
  });
}

// --- RSS / XML helpers -------------------------------------------------------

function xmlText(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return (m?.[1] ?? m?.[2] ?? '').trim();
}

function extractItems(xml: string): string[] {
  const items: string[] = [];
  const re = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) items.push(m[1]);
  return items;
}

function parseRSSItems(xml: string, sourceName: string): DisruptionPost[] {
  return extractItems(xml).map(item => {
    const title = xmlText(item, 'title');
    const description = xmlText(item, 'description');
    const link = xmlText(item, 'link') || xmlText(item, 'guid');
    const pubDate = xmlText(item, 'pubDate') || xmlText(item, 'dc:date') || new Date().toISOString();
    const text = `${title} ${description}`.toLowerCase();
    const tags: string[] = [];
    if (text.includes('gulf') || text.includes('hormuz') || text.includes('oman')) tags.push('Gulf');
    if (text.includes('jebel ali') || text.includes('dubai')) tags.push('Jebel Ali');
    if (text.includes('khalifa') || text.includes('abu dhabi')) tags.push('Khalifa Port');
    if (text.includes('dammam') || text.includes('saudi')) tags.push('Ad Dammam');
    if (text.includes('suez') || text.includes('red sea')) tags.push('Red Sea / Suez');
    if (text.includes('fuel') || text.includes('oil') || text.includes('tanker') || text.includes('cargo')) tags.push('Oil/Fuel');
    if (text.includes('delay') || text.includes('disruption') || text.includes('exception')) tags.push('Disruption');
    return { title, summary: description.slice(0, 300), link, pubDate, source: sourceName, tags };
  });
}

// --- Source 1: Nitter RSS (Twitter mirror) ------------------------------------

const NITTER_INSTANCES = [
  'https://nitter.privacydev.net',
  'https://nitter.poast.org',
  'https://nitter.1d4.us',
  'https://nitter.hostux.net',
];

const MARITIME_ACCOUNTS = ['WindwardAI', 'MarineTraffic', 'Portwatch_IMF'];

async function fetchNitterRSS(account: string): Promise<DisruptionPost[]> {
  for (const instance of NITTER_INSTANCES) {
    try {
      const res = await fetch(`${instance}/${account}/rss`, {
        signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FuelTracker/1.0)' },
        next: { revalidate: 3600 },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      if (!xml.includes('<item')) continue;
      const posts = parseRSSItems(xml, `X/@${account} via Nitter`);
      if (posts.length > 0) return posts;
    } catch { /* try next instance */ }
  }
  return [];
}

export async function fetchNitterDisruptions(): Promise<DisruptionPost[]> {
  const results = await Promise.allSettled(MARITIME_ACCOUNTS.map(fetchNitterRSS));
  const posts: DisruptionPost[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') posts.push(...r.value);
  }
  posts.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return posts.slice(0, 20);
}

// --- Source 2: MARAD maritime security advisories ----------------------------

export async function fetchMARADAdvisories(): Promise<DisruptionPost[]> {
  try {
    const res = await fetch('https://www.maritime.dot.gov/sites/marad.dot.gov/files/msci-advisories.rss', {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return parseRSSItems(await res.text(), 'MARAD – US Maritime Administration');
  } catch {
    return [];
  }
}

// --- Source 3: gCaptain RSS --------------------------------------------------

export async function fetchGCaptainRSS(): Promise<DisruptionPost[]> {
  try {
    const res = await fetch('https://gcaptain.com/feed/', {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return parseRSSItems(await res.text(), 'gCaptain Maritime News');
  } catch {
    return [];
  }
}

// --- Source 4: MarineTraffic blog RSS ----------------------------------------

export async function fetchMarineTrafficRSS(): Promise<DisruptionPost[]> {
  try {
    const res = await fetch('https://www.marinetraffic.com/blog/feed/', {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return parseRSSItems(await res.text(), 'MarineTraffic Blog');
  } catch {
    return [];
  }
}

// --- Source 5: Lloyd's List free RSS -----------------------------------------

export async function fetchLloydsListRSS(): Promise<DisruptionPost[]> {
  try {
    const res = await fetch('https://www.lloydslist.com/rss/ll-home.xml', {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return parseRSSItems(await res.text(), "Lloyd's List");
  } catch {
    return [];
  }
}

// --- Aggregated disruption feed ----------------------------------------------

const GULF_KEYWORDS = [
  'gulf', 'jebel ali', 'khalifa', 'dammam', 'hormuz', 'oman',
  'bahrain', 'kuwait', 'uae', 'saudi', 'iran', 'tanker',
  'disruption', 'late departure', 'destination change', 'exception',
  'windward', 'marine', 'vessel', 'port', 'shipping',
];

function isRelevant(post: DisruptionPost): boolean {
  const text = `${post.title} ${post.summary}`.toLowerCase();
  return GULF_KEYWORDS.some(kw => text.includes(kw));
}

export interface DisruptionsResult {
  posts: DisruptionPost[];
  allPosts: DisruptionPost[];
  fetchedAt: string;
  sources: string[];
  note: string;
}

// Shared server-side cache — ONE AISStream connection feeds both disruptions and vessel map
interface SharedCache {
  disruptions: DisruptionsResult;
  vessels: AISVessel[];
}

let _cache: SharedCache | null = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// In-flight promise to prevent concurrent AISStream connections during cache miss
let _inflight: Promise<SharedCache> | null = null;

async function buildCache(): Promise<SharedCache> {
  // Run AISStream ONCE and reuse result for both disruptions and vessel map.
  // RSS feeds run in parallel (they don't use AISStream).
  const [aisVessels, nitter, marad, gcaptain, mt, ll] = await Promise.allSettled([
    fetchAllVessels(),   // raw vessels — used for map markers
    fetchNitterDisruptions(),
    fetchMARADAdvisories(),
    fetchGCaptainRSS(),
    fetchMarineTrafficRSS(),
    fetchLloydsListRSS(),
  ]);

  const vessels: AISVessel[] = aisVessels.status === 'fulfilled' ? aisVessels.value : [];

  // Convert vessels to disruption posts
  const aisPosts = vesselsToDisruptions(vessels);

  const allPosts: DisruptionPost[] = [];
  const sources: string[] = [];

  function add(r: PromiseSettledResult<DisruptionPost[]>, name: string) {
    if (r.status === 'fulfilled' && r.value.length > 0) {
      allPosts.push(...r.value);
      sources.push(name);
    }
  }

  if (aisPosts.length > 0) {
    allPosts.push(...aisPosts);
    sources.push('AISStream (Real-time AIS)');
  }
  add(nitter, 'Nitter RSS (@WindwardAI, @MarineTraffic, @Portwatch_IMF)');
  add(marad, 'MARAD Official Advisories');
  add(gcaptain, 'gCaptain');
  add(mt, 'MarineTraffic Blog');
  add(ll, "Lloyd's List");

  const seen = new Set<string>();
  const unique = allPosts.filter(p => {
    if (seen.has(p.link)) return false;
    seen.add(p.link);
    return true;
  });

  const relevant = unique.filter(isRelevant);
  relevant.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  const all = [...unique].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  const disruptions: DisruptionsResult = {
    posts: relevant.slice(0, 15),
    allPosts: all.slice(0, 50),
    fetchedAt: new Date().toISOString(),
    sources,
    note: sources.length === 0
      ? 'No maritime feeds reachable – check network connectivity'
      : `Live data from: ${sources.join(', ')}`,
  };

  return { disruptions, vessels };
}

async function getCache(): Promise<SharedCache> {
  if (_cache && Date.now() < _cacheExpiry) {
    console.log('[maritime] Cache hit (expires in', Math.round((_cacheExpiry - Date.now()) / 60000), 'min)');
    return _cache;
  }

  // Coalesce concurrent requests into one AISStream connection
  if (!_inflight) {
    _inflight = buildCache().then(result => {
      _cache = result;
      _cacheExpiry = Date.now() + CACHE_TTL_MS;
      _inflight = null;
      return result;
    }).catch(err => {
      _inflight = null;
      throw err;
    });
  }

  return _inflight;
}

export async function fetchAllDisruptions(): Promise<DisruptionsResult> {
  const { disruptions } = await getCache();
  return disruptions;
}

export async function getVesselsFromCache(): Promise<AISVessel[]> {
  const { vessels } = await getCache();
  return vessels;
}
