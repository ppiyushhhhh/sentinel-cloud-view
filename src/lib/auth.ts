const AUTH_KEY = "cloudops_auth";
const LOGIN_TIME_KEY = "cloudops_login_time";

export function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function login(username: string, password: string) {
  const validUsername = import.meta.env.VITE_LOGIN_USERNAME || "admin";
  const validPassword = import.meta.env.VITE_LOGIN_PASSWORD || "CloudOps@123";

  if (username === validUsername && password === validPassword) {
    localStorage.setItem(AUTH_KEY, "true");
    localStorage.setItem(LOGIN_TIME_KEY, new Date().toISOString());
    return true;
  }

  return false;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(LOGIN_TIME_KEY);
}

export function getLoginTime() {
  return localStorage.getItem(LOGIN_TIME_KEY);
}
