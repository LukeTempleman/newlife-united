import { Env, json, requireAuth } from '../_utils';

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const key = params.key as string;
  if (!key) return json({ error: 'Image key required' }, 400);

  try {
    const object = await env.IMAGES.get(key);
    if (!object) return json({ error: 'Image not found' }, 404);

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    return json({
      error: 'Failed to retrieve image',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!requireAuth(request, env)) return json({ error: 'Unauthorized' }, 401);

  const key = params.key as string;
  if (!key) return json({ error: 'Image key required' }, 400);

  try {
    await env.IMAGES.delete(key);
    return json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    return json({
      error: 'Failed to delete image',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};
