const TOKEN_STORAGE_KEY = 'gk_session_token';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function getAuthToken(): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage access errors in restricted environments
  }
}

export async function uploadSignedMedia(blob: Blob, kind: 'image' | 'audio'): Promise<string> {
  const maxBytes = kind === 'image' ? 10 * 1024 * 1024 : 20 * 1024 * 1024;
  if (blob.size > maxBytes) throw new ApiError(`${kind === 'image' ? 'Image' : 'Audio'} exceeds the ${kind === 'image' ? '10' : '20'} MB limit.`, 413);
  const signed = await apiFetch<{ signedUrl: string; path: string }>('/api/media/upload-url', {
    method: 'POST',
    body: JSON.stringify({ kind, mimeType: blob.type || (kind === 'image' ? 'image/jpeg' : 'audio/wav') }),
  });
  const response = await fetch(signed.signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': blob.type || (kind === 'image' ? 'image/jpeg' : 'audio/wav'),
      'x-upsert': 'false',
      'cache-control': 'max-age=3600',
    },
    body: blob,
  });
  if (!response.ok) throw new ApiError('Media upload failed. Please try again.', response.status);
  return signed.path;
}

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiFetch<T>(url: string, options: ApiFetchOptions = {}): Promise<T> {
  const { timeoutMs, signal: externalSignal, ...fetchOptions } = options;
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  let controller: AbortController | null = null;
  let timerId: number | null = null;
  let timedOut = false;

  if (typeof timeoutMs === 'number' && timeoutMs > 0) {
    controller = new AbortController();
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', () => controller?.abort(), { once: true });
      }
    }
    timerId = window.setTimeout(() => {
      timedOut = true;
      controller?.abort();
    }, timeoutMs);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...fetchOptions,
      credentials: 'include',
      headers,
      signal: controller ? controller.signal : externalSignal,
    });
  } catch (err) {
    if (timerId !== null) window.clearTimeout(timerId);
    if (timedOut || (err instanceof DOMException && err.name === 'AbortError')) {
      throw new ApiError('Request timed out. Please try again.', 408, 'TIMEOUT');
    }
    throw new ApiError(
      err instanceof Error && err.message ? err.message : 'Network connection failed.',
      0,
      'NETWORK_ERROR'
    );
  } finally {
    if (timerId !== null) window.clearTimeout(timerId);
  }

  const text = await res.text();
  let data: Record<string, unknown> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const message =
      typeof data.error === 'string' && data.error.trim()
        ? data.error
        : `Request failed (${res.status})`;
    const code = typeof data.code === 'string' ? data.code : undefined;
    throw new ApiError(message, res.status, code);
  }

  return data as T;
}

export async function apiFetchBlob(
  url: string
): Promise<{ blob: Blob; filename: string | null }> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = `Download failed (${res.status})`;
    if (text) {
      try {
        const parsed = JSON.parse(text) as { error?: string };
        if (parsed.error) message = parsed.error;
      } catch {
        message = text;
      }
    }
    throw new ApiError(message, res.status);
  }

  const disp = res.headers.get('content-disposition') || '';
  const match = /filename="?([^";]+)"?/i.exec(disp);
  const blob = await res.blob();
  return {
    blob,
    filename: match ? match[1] : null,
  };
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}
