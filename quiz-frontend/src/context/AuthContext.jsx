import { createContext, useEffect, useState } from 'react';
import { identifyUser, resetUser } from '../utils/analytics';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('quizAppUser');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      identifyUser(u);
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('quizAppUser', JSON.stringify(user));
      identifyUser(user);
    } else {
      localStorage.removeItem('quizAppUser');
      resetUser();
    }
  }, [user]);

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
}
