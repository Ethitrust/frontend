const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function tryRefreshToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const refresh = localStorage.getItem('refresh');
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const access = data.access_token ?? data.token?.access_token ?? data.data?.access_token;
    const newRefresh = data.refresh_token ?? data.token?.refresh_token ?? data.data?.refresh_token;
    if (access) {
      localStorage.setItem('token', access);
      if (newRefresh) localStorage.setItem('refresh', newRefresh);
      return access;
    }
  } catch (e) {
    // ignore and fall through
  }
  // refresh failed — clear stored tokens
  localStorage.removeItem('token');
  localStorage.removeItem('refresh');
  return null;
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Server-side: do a plain fetch without localStorage tokens
  if (typeof window === 'undefined') {
    const serverResp = await fetch(url, options as RequestInit);
    if (!serverResp.ok) {
      const text = await serverResp.text();
      const err = new Error(`API Error: ${serverResp.status} ${serverResp.statusText}`);
      (err as any).status = serverResp.status;
      (err as any).body = text;
      throw err;
    }
    const ct = serverResp.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) return serverResp.json();
    return serverResp.text();
  }

  // Client-side: attach token if present
  const token = localStorage.getItem('token');
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) baseHeaders['Authorization'] = `Bearer ${token}`;

  let response = await fetch(url, { ...options, headers: baseHeaders });

  // Attempt token refresh on 401 and retry once
  if (response.status === 401) {
    const newAccess = await tryRefreshToken();
    if (newAccess) {
      const retryHeaders = { ...(options.headers as Record<string, string> || {}), 'Content-Type': 'application/json', 'Authorization': `Bearer ${newAccess}` };
      response = await fetch(url, { ...options, headers: retryHeaders });
    } else {
      const text = await response.text().catch(() => 'Unauthorized');
      const err = new Error('Unauthorized');
      (err as any).status = 401;
      (err as any).body = text;
      throw err;
    }
  }

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? '';
    let body: any = await response.text().catch(() => '');
    if (contentType.includes('application/json')) {
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }
    const err = new Error(`API Error: ${response.status} ${response.statusText}`);
    (err as any).status = response.status;
    (err as any).body = body;
    throw err;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return response.json();
  return response.text();
}
