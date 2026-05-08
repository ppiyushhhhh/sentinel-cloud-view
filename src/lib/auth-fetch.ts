import { authHeaders, logout } from "@/lib/auth";

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = {
    ...(init.headers || {}),
    ...authHeaders()
  };

  const response = await fetch(input, {
    ...init,
    headers
  });

  if (response.status === 401) {
    logout();
    window.location.href = "/login";
  }

  return response;
}
