import { getSession } from './auth-storage';

// Keep it simple: same-origin or VITE_BACKEND_URL.
const BASE_URL =
  (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3000';

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const session = await getSession();

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Backend session auth might not be used on mobile, but include if present.
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }

  return (await res.json()) as T;
}

