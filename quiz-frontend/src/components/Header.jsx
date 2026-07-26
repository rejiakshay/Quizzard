import { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getLevel } from '../utils/levels';
import api from '../utils/api';

export default function Header() {
  const { user, setUser } = useContext(AuthContext);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('quizAppToken');
    setUser(null);
    setShowMenu(false);
  };

  return (
    <header style={{ background: 'var(--ink)', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="header-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'var(--pink)',
            boxShadow: '0 0 0 3px rgba(255,59,105,0.2)',
            display: 'inline-block',
            flexShrink: 0,
          }} />
          <span className="font-display" style={{ fontSize: 20, color: 'var(--paper)', letterSpacing: '-0.5px' }}>
            Quizzard
          </span>
        </NavLink>

        {/* Nav links — hidden on mobile */}
        <nav className="nav-links" style={{ gap: 28 }}>
          {[
            { to: '/', label: 'Home' },
            { to: '/#categories', label: 'Categories', scroll: 'categories' },
            { to: '/leaderboard', label: 'Leaderboards' },
            { to: '/daily', label: 'Daily Quiz' },
            { to: '/about', label: 'About' },
          ].map(({ to, label, scroll }) => (
            <NavLink
              key={label}
              to={to}
              end={to === '/'}
              onClick={scroll ? (e) => {
                e.preventDefault();
                const el = document.getElementById(scroll);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else navigate('/');
              } : undefined}
              style={({ isActive }) => ({
                color: isActive ? 'var(--paper)' : 'var(--slate)',
                fontSize: 13, fontWeight: 500, textDecoration: 'none',
                transition: 'color 0.2s', whiteSpace: 'nowrap',
              })}
              onMouseEnter={e => { if (e.currentTarget.style.color !== 'var(--paper)') e.currentTarget.style.color = 'rgba(245,242,234,0.75)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = ''; }}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Auth */}
        {user ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, padding: '8px 14px', cursor: 'pointer', color: 'var(--paper)',
              }}
            >
              {user.pictureUrl && <img src={user.pictureUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{user.name}</span>
                {user.totalPoints && (
                  <span style={{ fontSize: 10, color: 'var(--yellow)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                    {getLevel(user.totalPoints).label}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 10, color: 'var(--slate)' }}>▾</span>
            </button>
            {showMenu && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, overflow: 'hidden', minWidth: 140,
                boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
              }}>
                <button
                  onClick={() => { navigate('/profile'); setShowMenu(false); }}
                  style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', color: 'var(--paper)', fontSize: 13, fontWeight: 500, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  My profile
                </button>
                <button
                  onClick={handleLogout}
                  style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', color: 'var(--paper)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <NavLink to="/" onClick={() => {}} style={{ textDecoration: 'none' }}>
            <button
              style={{
                background: 'var(--paper)', color: 'var(--ink)',
                border: 'none', padding: '10px 20px', borderRadius: 6,
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
              onClick={() => {
                // Dispatch a custom event so Home can open the login modal
                window.dispatchEvent(new CustomEvent('quizzard:openLogin'));
              }}
            >
              Sign in
            </button>
          </NavLink>
        )}
      </div>
    </header>
  );
}
