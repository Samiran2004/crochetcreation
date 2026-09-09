/**
 * Single source of truth for the API base URL.
 *
 * Every caller must use this rather than its own
 * `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'`: that fallback
 * has no production branch, so a missing env var on Vercel silently pointed
 * checkout at the visitor's own machine.
 */
export const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:8000';
  }
  return 'https://crochetcreation.onrender.com';
};

/**
 * Wipe every trace of the signed-in session.
 *
 * The refresh token matters most: leaving it behind let `apiFetch` mint a new
 * access token on the next 401, which quietly revived a session the user had
 * just ended. The cart goes too, so the next person on a shared device does not
 * inherit the previous shopper's basket.
 */
export const clearSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('crochet_cart');
  localStorage.setItem('crochet_cart_count', '0');
  window.dispatchEvent(new Event('cart-change'));
  // Lets the header re-read the session without a reload.
  window.dispatchEvent(new Event('session-change'));
};

// One shared refresh at a time. Without this, a page that fires several
// authenticated requests at once runs a refresh per request, and each one
// overwrites the refresh token the others are using.
let inFlightRefresh: Promise<string | null> | null = null;

const requestNewAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${getApiUrl()}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.access_token) return null;

    localStorage.setItem('token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    return data.access_token as string;
  } catch {
    return null;
  }
};

const refreshAccessToken = (): Promise<string | null> => {
  if (!inFlightRefresh) {
    inFlightRefresh = requestNewAccessToken().finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
};

export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = new Headers(options.headers || {});

  // Only attach our token to our own API, never to third-party hosts.
  const isOurApi =
    url.startsWith('/api') ||
    url.includes(getApiUrl()) ||
    url.startsWith('http://localhost') ||
    url.includes('crochetcreation.onrender.com');

  if (token && !headers.has('Authorization') && isOurApi) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status !== 401 || typeof window === 'undefined') {
    return response;
  }

  // A 401 on a public endpoint while signed out is not a session problem —
  // leave storage alone and let the caller handle it.
  if (!token) {
    return response;
  }

  // Never try to refresh the refresh call itself.
  if (url.includes('/api/auth/refresh')) {
    clearSession();
    return response;
  }

  const newToken = await refreshAccessToken();

  if (newToken) {
    headers.set('Authorization', `Bearer ${newToken}`);
    return fetch(url, { ...options, headers });
  }

  // Refresh genuinely failed: the session is over.
  clearSession();
  if (window.location.pathname !== '/') {
    window.location.href = '/';
  }
  return response;
};
