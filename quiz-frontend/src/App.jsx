import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import QuizPage from './pages/QuizPage';
import Leaderboard from './pages/Leaderboard';
import AdminPanel from './pages/AdminPanel';
import AdminQuizDetails from './pages/AdminQuizDetails';
import './index.css';

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-slate-900">
          <Router>
            <Header />
            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/quiz/:id" element={<QuizPage />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/admin/:id" element={<AdminQuizDetails />} />
              </Routes>
            </main>
          </Router>
        </div>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
