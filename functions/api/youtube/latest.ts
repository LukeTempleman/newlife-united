// Returns the latest videos from a YouTube channel by @handle.
// Resolves the handle → channel ID via a one-off HTML fetch (Cloudflare's
// edge can reach youtube.com without the bot blocks local fetches hit),
// then parses the channel's public RSS feed. Cached at the edge for 15 min.

import { Env, json } from '../_utils';

const HANDLE = 'newlifeunited';
const DEFAULT_LIMIT = 3;
const MAX_LIMIT = 15;

interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  published: string;
  author: string;
}

async function resolveChannelId(handle: string): Promise<string | null> {
  const res = await fetch(`https://www.youtube.com/@${handle}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; NewlifeUnitedBot/1.0)',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    cf: { cacheTtl: 86400, cacheEverything: true },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const match = html.match(/"(?:channelId|externalId)":"(UC[A-Za-z0-9_-]{22})"/);
  return match ? match[1] : null;
}

function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Live-stream archives on this channel are titled with an inline date stamp
// like "Sunday | 10-May-26 | ..." and don't appear on YouTube's public Videos
// tab. The channel re-uploads them later under a clean title. Drop the dated
// ones so the site matches the Videos tab.
const DATE_IN_TITLE = /\b\d{1,2}[\s\-](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;
function isLiveArchiveTitle(title: string): boolean {
  return DATE_IN_TITLE.test(title);
}

function parseRss(xml: string, limit: number): Video[] {
  // Pull ALL entries from the feed, then dedupe to one video per calendar
  // date — the channel often uploads the same service twice (raw + cleaned
  // re-upload) within minutes or hours. Sorted newest-first, so the most
  // recent upload for a given date wins.
  const entries = xml.split(/<entry[\s>]/).slice(1);
  const parsed = entries.map((entry) => {
    const get = (re: RegExp) => {
      const m = entry.match(re);
      return m ? m[1] : '';
    };
    const id = get(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const title = get(/<title>([^<]+)<\/title>/);
    const published = get(/<published>([^<]+)<\/published>/);
    const author = get(/<author>[\s\S]*?<name>([^<]+)<\/name>/);
    return {
      id,
      title: title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
      url: `https://www.youtube.com/watch?v=${id}`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      published,
      author,
    };
  }).filter((v) => v.id && !isLiveArchiveTitle(v.title));

  parsed.sort((a, b) => (b.published || '').localeCompare(a.published || ''));

  const seenDates = new Set<string>();
  const seenTitles = new Set<string>();
  const unique: Video[] = [];
  for (const v of parsed) {
    const dateKey = (v.published || '').slice(0, 10);
    const titleKey = normalizeTitle(v.title);
    if (dateKey && seenDates.has(dateKey)) continue;
    if (titleKey && seenTitles.has(titleKey)) continue;
    if (dateKey) seenDates.add(dateKey);
    if (titleKey) seenTitles.add(titleKey);
    unique.push(v);
    if (unique.length >= limit) break;
  }
  return unique;
}

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const requested = parseInt(url.searchParams.get('limit') || '', 10);
    const limit = Number.isFinite(requested) && requested > 0
      ? Math.min(requested, MAX_LIMIT)
      : DEFAULT_LIMIT;

    const channelId = await resolveChannelId(HANDLE);
    if (!channelId) {
      return json({ error: 'Could not resolve channel ID for @' + HANDLE }, 502);
    }

    const feedRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
      cf: { cacheTtl: 900, cacheEverything: true },
    });
    if (!feedRes.ok) {
      return json({ error: 'YouTube RSS fetch failed', status: feedRes.status }, 502);
    }
    const xml = await feedRes.text();
    const videos = parseRss(xml, limit);

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
