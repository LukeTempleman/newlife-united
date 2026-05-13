import { Env, json, requireAuth } from '../_utils';

interface FormSubmission {
  form_type: string;
  data: Record<string, unknown>;
}

// Public POST: anyone on the site can submit a form. Admin GET: lists
// submissions, optionally filtered by ?type=<form_type> and ?archived=0|1.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const body = await request.json<FormSubmission>();
    const form_type = (body.form_type || url.searchParams.get('type') || '').trim();
    const data = body.data || {};

    if (!form_type) return json({ error: 'form_type is required' }, 400);

    const pick = (k: string): string => {
      const v = (data as Record<string, unknown>)[k];
      return typeof v === 'string' ? v : '';
    };

    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date().toISOString();
    const name = pick('name') || [pick('first_name'), pick('last_name')].filter(Boolean).join(' ');
    const email = pick('email');
    const phone = pick('phone') || pick('whatsapp');
    const message = pick('message') || pick('notes') || pick('prayer_request') || pick('comments') || '';

    await env.DB.prepare(
      `INSERT INTO form_submissions (id, form_type, name, email, phone, message, data_json, is_archived, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
    ).bind(id, form_type, name, email, phone, message, JSON.stringify(data), now).run();

    return json({ success: true, id }, 201);
  } catch (error) {
    return json({
      error: 'Failed to save submission',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!requireAuth(request, env)) return json({ error: 'Unauthorized' }, 401);

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const archived = url.searchParams.get('archived');

    const wheres: string[] = [];
    const params: unknown[] = [];
    if (type) { wheres.push('form_type = ?'); params.push(type); }
    if (archived === '0') wheres.push('is_archived = 0');
    if (archived === '1') wheres.push('is_archived = 1');

    const sql = `SELECT * FROM form_submissions${wheres.length ? ' WHERE ' + wheres.join(' AND ') : ''} ORDER BY created_at DESC LIMIT 500`;
    const result = await env.DB.prepare(sql).bind(...params).all();

    const rows = (result.results || []).map((r: Record<string, unknown>) => ({
      ...r,
      data: (() => { try { return JSON.parse((r.data_json as string) || '{}'); } catch { return {}; } })(),
    }));
    return json({ success: true, data: rows });
  } catch (error) {
    return json({
      error: 'Failed to list submissions',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};
