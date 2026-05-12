import { Env, json, requireAuth } from '../_utils';

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!requireAuth(request, env)) return json({ error: 'Unauthorized' }, 401);

  const eventId = params.id as string;
  if (!eventId) return json({ error: 'Event ID required' }, 400);

  try {
    const updates = await request.json<Record<string, unknown>>();
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'id' || key === 'created_at') continue;
      fields.push(`${key} = ?`);
      values.push(value);
    }
    fields.push('updated_at = ?');
    values.push(now);
    values.push(eventId);

    if (fields.length === 1) return json({ error: 'No fields to update' }, 400);

    await env.DB.prepare(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    return json({ success: true, message: 'Event updated successfully' });
  } catch (error) {
    return json({
      error: 'Failed to update event',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!requireAuth(request, env)) return json({ error: 'Unauthorized' }, 401);

  const eventId = params.id as string;
  if (!eventId) return json({ error: 'Event ID required' }, 400);

  try {
    await env.DB.prepare('DELETE FROM events WHERE id = ?').bind(eventId).run();
    return json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    return json({
      error: 'Failed to delete event',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};
