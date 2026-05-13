import { Env, json, requireAuth } from '../_utils';

interface TestimonyInput {
  name?: string;
  body?: string;
  location?: string;
  image_url?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const result = await env.DB
      .prepare('SELECT * FROM testimonies WHERE is_active = 1 ORDER BY created_at DESC')
      .all();
    return json({ success: true, data: result.results || [] });
  } catch (error) {
    return json({
      error: 'Failed to fetch testimonies',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!requireAuth(request, env)) return json({ error: 'Unauthorized' }, 401);

  try {
    const body = await request.json<TestimonyInput>();
    if (!body.name || !body.body) {
      return json({ error: 'name and body are required' }, 400);
    }
    const id = `tst_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO testimonies (id, name, body, location, image_url, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
    ).bind(id, body.name, body.body, body.location || '', body.image_url || '', now, now).run();

    return json({ success: true, data: { id, ...body, is_active: true, created_at: now, updated_at: now } }, 201);
  } catch (error) {
    return json({
      error: 'Failed to create testimony',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};
