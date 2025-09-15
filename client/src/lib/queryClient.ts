import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function getUsernameFromLocalStorage(): string | null {
  return localStorage.getItem('username');
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const username = getUsernameFromLocalStorage();
  const headers: Record<string, string> = {};
  
  if (username) {
    headers['x-username'] = username;
  }
  
  if (data) {
    headers['Content-Type'] = 'application/json';
  }

  // Använd miljövariabel om den finns, annars fallback
  let apiBase = import.meta.env.VITE_API_URL || '';
  if (!apiBase) {
    if (typeof window !== 'undefined') {
      if (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')) {
        apiBase = 'http://localhost:5000';
      } else {
        apiBase = 'https://puppytracker.onrender.com';
      }
    } else {
      apiBase = 'https://puppytracker.onrender.com';
    }
  }
  const fullUrl = url.startsWith('/api') ? apiBase + url : url;
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const username = getUsernameFromLocalStorage();
    const headers: Record<string, string> = {};
    
    if (username) {
      headers['x-username'] = username;
    }

  const apiBase = 'https://puppytracker.onrender.com';
  const url = queryKey[0];
  const fullUrl = typeof url === 'string' && url.startsWith('/api') ? apiBase + url : String(url);
  const res = await fetch(fullUrl, {
      headers,
      credentials: "include",
    });

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
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
