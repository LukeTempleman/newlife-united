import { Env, json, requireAuth } from '../_utils';

interface EventInput {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  end_time?: string;
  location?: string;
  image_url?: string;
  page?: string;
  tag?: string;
  featured?: boolean;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const pageFilter = url.searchParams.get('page');
    const query = pageFilter
      ? 'SELECT * FROM events WHERE is_active = true AND page = ? ORDER BY date ASC, time ASC'
      : 'SELECT * FROM events WHERE is_active = true ORDER BY date ASC, time ASC';
    const stmt = pageFilter
      ? env.DB.prepare(query).bind(pageFilter)
      : env.DB.prepare(query);
    const result = await stmt.all();
    return json({ success: true, data: result.results || [] });
  } catch (error) {
    return json({
      error: 'Failed to fetch events',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!requireAuth(request, env)) return json({ error: 'Unauthorized' }, 401);

  try {
    const event = await request.json<EventInput>();
    const id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO events (id, title, description, date, time, end_time, location, image_url, page, tag, featured, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      event.title || '',
      event.description || '',
      event.date || '',
      event.time || '',
      event.end_time || '',
      event.location || '',
      event.image_url || '',
      event.page || 'events',
      event.tag || '',
      event.featured ? 1 : 0,
      true,
      now,
      now
    ).run();

    return json({
      success: true,
      data: { id, ...event, is_active: true, created_at: now, updated_at: now },
    }, 201);
  } catch (error) {
    return json({
      error: 'Failed to create event',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};
