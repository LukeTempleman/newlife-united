import { Env, json, requireAuth } from '../_utils';

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await requireAuth(request, env))) return json({ error: 'Unauthorized' }, 401);

  const eventId = params.id as string;
  if (!eventId) return json({ error: 'Event ID required' }, 400);

  try {
    const updates = await request.json<Record<string, unknown>>();
    const allowed = ['title', 'description', 'date', 'time', 'end_time', 'location', 'image_url', 'page', 'tag', 'featured'];
    if (Object.keys(updates).some(key => !allowed.includes(key))) return json({ error: 'Unknown event field' }, 400);
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'featured') {
        if (typeof value !== 'boolean') return json({ error: 'Featured must be true or false' }, 400);
      } else if (typeof value !== 'string') return json({ error: `${key} must be text` }, 400);
    }
    if ('title' in updates && !(updates.title as string).trim()) return json({ error: 'Event title is required' }, 400);
    if ('date' in updates && !/^\d{4}-\d{2}-\d{2}$/.test(updates.date as string)) return json({ error: 'Choose a valid event date' }, 400);
    for (const key of ['time', 'end_time']) {
      if (updates[key] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(updates[key] as string)) return json({ error: 'Choose a valid time' }, 400);
    }
    if ('page' in updates && !['events', 'watch', 'youth', 'kids', 'small-groups', 'bible-school'].includes(updates.page as string)) return json({ error: 'Choose a valid page' }, 400);
    if (updates.image_url && !/^(https?:\/\/|\/api\/images\/[a-zA-Z0-9_.-]+$|assets\/)/i.test(updates.image_url as string)) return json({ error: 'Choose a valid image URL or upload a picture' }, 400);
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(key === 'featured' ? (value ? 1 : 0) : value);
    }
    fields.push('updated_at = ?');
    values.push(now);
    values.push(eventId);

    if (fields.length === 1) return json({ error: 'No fields to update' }, 400);

    const result = await env.DB.prepare(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
    if (!result.meta.changes) return json({ error: 'Event not found. Refresh the event list.' }, 404);

    return json({ success: true, message: 'Event updated successfully' });
  } catch (error) {
    return json({
      error: 'Failed to update event',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await requireAuth(request, env))) return json({ error: 'Unauthorized' }, 401);

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
