const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:8000'
      : 'https://crochetcreation.onrender.com');
};

export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = new Headers(options.headers || {});
  
  // Only append token for our own API endpoints
  const isOurApi = url.includes(getApiUrl()) || url.startsWith('/api') || url.startsWith('http://localhost') || url.includes('crochetcreation.onrender.com');
  
  if (token && !headers.has('Authorization') && isOurApi) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const modifiedOptions = { ...options, headers };
  let response = await fetch(url, modifiedOptions);

  // If unauthorized, try to refresh token
  if (response.status === 401 && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${getApiUrl()}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          // Save new tokens
          localStorage.setItem('token', data.access_token);
          if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
          }
          
          // Retry original request with new token
          headers.set('Authorization', `Bearer ${data.access_token}`);
          return await fetch(url, { ...options, headers });
        } else {
          // Refresh failed (e.g. refresh token expired)
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/'; // or /admin depending on route
        }
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }
  }

  return response;
};
