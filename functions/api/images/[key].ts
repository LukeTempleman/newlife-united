import { Env, json, requireAuth } from '../_utils';

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const key = params.key as string;
  if (!key) return json({ error: 'Image key required' }, 400);

  try {
    const rangeHeader = request.headers.get('Range');
    let range: { offset: number; length: number } | undefined;
    let total = 0;
    if (rangeHeader) {
      const metadata = await env.IMAGES.head(key);
      if (!metadata) return json({ error: 'Media not found' }, 404);
      total = metadata.size;
      const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
      if (match && (match[1] || match[2])) {
        const offset = match[1] ? Number(match[1]) : Math.max(0, total - Number(match[2]));
        const end = match[1] && match[2] ? Math.min(Number(match[2]), total - 1) : total - 1;
        if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(end) || offset > end || offset >= total) {
          return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } });
        }
        range = { offset, length: end - offset + 1 };
      }
    }
    const object = await env.IMAGES.get(key, range ? { range } : undefined);
    if (!object) return json({ error: 'Image not found' }, 404);

    return new Response(object.body, {
      status: range ? 206 : 200,
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
        'Accept-Ranges': 'bytes',
        'Content-Length': String(range ? range.length : object.size),
        ...(range ? { 'Content-Range': `bytes ${range.offset}-${range.offset + range.length - 1}/${total}` } : {}),
      },
    });
  } catch (error) {
    return json({
      error: 'Failed to retrieve image',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await requireAuth(request, env))) return json({ error: 'Unauthorized' }, 401);

  const key = params.key as string;
  if (!key) return json({ error: 'Image key required' }, 400);

  try {
    await env.IMAGES.delete(key);
    return json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    return json({
      error: 'Failed to delete image',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};
