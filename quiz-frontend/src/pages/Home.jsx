import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import { trackEvent } from '../utils/analytics';

const TAG_META = {
  Geography:        { emoji: '🌍', bg: '#FFF1CE' },
  Movies:           { emoji: '🎬', bg: '#FFE1EA' },
  Science:          { emoji: '🔬', bg: '#E3E5F0' },
  History:          { emoji: '🏛️', bg: '#DCF5E4' },
  General:          { emoji: '🧠', bg: '#EDE9FF' },
  'Hindu Mythology':{ emoji: '🕉️', bg: '#FDEBD0' },
  Pub:              { emoji: '🍺', bg: '#FFF9C4' },
};
const defaultMeta = { emoji: '📚', bg: '#F0F0F0' };
const tagMeta = (tag) => TAG_META[tag] || defaultMeta;

const DIFF_STYLE = {
  easy:   { background: '#DCF5E4', color: '#1b7a3d' },
  medium: { background: '#FFF1CE', color: '#8a6200' },
  hard:   { background: '#FFE1EA', color: '#b3325c' },
};

// Background glyph definitions for hero
const BG_GLYPHS = [
  { sym: '?',  top: '8%',  left: '4%',   size: 110, rot: '-15deg', op: 0.045 },
  { sym: '✓',  top: '72%', left: '2%',   size: 80,  rot: '8deg',   op: 0.04  },
  { sym: 'A',  top: '15%', right: '5%',  size: 90,  rot: '12deg',  op: 0.04  },
  { sym: '★',  top: '60%', right: '3%',  size: 70,  rot: '-8deg',  op: 0.05  },
  { sym: '!',  top: '40%', left: '7%',   size: 65,  rot: '-5deg',  op: 0.035 },
  { sym: 'B',  top: '80%', right: '12%', size: 60,  rot: '10deg',  op: 0.035 },
  { sym: '◆',  top: '25%', left: '14%',  size: 40,  rot: '20deg',  op: 0.05  },
  { sym: '○',  top: '50%', right: '18%', size: 55,  rot: '0deg',   op: 0.04  },
  { sym: 'D',  top: '88%', left: '22%',  size: 50,  rot: '-12deg', op: 0.035 },
  { sym: '▲',  top: '5%',  left: '45%',  size: 38,  rot: '5deg',   op: 0.04  },
  { sym: '✗',  top: '65%', left: '48%',  size: 44,  rot: '-18deg', op: 0.035 },
  { sym: 'C',  top: '35%', right: '8%',  size: 56,  rot: '-6deg',  op: 0.04  },
  { sym: '?',  top: '55%', left: '30%',  size: 32,  rot: '14deg',  op: 0.03  },
  { sym: '✦',  top: '18%', right: '22%', size: 34,  rot: '0deg',   op: 0.05  },
  { sym: '◇',  top: '92%', right: '30%', size: 46,  rot: '22deg',  op: 0.04  },
];

export default function Home() {
  const { user } = useContext(AuthContext);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPlays, setTotalPlays] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingQuizId, setPendingQuizId] = useState(null);
  const [playedQuizIds, setPlayedQuizIds] = useState(() =>
    JSON.parse(localStorage.getItem('playedQuizIds') || '[]')
  );
  const navigate = useNavigate();

  const startQuiz = async (quizId) => {
    try { await api.post(`/quizzes/${quizId}/play`); } catch {}
    const quiz = quizzes.find(q => q.id === quizId);
    trackEvent('quiz_started_home', { quiz_id: quizId, title: quiz?.title, tag: quiz?.tag, difficulty: quiz?.difficulty });
    navigate(`/quiz/${quizId}`);
  };

  const handleStartQuiz = (quizId) => {
    if (!user) { setPendingQuizId(quizId); setShowLoginModal(true); }
    else startQuiz(quizId);
  };

  const handleGuest = () => { setShowLoginModal(false); if (pendingQuizId) startQuiz(pendingQuizId); };
  const handleLoginSuccess = () => { setShowLoginModal(false); if (pendingQuizId) startQuiz(pendingQuizId); };

  useEffect(() => {
    api.get('/quizzes').then(r => setQuizzes(r.data.quizzes)).catch(console.error).finally(() => setLoading(false));
    api.get('/quizzes/stats').then(r => setTotalPlays(r.data.totalPlays)).catch(console.error);
    setPlayedQuizIds(JSON.parse(localStorage.getItem('playedQuizIds') || '[]'));

    const handler = () => setShowLoginModal(true);
    window.addEventListener('quizzard:openLogin', handler);
    return () => window.removeEventListener('quizzard:openLogin', handler);
  }, []);

  const tagGroups = quizzes.reduce((acc, quiz) => {
    const tag = quiz.tag || 'General';
    if (!acc[tag]) acc[tag] = [];
    acc[tag].push(quiz);
    return acc;
  }, {});
  const tags = Object.keys(tagGroups).sort();
  const activeQuizzes = selectedTag ? (tagGroups[selectedTag] || []) : [];
  const categoryCount = tags.length;

  return (
    <>
      {showLoginModal && (
        <LoginModal
          onClose={() => { setShowLoginModal(false); setPendingQuizId(null); }}
          onGuest={handleGuest}
          onSuccess={handleLoginSuccess}
        />
      )}

      {/* ── Hero ── */}
      <section style={{ position: 'relative', padding: '80px 32px 100px', overflow: 'hidden' }}>
        {/* Background glyphs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          {BG_GLYPHS.map((g, i) => (
            <span key={i} className="font-display" style={{
              position: 'absolute',
              top: g.top, left: g.left, right: g.right,
              fontSize: g.size,
              transform: `rotate(${g.rot})`,
              color: `rgba(245,242,234,${g.op})`,
              userSelect: 'none', lineHeight: 1,
            }}>{g.sym}</span>
          ))}
        </div>

        {/* Centered content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>

          {/* App name */}
          <div className="font-display" style={{ fontSize: 'clamp(52px, 7vw, 88px)', fontWeight: 900, letterSpacing: '-3px', lineHeight: 0.9, color: 'var(--paper)', marginBottom: 20 }}>
            Quizzard
          </div>

          {/* Tagline */}
          <h1 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 48px)', lineHeight: 1.05, letterSpacing: '-1px', marginBottom: 28, color: 'var(--paper)', fontWeight: 800 }}>
            Play. Learn. Repeat.
          </h1>

          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--slate)', maxWidth: 480, margin: '0 auto 40px', fontWeight: 400 }}>
            Play instantly as a guest, or sign in to track your progress and climb the leaderboard.{' '}
            <b style={{ color: 'var(--paper)', fontWeight: 600 }}>No downloads, no signup wall.</b>
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 64, flexWrap: 'wrap' }}>
            <button
              onClick={() => { if (tags.length > 0) { setSelectedTag(tags[0]); document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' }); } }}
              style={{
                fontWeight: 700, fontSize: 15,
                background: 'var(--green)', color: '#fff',
                border: 'none',
                padding: '15px 36px', cursor: 'pointer',
                boxShadow: '0 5px 0 #1a9e52, 0 8px 24px rgba(46,204,113,0.3)',
                transition: 'transform 0.1s, box-shadow 0.1s',
                letterSpacing: '0.3px',
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'translateY(5px)'; e.currentTarget.style.boxShadow = '0 0 0 #1a9e52, 0 4px 12px rgba(46,204,113,0.2)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 5px 0 #1a9e52, 0 8px 24px rgba(46,204,113,0.3)'; }}
            >
              Play now →
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 0, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 40 }}>
            {[
              { num: totalPlays !== null ? totalPlays : '—', lbl: 'Total plays', accent: 'var(--paper)' },
              { num: categoryCount || '—',                   lbl: 'Categories',  accent: 'var(--yellow)' },
              { num: quizzes.length || '—',                  lbl: 'Quiz sets',   accent: 'var(--green)'  },
            ].map(({ num, lbl, accent }, i, arr) => (
              <div key={lbl} style={{
                flex: 1, textAlign: 'center',
                borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                padding: '0 24px',
              }}>
                <div className="font-mono" style={{ fontWeight: 700, fontSize: 30, color: accent, letterSpacing: '-1px' }}>{num}</div>
                <div style={{ fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section id="categories" className="categories-section" style={{ background: 'var(--ink-2)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '70px 64px 90px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="categories-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
            <h2 className="font-display" style={{ fontSize: 32, letterSpacing: '-1px', color: 'var(--paper)' }}>Pick your battlefield</h2>
            <p style={{ color: 'var(--slate)', fontSize: 14, maxWidth: 280, textAlign: 'right' }}>
              {categoryCount} categories, {quizzes.length} quiz sets, one leaderboard.
            </p>
          </div>

          {loading ? (
            <p style={{ color: 'var(--slate)', fontSize: 15 }}>Loading…</p>
          ) : tags.length === 0 ? (
            <p style={{ color: 'var(--slate)', fontSize: 15 }}>No quizzes available yet.</p>
          ) : (
            <div className="cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
              {tags.map((tag) => {
                const meta = tagMeta(tag);
                const count = tagGroups[tag].length;
                const isActive = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => { const next = isActive ? null : tag; setSelectedTag(next); if (next) trackEvent('category_selected', { tag: next }); }}
                    style={{
                      background: isActive ? 'var(--pink)' : 'var(--surface)',
                      border: `1.5px solid ${isActive ? 'var(--pink)' : 'var(--surface-border)'}`,
                      borderRadius: 8, padding: '22px 20px',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
                      color: 'var(--paper)',
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 30px rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = isActive ? 'var(--pink)' : 'var(--surface-border)'; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 6, background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>
                      {meta.emoji}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: 'var(--paper)' }}>{tag}</div>
                    <div className="font-mono" style={{ fontSize: 12, color: isActive ? 'rgba(245,242,234,0.75)' : 'var(--slate)' }}>{count} set{count !== 1 ? 's' : ''}</div>
                    <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase', color: isActive ? '#fff' : 'var(--slate)' }}>
                      {isActive ? '▲ Collapse' : '▼ Browse'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quiz list for selected tag */}
          {selectedTag && activeQuizzes.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <h3 className="font-display" style={{ fontSize: 22, marginBottom: 24, letterSpacing: '-0.5px', color: 'var(--paper)' }}>
                {tagMeta(selectedTag).emoji} {selectedTag}
              </h3>
              <div className="quiz-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {activeQuizzes.map((quiz) => {
                  const played = playedQuizIds.includes(quiz.id);
                  const diff = quiz.difficulty ? DIFF_STYLE[quiz.difficulty] : null;
                  return (
                    <div key={quiz.id} style={{
                      background: 'var(--surface)', border: '1.5px solid var(--surface-border)',
                      borderRadius: 8, padding: '20px 20px 16px',
                      display: 'flex', flexDirection: 'column',
                    }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        {diff && (
                          <span style={{ ...diff, fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', padding: '4px 8px', borderRadius: 3 }}>
                            {quiz.difficulty}
                          </span>
                        )}
                        {played && (
                          <span style={{ background: 'rgba(46,204,113,0.15)', color: 'var(--green)', fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', padding: '4px 8px', borderRadius: 3 }}>
                            ✓ Played
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--paper)', marginBottom: 6, lineHeight: 1.3 }}>{quiz.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--slate)', lineHeight: 1.5, flex: 1, marginBottom: 16 }}>
                        {quiz.description || 'A quick, friendly quiz experience.'}
                      </div>
                      {played ? (
                        <button
                          onClick={() => navigate(`/quiz/${quiz.id}?review=true`)}
                          style={{
                            background: 'transparent',
                            color: 'var(--green)',
                            border: '1.5px solid var(--green)',
                            borderRadius: 6, padding: '10px 18px',
                            fontWeight: 700, fontSize: 13, cursor: 'pointer',
                            transition: 'opacity 0.15s', alignSelf: 'flex-start',
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          📖 Review answers
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartQuiz(quiz.id)}
                          style={{
                            background: 'var(--pink)', color: '#fff',
                            border: 'none', borderRadius: 6, padding: '10px 18px',
                            fontWeight: 700, fontSize: 13, cursor: 'pointer',
                            transition: 'opacity 0.15s', alignSelf: 'flex-start',
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          Start quiz →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--ink)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px 64px', textAlign: 'center' }}>
        <p style={{ color: 'var(--slate)', fontSize: 13 }}>
          Made with <span style={{ color: 'var(--pink)' }}>♥</span> by Akshay
        </p>
      </footer>
    </>
  );
}
