import { authUrls } from './urls';
import { storage } from '../utils/storage';

const isClient = typeof window !== 'undefined';

const baseHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  Product: 'MakeMyPresence',
};

const baseURL = (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL : '') || 'https://api.makemypresence.com';

function normalizeUrl(url: string): string {
  const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
  const urlObj = new URL(fullUrl, baseURL);
  if (!urlObj.pathname.endsWith('/')) {
    urlObj.pathname += '/';
  }
  return urlObj.toString();
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw { response: { data, status: response.status } };
  }
  return data as T;
}

export const publicGateway = {
  async get<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(normalizeUrl(url), {
      method: 'GET',
      headers: { ...baseHeaders, ...options?.headers },
      ...options,
    });
    return handleResponse<T>(response);
  },

  async post<T>(url: string, body: any, options?: RequestInit): Promise<T> {
    const response = await fetch(normalizeUrl(url), {
      method: 'POST',
      headers: { ...baseHeaders, ...options?.headers },
      body: JSON.stringify(body),
      ...options,
    });
    return handleResponse<T>(response);
  },

  async put<T>(url: string, body: any, options?: RequestInit): Promise<T> {
    const response = await fetch(normalizeUrl(url), {
      method: 'PUT',
      headers: { ...baseHeaders, ...options?.headers },
      body: JSON.stringify(body),
      ...options,
    });
    return handleResponse<T>(response);
  },

  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(normalizeUrl(url), {
      method: 'DELETE',
      headers: { ...baseHeaders, ...options?.headers },
      ...options,
    });
    return handleResponse<T>(response);
  },
};

export const privateGateway = {
  async get<T>(url: string, options?: RequestInit): Promise<T> {
    return privateFetch<T>(url, { method: 'GET', ...options });
  },

  async post<T>(url: string, body: any, options?: RequestInit): Promise<T> {
    return privateFetch<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    });
  },

  async put<T>(url: string, body: any, options?: RequestInit): Promise<T> {
    return privateFetch<T>(url, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    });
  },

  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    return privateFetch<T>(url, { method: 'DELETE', ...options });
  },
};

async function privateFetch<T>(url: string, options: RequestInit): Promise<T> {
  const accessToken = storage.getAccessToken();
  
  const headers = {
    ...baseHeaders,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(normalizeUrl(url), {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (data?.statusCode === 1000) {
    try {
      const refreshToken = storage.getRefreshToken();
      const refreshRes = await publicGateway.post<{ response: { access_token: string } }>(
        authUrls.getAccessToken,
        { refresh_token: refreshToken }
      );
      const newAccessToken = refreshRes.response.access_token;
      
      storage.setAccessToken(newAccessToken);

      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${newAccessToken}`,
      };
      const retryResponse = await fetch(normalizeUrl(url), {
        ...options,
        headers: retryHeaders,
      });
      return handleResponse<T>(retryResponse);
    } catch (refreshError) {
      console.error('Your session has expired. Please login again.');
      storage.clear();
      if (isClient) {
        window.location.href = '/';
      }
      throw refreshError;
    }
  }

  if (!response.ok) {
    throw { response: { data, status: response.status } };
  }

  return data as T;
}
