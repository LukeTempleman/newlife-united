// Returns the latest videos from a YouTube channel by @handle.
// Scrapes the channel's /videos page (the same view a visitor sees), pulling
// the embedded ytInitialData JSON. This matches what shows on YouTube and
// avoids the RSS feed's ~15-entry cap and live-archive duplicates.
// Cached at the edge for 15 min.

import { Env, json } from '../_utils';

const HANDLE = 'newlifeunited';
const DEFAULT_LIMIT = 3;
const MAX_LIMIT = 30;

interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  published: string;
  author: string;
}

// Live-stream archives on this channel are titled with an inline date stamp
// like "Sunday | 10-May-26 | ..." and don't appear on YouTube's public Videos
// tab. Belt-and-suspenders filter in case scraping ever picks them up.
const DATE_IN_TITLE = /\b\d{1,2}[\s\-](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;

const RELATIVE_UNIT_MS: Record<string, number> = {
  second: 1_000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
  month: 2_629_800_000,
  year: 31_557_600_000,
};

// "8 days ago" → ISO timestamp 8 days back. Approximate for older entries
// ("1 year ago" rounds to exactly 365 days), but preserves sort order and
// is good enough for the date label in the UI.
function relativeToIso(text: string): string {
  if (!text) return '';
  const m = text.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/i);
  if (!m) return '';
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const ms = RELATIVE_UNIT_MS[unit];
  if (!ms) return '';
  return new Date(Date.now() - n * ms).toISOString();
}

function extractInitialData(html: string): unknown | null {
  // The channel page emits: var ytInitialData = {...};</script>
  // ytInitialData JSON can't legally contain a literal </script>, so
  // matching up to the first ;</script> after the assignment is safe.
  const start = html.indexOf('var ytInitialData = ');
  if (start === -1) return null;
  const jsonStart = start + 'var ytInitialData = '.length;
  const end = html.indexOf(';</script>', jsonStart);
  if (end === -1) return null;
  try {
    return JSON.parse(html.slice(jsonStart, end));
  } catch {
    return null;
  }
}

function collectVideoRenderers(root: unknown): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  const stack: unknown[] = [root];
  while (stack.length) {
    const node = stack.pop();
    if (Array.isArray(node)) {
      for (const item of node) stack.push(item);
    } else if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>;
      const renderer = obj.videoRenderer || obj.gridVideoRenderer;
      if (renderer && typeof renderer === 'object') {
        out.push(renderer as Record<string, unknown>);
      }
      for (const key in obj) stack.push(obj[key]);
    }
  }
  return out;
}

function extractTitle(renderer: Record<string, unknown>): string {
  const t = renderer.title as Record<string, unknown> | undefined;
  if (!t) return '';
  if (typeof t.simpleText === 'string') return t.simpleText;
  const runs = t.runs as Array<{ text?: string }> | undefined;
  if (Array.isArray(runs) && runs[0]?.text) return runs[0].text;
  return '';
}

function extractPublishedText(renderer: Record<string, unknown>): string {
  const p = renderer.publishedTimeText as Record<string, unknown> | undefined;
  if (!p) return '';
  if (typeof p.simpleText === 'string') return p.simpleText;
  return '';
}

function parseChannelVideos(html: string, limit: number): { channelId: string | null; videos: Video[] } {
  const channelMatch = html.match(/"(?:channelId|externalId)":"(UC[A-Za-z0-9_-]{22})"/);
  const channelId = channelMatch ? channelMatch[1] : null;

  const data = extractInitialData(html);
  if (!data) return { channelId, videos: [] };

  const renderers = collectVideoRenderers(data);
  const seenIds = new Set<string>();
  const videos: Video[] = [];

  for (const r of renderers) {
    const id = typeof r.videoId === 'string' ? r.videoId : '';
    if (!id || seenIds.has(id)) continue;
    const title = extractTitle(r);
    if (!title || DATE_IN_TITLE.test(title)) continue;
    seenIds.add(id);
    videos.push({
      id,
      title,
      url: `https://www.youtube.com/watch?v=${id}`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      published: relativeToIso(extractPublishedText(r)),
      author: 'NewLife United Church',
    });
    if (videos.length >= limit) break;
  }

  return { channelId, videos };
}

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const requested = parseInt(url.searchParams.get('limit') || '', 10);
    const limit = Number.isFinite(requested) && requested > 0
      ? Math.min(requested, MAX_LIMIT)
      : DEFAULT_LIMIT;

    const res = await fetch(`https://www.youtube.com/@${HANDLE}/videos`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewlifeUnitedBot/1.0)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cf: { cacheTtl: 900, cacheEverything: true },
    });
    if (!res.ok) {
      return json({ error: 'YouTube channel page fetch failed', status: res.status }, 502);
    }
    const html = await res.text();
    const { channelId, videos } = parseChannelVideos(html, limit);

    if (!videos.length) {
      return json({ error: 'Could not parse videos from channel page', channelId }, 502);
    }

    return new Response(JSON.stringify({ success: true, channelId, videos }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=900, max-age=300',
      },
    });
  } catch (error) {
    return json({
      error: 'Failed to fetch latest videos',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};
