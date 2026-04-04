/**
 * Maritime disruption data – NO Twitter/X API required
 *
 * Free sources used (in fallback order):
 *  1. Nitter RSS  – public Nitter instances mirror @WindwardAI tweets as RSS
 *  2. MARAD       – US Maritime Administration official advisories (XML/HTML)
 *  3. gCaptain    – Authoritative maritime news RSS feed (completely free)
 *  4. MarineTraffic blog RSS
 *  5. Lloyd's List RSS (public entries)
 *
 * Nitter explanation:
 *   Nitter is an open-source, privacy-friendly Twitter frontend.
 *   Public instances expose /username/rss without any API key.
 *   We try several instances in order and stop at the first success.
 *   This covers @WindwardAI, @MarineTraffic, @Portwatch_IMF etc.
 */

export interface DisruptionPost {
  title: string;
  summary: string;
  link: string;
  pubDate: string;
  source: string;
  tags: string[];
}

// --- RSS / XML helpers -------------------------------------------------------

/** Extract text content of the first matching XML tag */
function xmlText(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return (m?.[1] ?? m?.[2] ?? '').trim();
}

/** Split an RSS feed XML string into individual <item> blocks */
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

// --- Source 1: Nitter RSS (Twitter mirror, no API key) -----------------------

const NITTER_INSTANCES = [
  'https://nitter.privacydev.net',
  'https://nitter.poast.org',
  'https://nitter.1d4.us',
  'https://nitter.hostux.net',
];

const MARITIME_ACCOUNTS = [
  'WindwardAI',
  'MarineTraffic',
  'Portwatch_IMF',
];

async function fetchNitterRSS(account: string): Promise<DisruptionPost[]> {
  for (const instance of NITTER_INSTANCES) {
    try {
      const url = `${instance}/${account}/rss`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FuelTracker/1.0)' },
        next: { revalidate: 900 }, // 15-min cache
      });
      if (!res.ok) continue;
      const xml = await res.text();
      if (!xml.includes('<item')) continue;
      const posts = parseRSSItems(xml, `X/@${account} via Nitter`);
      if (posts.length > 0) return posts;
    } catch {
      // try next instance
    }
  }
  return [];
}

export async function fetchNitterDisruptions(): Promise<DisruptionPost[]> {
  const results = await Promise.allSettled(
    MARITIME_ACCOUNTS.map(acc => fetchNitterRSS(acc))
  );
  const posts: DisruptionPost[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') posts.push(...r.value);
  }
  // Sort newest-first
  posts.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return posts.slice(0, 20);
}

// --- Source 2: MARAD maritime security advisories ----------------------------

const MARAD_RSS = 'https://www.maritime.dot.gov/sites/marad.dot.gov/files/msci-advisories.rss';

export async function fetchMARADAdvisories(): Promise<DisruptionPost[]> {
  try {
    const res = await fetch(MARAD_RSS, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSSItems(xml, 'MARAD – US Maritime Administration');
  } catch {
    return [];
  }
}

// --- Source 3: gCaptain RSS --------------------------------------------------

const GCAPTAIN_RSS = 'https://gcaptain.com/feed/';

export async function fetchGCaptainRSS(): Promise<DisruptionPost[]> {
  try {
    const res = await fetch(GCAPTAIN_RSS, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSSItems(xml, 'gCaptain Maritime News');
  } catch {
    return [];
  }
}

// --- Source 4: MarineTraffic blog RSS ----------------------------------------

const MARINETRAFFIC_RSS = 'https://www.marinetraffic.com/blog/feed/';

export async function fetchMarineTrafficRSS(): Promise<DisruptionPost[]> {
  try {
    const res = await fetch(MARINETRAFFIC_RSS, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSSItems(xml, 'MarineTraffic Blog');
  } catch {
    return [];
  }
}

// --- Source 5: Lloyd's List free RSS -----------------------------------------

const LLOYDS_RSS = 'https://www.lloydslist.com/rss/ll-home.xml';

export async function fetchLloydsListRSS(): Promise<DisruptionPost[]> {
  try {
    const res = await fetch(LLOYDS_RSS, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSSItems(xml, 'Lloyd\'s List');
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

export async function fetchAllDisruptions(): Promise<DisruptionsResult> {
  const [nitter, marad, gcaptain, mt, ll] = await Promise.allSettled([
    fetchNitterDisruptions(),
    fetchMARADAdvisories(),
    fetchGCaptainRSS(),
    fetchMarineTrafficRSS(),
    fetchLloydsListRSS(),
  ]);

  const allPosts: DisruptionPost[] = [];
  const sources: string[] = [];

  function add(r: PromiseSettledResult<DisruptionPost[]>, name: string) {
    if (r.status === 'fulfilled' && r.value.length > 0) {
      allPosts.push(...r.value);
      sources.push(name);
    }
  }

  add(nitter, 'Nitter RSS (@WindwardAI, @MarineTraffic, @Portwatch_IMF)');
  add(marad, 'MARAD Official Advisories');
  add(gcaptain, 'gCaptain');
  add(mt, 'MarineTraffic Blog');
  add(ll, "Lloyd's List");

  // Deduplicate by link
  const seen = new Set<string>();
  const unique = allPosts.filter(p => {
    if (seen.has(p.link)) return false;
    seen.add(p.link);
    return true;
  });

  // Relevant posts first, then all sorted by date
  const relevant = unique.filter(isRelevant);
  relevant.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  const all = [...unique].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return {
    posts: relevant.slice(0, 15),
    allPosts: all.slice(0, 50),
    fetchedAt: new Date().toISOString(),
    sources,
    note: sources.length === 0
      ? 'No maritime feeds reachable – check network connectivity'
      : `Live data from: ${sources.join(', ')}`,
  };
}
