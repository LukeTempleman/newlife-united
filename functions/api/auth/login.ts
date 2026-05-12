import { Env, generateToken, json } from '../_utils';

interface AuthRequest {
  username: string;
  password: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { username, password } = await request.json<AuthRequest>();

    if (username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD) {
      const token = await generateToken({ username, role: 'admin' }, env.JWT_SECRET);
      return json({ success: true, token, user: { username, role: 'admin' } });
    }
    return json({ error: 'Invalid credentials' }, 401);
  } catch (error) {
    return json({
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 400);
  }
};
