import { Env, json, requireAuth } from '../_utils';

interface SlotUpdate {
  current_url?: string | null;
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!requireAuth(request, env)) return json({ error: 'Unauthorized' }, 401);

  const slotId = params.id as string;
  if (!slotId) return json({ error: 'Slot ID required' }, 400);

  try {
    const body = await request.json<SlotUpdate>();
    const newUrl = (body.current_url ?? '').trim();
    const now = new Date().toISOString();

    const result = await env.DB
      .prepare('UPDATE image_slots SET current_url = ?, updated_at = ? WHERE slot_id = ?')
      .bind(newUrl || null, now, slotId)
      .run();

    if (!result.meta.changes) return json({ error: 'Slot not found' }, 404);

    return json({ success: true, slot_id: slotId, current_url: newUrl || null, updated_at: now });
  } catch (error) {
    return json({
      error: 'Failed to update slot',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

// DELETE clears the override (reverts the slot to its default image).
export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!requireAuth(request, env)) return json({ error: 'Unauthorized' }, 401);

  const slotId = params.id as string;
  if (!slotId) return json({ error: 'Slot ID required' }, 400);

  try {
    const now = new Date().toISOString();
    const result = await env.DB
      .prepare('UPDATE image_slots SET current_url = NULL, updated_at = ? WHERE slot_id = ?')
      .bind(now, slotId)
      .run();

    if (!result.meta.changes) return json({ error: 'Slot not found' }, 404);

    return json({ success: true, slot_id: slotId, current_url: null, updated_at: now });
  } catch (error) {
    return json({
      error: 'Failed to reset slot',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};
