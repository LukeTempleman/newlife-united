// Shared helpers for /api routes. The underscore prefix means Pages skips
// this file when discovering routes.

export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  JWT_SECRET: string;
}

export const jsonHeaders = { 'Content-Type': 'application/json' };

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decode(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid encoding');
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}
async function signingKey(secret: string): Promise<CryptoKey> {
  if (!secret) throw new Error('Missing signing secret');
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function generateToken(payload: Record<string, unknown>, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const header = encode(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = encode(encoder.encode(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 86400 })));
  const signature = await crypto.subtle.sign('HMAC', await signingKey(secret), encoder.encode(header + '.' + body));
  return header + '.' + body + '.' + encode(new Uint8Array(signature));
}
export async function verifyToken(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const header = JSON.parse(new TextDecoder().decode(decode(parts[0])));
    if (header.alg !== 'HS256' || header.typ !== 'JWT') return null;
    if (!await crypto.subtle.verify('HMAC', await signingKey(secret), decode(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]))) return null;
    const payload = JSON.parse(new TextDecoder().decode(decode(parts[1]))) as Record<string, unknown>;
    if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000) || payload.role !== 'admin') return null;
    return payload;
  } catch { return null; }
}
export async function requireAuth(request: Request, env: Env): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  return (await verifyToken(authHeader.substring(7), env.JWT_SECRET)) !== null;
}
