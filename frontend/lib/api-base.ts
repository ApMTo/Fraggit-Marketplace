const BACKEND_ORIGIN =
  process.env.BACKEND_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

export function getClientApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api';
  }

  return `${BACKEND_ORIGIN}/api`;
}

export async function getServerApiBaseUrl(): Promise<string> {
  return `${BACKEND_ORIGIN}/api`;
}
