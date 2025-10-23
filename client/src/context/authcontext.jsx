import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("ishimura_token");
    const email = localStorage.getItem("ishimura_email");
    if (token && email) setUser({ email, token });
  }, []);

  const login = ({ email, token }) => {
    localStorage.setItem("ishimura_token", token);
    localStorage.setItem("ishimura_email", email);
    setUser({ email, token });
  };

  const logout = () => {
    localStorage.removeItem("ishimura_token");
    localStorage.removeItem("ishimura_email");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

