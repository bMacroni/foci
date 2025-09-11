import { configService } from './config';

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | { error: string };
}

export async function apiFetch<T = any>(
  path: string, 
  init: RequestInit = {}, 
  timeoutMs = 15000
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const res = await fetch(`${configService.getBaseUrl()}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 
        'Content-Type': 'application/json', 
        ...(init.headers || {}) 
      },
    });
    
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    
    if (!res.ok) {
      return { ok: false, status: res.status, data };
    }
    
    return { ok: true, status: res.status, data };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('API request timed out:', path);
      return { 
        ok: false, 
        status: 408, 
        data: { error: 'Request timeout' } 
      };
    }
    
    console.error('API request failed:', path, error);
    return { 
      ok: false, 
      status: 0, 
      data: { error: 'Network error' } 
    };
  } finally {
    clearTimeout(id);
  }
}
