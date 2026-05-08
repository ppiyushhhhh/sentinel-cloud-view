const TOKEN_KEY = "cloudops_jwt_token";
const USER_KEY = "cloudops_user";
const LOGIN_TIME_KEY = "cloudops_login_time";

export type AuthUser = {
  id?: number;
  username: string;
  role?: string;
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export async function login(username: string, password: string) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username,
      password
    })
  });

  const data = await response.json();

  if (!response.ok || !data.success || !data.token) {
    throw new Error(data.message || "Invalid username or password.");
  }

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user || { username }));
  localStorage.setItem(LOGIN_TIME_KEY, new Date().toISOString());

  return data;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LOGIN_TIME_KEY);

  // Remove old frontend-only auth keys also
  localStorage.removeItem("cloudops_auth");
}

export function getLoginTime() {
  return localStorage.getItem(LOGIN_TIME_KEY);
}

export async function getCurrentUser() {
  const token = getToken();

  if (!token) {
    return null;
  }

  const response = await fetch("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    logout();
    return null;
  }

  const data = await response.json();

  if (!data.success) {
    logout();
    return null;
  }

  return data.user as AuthUser;
}

export function authHeaders() {
  const token = getToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`
  };
}
