// Returns the latest videos from a YouTube channel by @handle.
// Resolves the handle → channel ID via a one-off HTML fetch (Cloudflare's
// edge can reach youtube.com without the bot blocks local fetches hit),
// then parses the channel's public RSS feed. Cached at the edge for 15 min.

import { Env, json } from '../_utils';

const HANDLE = 'newlifeunited';
const MAX_VIDEOS = 3;

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

function parseRss(xml: string): Video[] {
  const entries = xml.split(/<entry[\s>]/).slice(1, 1 + MAX_VIDEOS);
  return entries.map((entry) => {
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
  }).filter((v) => v.id);
}

export const onRequestGet: PagesFunction<Env> = async () => {
  try {
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
    const videos = parseRss(xml);

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
