import { Env, json, requireAuth } from '../_utils';

// Images for general use + short looping videos for hero slots. Videos
// should be MP4/WebM/MOV, kept small (a few seconds, muted, ~10 MB or less).
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime',
];

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!requireAuth(request, env)) return json({ error: 'Unauthorized' }, 401);

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return json({ error: 'No file provided' }, 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, MP4, WebM, MOV.' }, 400);
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    const extension = file.name.split('.').pop() || 'jpg';
    const key = `${timestamp}_${random}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    await env.IMAGES.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type },
    });

    const url = new URL(request.url);
    const imageUrl = `${url.origin}/api/images/${key}`;

    return json({
      success: true,
      key,
      url: imageUrl,
      fileName: file.name,
      size: file.size,
      type: file.type,
    }, 201);
  } catch (error) {
    return json({
      error: 'Failed to upload image',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
};
