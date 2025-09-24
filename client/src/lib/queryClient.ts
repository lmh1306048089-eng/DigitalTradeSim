import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const text = await res.text();
      let errorMessage: string;
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.message || res.statusText;
      } catch {
        errorMessage = text || res.statusText;
      }
      
      // Create error with status property for better error handling
      const error = new Error(errorMessage) as any;
      error.status = res.status;
      throw error;
    } catch (error) {
      if (error instanceof Error) {
        // Preserve the error but ensure it has status
        const enrichedError = error as any;
        if (!enrichedError.status) {
          enrichedError.status = res.status;
        }
        throw enrichedError;
      }
      const fallbackError = new Error(res.statusText) as any;
      fallbackError.status = res.status;
      throw fallbackError;
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
      } else {
        // Refresh token failed, clear all tokens and indicate auth failure
        console.warn('Refresh token expired or invalid, clearing auth tokens');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Throw a special auth error that can be handled by the UI
        const error = new Error('认证已过期，请重新登录');
        (error as any).status = 401;
        (error as any).isAuthExpired = true;
        throw error;
      }
    } catch (error) {
      console.warn('Auto token refresh failed:', error);
      
      // If it's already our auth error, re-throw it
      if ((error as any)?.isAuthExpired) {
        throw error;
      }
      
      // Otherwise, clear tokens and create auth error
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      const authError = new Error('认证已过期，请重新登录');
      (authError as any).status = 401;
      (authError as any).isAuthExpired = true;
      throw authError;
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
        if ((error as any)?.status === 401) {
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
