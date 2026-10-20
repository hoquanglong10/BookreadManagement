const sessionKey = "doc-truyen-auth";

export function clearSession() {
  sessionStorage.removeItem(sessionKey);
}

export function getSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(sessionKey) || "null");
    if (saved?.token && saved.user && saved.expiresAt > Date.now()) return saved;
  } catch { /* Invalid data is treated as signed out. */ }
  clearSession();
  return null;
}

export function saveSession(data) {
  const session = {
    token: data.token,
    user: data.user,
    expiresAt: Date.now() + data.expiresIn * 1000
  };
  sessionStorage.setItem(sessionKey, JSON.stringify(session));
  return session;
}

export function requireAdmin() {
  const session = getSession();
  if (!session) window.location.replace("./account.html");
  else if (session.user.role !== "Admin") window.location.replace("./");
  return session?.user.role === "Admin" ? session : null;
}

export function watchAdminSession(session) {
  return setTimeout(() => {
    clearSession();
    window.location.replace("./account.html");
  }, Math.max(0, session.expiresAt - Date.now()));
}
