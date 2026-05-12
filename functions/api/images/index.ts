import { Env, json, requireAuth } from '../_utils';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!requireAuth(request, env)) return json({ error: 'Unauthorized' }, 401);

  try {
    const origin = new URL(request.url).origin;
    const objects: { key: string; size: number; uploaded: string; contentType: string; url: string }[] = [];
    let cursor: string | undefined;

    do {
      const page = await env.IMAGES.list({ limit: 1000, cursor, include: ['httpMetadata'] });
      for (const o of page.objects) {
        objects.push({
          key: o.key,
          size: o.size,
          uploaded: o.uploaded.toISOString(),
          contentType: o.httpMetadata?.contentType || 'application/octet-stream',
          url: `${origin}/api/images/${encodeURIComponent(o.key)}`,
        });
      }
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);

    objects.sort((a, b) => b.uploaded.localeCompare(a.uploaded));
    return json({ success: true, data: objects });
  } catch (error) {
    return json({
      error: 'Failed to list images',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};
