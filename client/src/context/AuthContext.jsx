import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  loginUser,
  registerUser,
  getCurrentUser,
} from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const [loading, setLoading] = useState(true);

  // Login user
  const login = async (email, password) => {
    const response = await loginUser(email, password);

    const { token: newToken, user: loggedInUser } = response;

    localStorage.setItem("token", newToken);

    setToken(newToken);
    setUser(loggedInUser);

    return response;
  };

  // Register user
  const register = async (name, email, password) => {
    const response = await registerUser(
      name,
      email,
      password
    );

    const {
      token: newToken,
      user: registeredUser,
    } = response;

    localStorage.setItem("token", newToken);

    setToken(newToken);
    setUser(registeredUser);

    return response;
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem("token");

    setToken(null);
    setUser(null);
  };

  // Restore authenticated user after page refresh
  const fetchCurrentUser = async () => {
    try {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      const response = await getCurrentUser();

      setUser(response.user);
    } catch (error) {
      // Token is invalid or expired
      localStorage.removeItem("token");

      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};