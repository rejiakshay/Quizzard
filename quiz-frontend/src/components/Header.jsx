import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import api from '../utils/api';

export default function Header() {
  const { user, setUser } = useContext(AuthContext);

  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) return;

    try {
      const response = await api.post('/auth/google', { token: idToken });
      const { token, user: userData } = response.data;
      localStorage.setItem('quizAppToken', token);
      setUser(userData);
    } catch (error) {
      console.error('Google login failed', error);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
  };

  const handleLogout = () => {
    localStorage.removeItem('quizAppToken');
    setUser(null);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent tracking-tight">
            Quizzard
          </h1>
          <p className="text-xs text-slate-400 font-medium">Play. Learn. Compete.</p>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {[{ to: '/', label: 'Home' }, { to: '/leaderboard', label: 'Leaderboards' }, { to: '/admin', label: 'Admin' }].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive
                  ? 'rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200'
                  : 'rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition'
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 shadow-sm">
              {user.pictureUrl && (
                <img className="h-8 w-8 rounded-full ring-2 ring-blue-300" src={user.pictureUrl} alt={user.name} />
              )}
              <span className="text-sm font-semibold text-slate-700">{user.name}</span>
              <button
                onClick={handleLogout}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:from-blue-700 hover:to-cyan-600 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
          )}
        </div>
      </div>
    </header>
  );
}
