import { useContext, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

export default function LoginModal({ onClose, onGuest, onSuccess }) {
  const { setUser } = useContext(AuthContext);
  const [mode, setMode] = useState('choose'); // 'choose' | 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const saveAndClose = (token, userData) => {
    localStorage.setItem('quizAppToken', token);
    setUser(userData);
    if (onSuccess) onSuccess();
    else onClose();
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post('/auth/google', { token: credentialResponse.credential });
      saveAndClose(res.data.token, res.data.user);
    } catch {
      setError('Google sign-in failed. Please try again.');
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const res = await api.post('/auth/register', { name, email, password });
        saveAndClose(res.data.token, res.data.user);
      } else {
        const res = await api.post('/auth/email-login', { email, password });
        saveAndClose(res.data.token, res.data.user);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition text-sm';
  const btnPrimary = 'w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 hover:from-blue-700 hover:to-cyan-600 transition disabled:opacity-60 disabled:cursor-not-allowed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-blue-600 to-cyan-500" />

        <div className="p-8">
          {/* Close */}
          <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>

          {/* Header */}
          <div className="text-center mb-6">
            <p className="text-3xl mb-2">🧠</p>
            <h2 className="text-2xl font-bold text-slate-900">
              {mode === 'signup' ? 'Create account' : mode === 'signin' ? 'Welcome back' : 'Join Quizzard'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'choose' ? 'Sign in to save your progress and compete on the leaderboard.' :
               mode === 'signup' ? 'Create your account to track scores.' :
               'Sign in to continue where you left off.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* Choose mode */}
          {mode === 'choose' && (
            <div className="space-y-3">
              {/* Google */}
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in failed.')}
                  width="368"
                  text="continue_with"
                  shape="pill"
                />
              </div>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-medium text-slate-400">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <button onClick={() => { setMode('signin'); setError(''); }} className={btnPrimary}>
                Sign in with Email
              </button>
              <button
                onClick={() => { setMode('signup'); setError(''); }}
                className="w-full rounded-2xl border-2 border-blue-200 px-5 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50 transition"
              >
                Create new account
              </button>

              {/* Guest */}
              <div className="pt-2 border-t border-slate-100 text-center">
                <button
                  onClick={onGuest}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700 transition underline underline-offset-2"
                >
                  Continue as Guest
                </button>
                <p className="mt-1 text-xs text-slate-400">⚠️ Progress won't be saved and scores won't appear on the leaderboard.</p>
              </div>
            </div>
          )}

          {/* Email form */}
          {(mode === 'signin' || mode === 'signup') && (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {mode === 'signup' && (
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={inputCls}
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputCls}
              />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputCls}
              />
              <button type="submit" disabled={loading} className={btnPrimary}>
                {loading ? 'Please wait…' : mode === 'signup' ? 'Create account →' : 'Sign in →'}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-medium text-slate-400">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in failed.')}
                  width="368"
                  text="continue_with"
                  shape="pill"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setMode('choose'); setError(''); }} className="text-xs text-slate-400 hover:text-slate-600 transition">
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                >
                  {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>

              <div className="text-center">
                <button type="button" onClick={onGuest} className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition">
                  Continue as Guest instead
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
