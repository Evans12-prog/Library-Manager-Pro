import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User } from "@workspace/api-client-react";

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  setUser: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("smartlib_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to parse user from local storage", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem("smartlib_user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("smartlib_user");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("smartlib_user");
  };

  return (
    <AuthContext.Provider value={{ user, setUser: handleSetUser, logout: handleLogout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
