import { createContext, useEffect, useMemo, useState } from "react";
import authService from "../services/authService";

export const AuthContext = createContext(null);

function safeGetLocalStorage(key) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) || "";
}

function safeGetUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(safeGetLocalStorage("token"));
    setUser(safeGetUser());
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profile = await authService.getProfile();
        setUser(profile);
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(profile));
        }
      } catch (err) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        setToken("");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [token]);

  const login = (payload) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", payload.access_token);
      localStorage.setItem("user", JSON.stringify(payload.user));
    }
    setToken(payload.access_token);
    setUser(payload.user);
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    setToken("");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      role: user?.role || "",
      isAuthenticated: Boolean(token),
      loading,
      login,
      logout
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
