import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const text = await res.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || res.statusText);
      } catch {
        throw new Error(text || res.statusText);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(res.statusText);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  let accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  // Try to refresh token if it's missing or expired
  if (!accessToken && refreshToken) {
    try {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });
      
      if (refreshRes.ok) {
        const tokenData = await refreshRes.json();
        localStorage.setItem('accessToken', tokenData.accessToken);
        localStorage.setItem('refreshToken', tokenData.refreshToken);
        accessToken = tokenData.accessToken;
      }
    } catch (error) {
      console.warn('Token refresh failed:', error);
    }
  }
  
  const headers: Record<string, string> = {};
  
  // Don't set Content-Type for FormData - let the browser set it automatically
  const isFormData = data instanceof FormData;
  
  if (data && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
  });

  // If we get 401, try to refresh token once
  if (res.status === 401 && refreshToken && !url.includes('/auth/refresh')) {
    try {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });
      
      if (refreshRes.ok) {
        const tokenData = await refreshRes.json();
        localStorage.setItem('accessToken', tokenData.accessToken);
        localStorage.setItem('refreshToken', tokenData.refreshToken);
        
        // Retry the original request with new token
        const retryHeaders = { ...headers };
        retryHeaders["Authorization"] = `Bearer ${tokenData.accessToken}`;
        
        const retryRes = await fetch(url, {
          method,
          headers: retryHeaders,
          body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
          credentials: "include",
        });
        
        await throwIfResNotOk(retryRes);
        return retryRes;
      }
    } catch (error) {
      console.warn('Auto token refresh failed:', error);
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    const makeRequest = async (token?: string) => {
      const headers: Record<string, string> = {};
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      return fetch(queryKey.join("/") as string, {
        credentials: "include",
        headers,
      });
    };

    let res = await makeRequest(accessToken || undefined);

    // If we get 401, try to refresh token once
    if (res.status === 401 && refreshToken) {
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
          credentials: 'include',
        });
        
        if (refreshRes.ok) {
          const tokenData = await refreshRes.json();
          localStorage.setItem('accessToken', tokenData.accessToken);
          localStorage.setItem('refreshToken', tokenData.refreshToken);
          
          // Retry the original request with new token
          res = await makeRequest(tokenData.accessToken);
        }
      } catch (error) {
        console.warn('Auto token refresh failed in queryFn:', error);
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Never retry 401 errors
        if (error instanceof Error && error.message.includes("401")) {
          return false;
        }
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
