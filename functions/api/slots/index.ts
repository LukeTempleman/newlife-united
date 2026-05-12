import { Env, json, requireAuth } from '../_utils';

// Public GET: returns only customised slots so the shim can swap src.
// Admin GET (?admin=1, auth required): returns every slot with metadata.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const adminMode = url.searchParams.get('admin') === '1';

  if (adminMode) {
    if (!requireAuth(request, env)) return json({ error: 'Unauthorized' }, 401);
    try {
      const result = await env.DB
        .prepare('SELECT slot_id, page, label, default_url, current_url, updated_at FROM image_slots ORDER BY page, slot_id')
        .all();
      return json({ success: true, data: result.results || [] });
    } catch (error) {
      return json({
        error: 'Failed to list slots',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500);
    }
  }

  try {
    const result = await env.DB
      .prepare("SELECT slot_id, current_url FROM image_slots WHERE current_url IS NOT NULL AND current_url <> ''")
      .all();
    const map: Record<string, string> = {};
    for (const row of (result.results || []) as { slot_id: string; current_url: string }[]) {
      map[row.slot_id] = row.current_url;
    }
    return new Response(JSON.stringify({ success: true, data: map }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    return json({
      error: 'Failed to fetch slots',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};
