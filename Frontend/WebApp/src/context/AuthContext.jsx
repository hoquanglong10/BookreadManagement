import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { currentUserRequest } from "../api/authApi.js";
import { clearToken, readToken, saveToken } from "../api/http.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(readToken()));

  useEffect(() => {
    let alive = true;
    const token = readToken();
    if (!token) {
      setIsLoading(false);
      return undefined;
    }

    currentUserRequest()
      .then(profile => { if (alive) setUser(profile); })
      .catch(() => { clearToken(); if (alive) setUser(null); })
      .finally(() => { if (alive) setIsLoading(false); });

    const handleUnauthorized = () => {
      clearToken();
      setUser(null);
      setIsLoading(false);
    };
    window.addEventListener("bookread:unauthorized", handleUnauthorized);
    return () => {
      alive = false;
      window.removeEventListener("bookread:unauthorized", handleUnauthorized);
    };
  }, []);

  const signIn = useCallback(session => {
    saveToken(session.token);
    setUser(session.user);
    setIsLoading(false);
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setUser(null);
    setIsLoading(false);
  }, []);

  const updateUser = useCallback(profile => setUser(previous => previous ? { ...previous, ...profile } : previous), []);

  const value = useMemo(() => ({ user, isLoading, signIn, signOut, updateUser }), [user, isLoading, signIn, signOut, updateUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth phải được gọi bên trong AuthProvider.");
  return value;
}
