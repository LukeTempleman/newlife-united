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

// YouTube's channel Videos tab uses richItemRenderer entries, each wrapping
// a lockupViewModel with contentId, contentType, and a nested
// lockupMetadataViewModel for title and metadata rows. The page also
// contains lockupViewModels in other places (playlists, sidebars), so we
// scope to richItemRenderer.content.lockupViewModel only — these are the
// real Videos tab grid in document order.
function collectVideoLockups(root: unknown): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  const queue: unknown[] = [root];
  while (queue.length) {
    const node = queue.shift();
    if (Array.isArray(node)) {
      for (const item of node) queue.push(item);
    } else if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>;
      const rich = obj.richItemRenderer as Record<string, unknown> | undefined;
      const lockup = (rich?.content as Record<string, unknown> | undefined)
        ?.lockupViewModel as Record<string, unknown> | undefined;
      if (lockup && lockup.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO' && typeof lockup.contentId === 'string') {
        out.push(lockup);
        continue;
      }
      for (const key in obj) queue.push(obj[key]);
    }
  }
  return out;
}

function extractLockupTitle(lockup: Record<string, unknown>): string {
  const metadata = lockup.metadata as Record<string, unknown> | undefined;
  const lockupMeta = metadata?.lockupMetadataViewModel as Record<string, unknown> | undefined;
  const title = lockupMeta?.title as Record<string, unknown> | undefined;
  return typeof title?.content === 'string' ? title.content : '';
}

const RELATIVE_TIME_RE = /^\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i;

function extractLockupPublishedText(lockup: Record<string, unknown>): string {
  const metadata = lockup.metadata as Record<string, unknown> | undefined;
  const lockupMeta = metadata?.lockupMetadataViewModel as Record<string, unknown> | undefined;
  const contentMeta = (lockupMeta?.metadata as Record<string, unknown> | undefined)
    ?.contentMetadataViewModel as Record<string, unknown> | undefined;
  const rows = contentMeta?.metadataRows as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(rows)) return '';
  for (const row of rows) {
    const parts = row?.metadataParts as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      const text = (part?.text as Record<string, unknown> | undefined)?.content;
      if (typeof text === 'string' && RELATIVE_TIME_RE.test(text.trim())) {
        return text.trim();
      }
    }
  }
  return '';
}

function parseChannelVideos(html: string, limit: number): { channelId: string | null; videos: Video[] } {
  const channelMatch = html.match(/"(?:channelId|externalId)":"(UC[A-Za-z0-9_-]{22})"/);
  const channelId = channelMatch ? channelMatch[1] : null;

  const data = extractInitialData(html);
  if (!data) return { channelId, videos: [] };

  const lockups = collectVideoLockups(data);
  const seenIds = new Set<string>();
  const videos: Video[] = [];

  for (const lockup of lockups) {
    const id = lockup.contentId as string;
    if (!id || seenIds.has(id)) continue;
    const title = extractLockupTitle(lockup);
    if (!title || DATE_IN_TITLE.test(title)) continue;
    seenIds.add(id);
    videos.push({
      id,
      title,
      url: `https://www.youtube.com/watch?v=${id}`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      published: relativeToIso(extractLockupPublishedText(lockup)),
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
