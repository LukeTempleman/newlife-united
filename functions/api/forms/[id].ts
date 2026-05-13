import { Env, json, requireAuth } from '../_utils';

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!requireAuth(request, env)) return json({ error: 'Unauthorized' }, 401);
  const id = params.id as string;
  if (!id) return json({ error: 'Submission ID required' }, 400);

  try {
    const body = await request.json<{ is_archived?: boolean | number }>();
    const archived = body.is_archived ? 1 : 0;
    const res = await env.DB
      .prepare('UPDATE form_submissions SET is_archived = ? WHERE id = ?')
      .bind(archived, id).run();
    if (!res.meta.changes) return json({ error: 'Not found' }, 404);
    return json({ success: true, id, is_archived: archived });
  } catch (error) {
    return json({
      error: 'Failed to update submission',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!requireAuth(request, env)) return json({ error: 'Unauthorized' }, 401);
  const id = params.id as string;
  if (!id) return json({ error: 'Submission ID required' }, 400);

  try {
    const res = await env.DB.prepare('DELETE FROM form_submissions WHERE id = ?').bind(id).run();
    if (!res.meta.changes) return json({ error: 'Not found' }, 404);
    return json({ success: true, id });
  } catch (error) {
    return json({
      error: 'Failed to delete submission',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};
