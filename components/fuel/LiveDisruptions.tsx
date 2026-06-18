'use client';

import { useState, useEffect } from 'react';

interface DisruptionPost {
  title: string;
  summary: string;
  link: string;
  pubDate: string;
  source: string;
  tags: string[];
}

interface DisruptionsResult {
  posts: DisruptionPost[];
  allPosts: DisruptionPost[];
  fetchedAt: string;
  sources: string[];
  note: string;
}

const TAG_COLORS: Record<string, string> = {
  Gulf: 'bg-orange-900/60 text-orange-300 border-orange-700/50',
  'Jebel Ali': 'bg-blue-900/60 text-blue-300 border-blue-700/50',
  'Khalifa Port': 'bg-purple-900/60 text-purple-300 border-purple-700/50',
  'Ad Dammam': 'bg-yellow-900/60 text-yellow-300 border-yellow-700/50',
  'Red Sea / Suez': 'bg-red-900/60 text-red-300 border-red-700/50',
  'Oil/Fuel': 'bg-amber-900/60 text-amber-300 border-amber-700/50',
  Disruption: 'bg-rose-900/60 text-rose-300 border-rose-700/50',
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function PostCard({ post }: { post: DisruptionPost }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3 space-y-2 hover:border-slate-600/60 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-slate-200 leading-snug font-medium">{post.title}</p>
        <span className="text-xs text-slate-500 whitespace-nowrap shrink-0 mt-0.5">
          {formatDate(post.pubDate)}
        </span>
      </div>

      {post.summary && post.summary !== post.title && (
        <p className={`text-xs text-slate-400 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {post.summary}
        </p>
      )}
      {post.summary && post.summary.length > 150 && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      <div className="flex flex-wrap gap-1 items-center">
        {post.tags.map(tag => (
          <span
            key={tag}
            className={`text-xs px-1.5 py-0.5 rounded border font-medium ${TAG_COLORS[tag] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}
          >
            {tag}
          </span>
        ))}
        <span className="text-xs text-slate-500 ml-auto">{post.source}</span>
        {post.link && (
          <a
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            View →
          </a>
        )}
      </div>
    </div>
  );
}

export default function LiveDisruptions() {
  const [data, setData] = useState<DisruptionsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/disruptions');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: DisruptionsResult = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Auto-refresh every hour (matches server-side revalidate)
  useEffect(() => {
    const id = setInterval(load, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const posts = showAll ? data?.allPosts ?? [] : data?.posts ?? [];

  return (
    <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <h2 className="text-sm font-semibold text-white">Live Maritime Disruptions</h2>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-slate-500">
              Updated {formatDate(lastRefresh.toISOString())}
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Sources note */}
      {data?.note && (
        <div className="px-4 py-2 bg-slate-800/40 border-b border-slate-700/30">
          <p className="text-xs text-slate-400">
            <span className="text-slate-500">Sources: </span>{data.note}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            No X/Twitter API key needed — data via Nitter RSS + MARAD + gCaptain
          </p>
        </div>
      )}

      {/* Content */}
      <div className="p-3 space-y-2 max-h-[480px] overflow-y-auto">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-800/50 rounded-lg animate-pulse" />
            ))}
          </div>
        )}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={load} className="mt-2 text-xs text-blue-400 hover:text-blue-300">Retry</button>
          </div>
        )}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <p className="text-slate-400 text-sm">No maritime disruption posts found</p>
            <p className="text-slate-500 text-xs">
              Nitter RSS instances may be temporarily unavailable.<br />
              MARAD and gCaptain feeds are checked as fallback.
            </p>
          </div>
        )}
        {!loading && posts.map((post, i) => (
          <PostCard key={`${post.link}-${i}`} post={post} />
        ))}
      </div>

      {/* Footer */}
      {data && (
        <div className="px-4 py-2 border-t border-slate-700/30 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {data.posts.length} Gulf-relevant / {data.allPosts.length} total alerts
          </span>
          <button
            onClick={() => setShowAll(v => !v)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showAll ? 'Show Gulf-relevant only' : 'Show all maritime news'}
          </button>
        </div>
      )}
    </div>
  );
}
