import { Env, json, requireAuth } from '../_utils';

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!requireAuth(request, env)) return json({ error: 'Unauthorized' }, 401);

  const id = params.id as string;
  if (!id) return json({ error: 'Testimony ID required' }, 400);

  try {
    const updates = await request.json<Record<string, unknown>>();
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [k, v] of Object.entries(updates)) {
      if (k === 'id' || k === 'created_at') continue;
      fields.push(`${k} = ?`);
      values.push(v);
    }
    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    if (fields.length === 1) return json({ error: 'No fields to update' }, 400);

    const res = await env.DB
      .prepare(`UPDATE testimonies SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values).run();
    if (!res.meta.changes) return json({ error: 'Testimony not found' }, 404);

    return json({ success: true, id, updated_at: now });
  } catch (error) {
    return json({
      error: 'Failed to update testimony',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!requireAuth(request, env)) return json({ error: 'Unauthorized' }, 401);

  const id = params.id as string;
  if (!id) return json({ error: 'Testimony ID required' }, 400);

  try {
    const res = await env.DB.prepare('DELETE FROM testimonies WHERE id = ?').bind(id).run();
    if (!res.meta.changes) return json({ error: 'Testimony not found' }, 404);
    return json({ success: true, id });
  } catch (error) {
    return json({
      error: 'Failed to delete testimony',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};
