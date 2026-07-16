import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';

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

const SAMPLE_QUESTIONS = [
  { cat: 'World Geography', qNum: 'QUESTION 4 OF 10', q: 'Which river flows through the most countries?', opts: ['Danube', 'Nile', 'Amazon', 'Yangtze'], correct: 0, ring: 7, streak: '×5' },
  { cat: 'Science', qNum: 'QUESTION 2 OF 10', q: 'What gas do plants absorb from the air?', opts: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], correct: 2, ring: 9, streak: '×3' },
  { cat: 'Movies & TV', qNum: 'QUESTION 6 OF 10', q: 'Who directed Jurassic Park?', opts: ['James Cameron', 'Steven Spielberg', 'Ridley Scott', 'Peter Jackson'], correct: 1, ring: 5, streak: '×8' },
  { cat: 'Hindu Mythology', qNum: 'QUESTION 3 OF 10', q: 'Which asura was killed by the Narasimha avatar?', opts: ['Hiranyaksha', 'Hiranyakashipu', 'Mahishasura', 'Ravana'], correct: 1, ring: 6, streak: '×4' },
];
const LETTERS = ['A', 'B', 'C', 'D'];

function AnimatedCard() {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx(i => (i + 1) % SAMPLE_QUESTIONS.length);
        setFading(false);
      }, 250);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  const q = SAMPLE_QUESTIONS[idx];
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (q.ring / 10) * circumference;

  return (
    <div style={{
      background: 'var(--paper)', color: 'var(--ink)',
      width: '100%', maxWidth: 400,
      borderRadius: 10, padding: '26px 26px 22px',
      transform: 'rotate(3deg)',
      boxShadow: '0 24px 60px rgba(0,0,0,0.45), 0 0 0 6px rgba(255,255,255,0.03)',
      position: 'relative',
    }}>
      {/* LIVE badge */}
      <div style={{
        position: 'absolute', top: -14, right: 20,
        background: 'var(--ink)', color: 'var(--yellow)',
        borderRadius: 5, padding: '8px 12px',
        fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
        transform: 'rotate(-4deg)',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pink)', display: 'inline-block' }} className="animate-pulse-dot" />
        LIVE
      </div>

      {/* Card top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{
          background: 'var(--ink)', color: 'var(--yellow)',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.5px', textTransform: 'uppercase',
          padding: '5px 10px', borderRadius: 4,
        }}>{q.cat}</div>
        <div style={{ position: 'relative', width: 44, height: 44 }}>
          <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
            <circle stroke="#D8D4C8" fill="none" strokeWidth="4" cx="22" cy="22" r="18" />
            <circle stroke="var(--pink)" fill="none" strokeWidth="4" strokeLinecap="round"
              cx="22" cy="22" r="18"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 15, color: 'var(--ink)',
          }}>{q.ring}</div>
        </div>
      </div>

      {/* Question */}
      <div className={`card-fade${fading ? ' out' : ''}`}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--slate)', letterSpacing: '0.5px', marginBottom: 8 }}>{q.qNum}</div>
        <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.3, marginBottom: 18, color: 'var(--ink)' }}>{q.q}</div>
        <div>
          {q.opts.map((opt, i) => {
            const isCorrect = i === q.correct;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: isCorrect ? 'rgba(46,204,113,0.12)' : '#fff',
                border: `1.5px solid ${isCorrect ? 'var(--green)' : '#D8D4C8'}`,
                borderRadius: 6, padding: '10px 14px', marginBottom: 8,
                fontSize: 13, fontWeight: 500, color: 'var(--ink)',
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: isCorrect ? 'var(--green)' : '#D8D4C8',
                  color: isCorrect ? '#fff' : 'var(--ink)',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{LETTERS[i]}</span>
                {opt}
                {isCorrect && <span style={{ marginLeft: 'auto', color: 'var(--green)', fontWeight: 700 }}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '1px dashed #D8D4C8' }}>
        <div style={{ fontSize: 12, color: 'var(--slate)', fontWeight: 500 }}>
          Streak <b style={{ color: 'var(--pink)', fontFamily: 'JetBrains Mono, monospace' }}>{q.streak}</b>
        </div>
        <div style={{ display: 'flex' }}>
          {['#FFC53D', '#FF3B69', '#2ECC71'].map((c, i) => (
            <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--paper)', marginLeft: -8, background: c }} />
          ))}
        </div>
      </div>

      {/* Points badge */}
      <div style={{
        position: 'absolute', bottom: -16, left: -10,
        background: 'var(--ink)', color: 'var(--green)',
        borderRadius: 5, padding: '8px 12px',
        fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
        boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
        transform: 'rotate(3deg)',
      }}>+120 PTS</div>
    </div>
  );
}

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
      <section className="hero-grid page-pad" style={{ position: 'relative', padding: '60px 64px 100px', minHeight: 620, maxWidth: 1200, margin: '0 auto' }}>
        {/* Background glyphs */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          {[
            { top: '10%', left: '8%', rot: '-12deg', size: 120 },
            { top: '55%', left: '2%', rot: '8deg',  size: 90  },
            { top: '70%', left: '40%', rot: '-6deg', size: 70 },
            { top: '5%',  left: '55%', rot: '10deg', size: 60 },
          ].map((g, i) => (
            <span key={i} className="font-display" style={{
              position: 'absolute', top: g.top, left: g.left,
              fontSize: g.size, transform: `rotate(${g.rot})`,
              color: 'rgba(245,242,234,0.045)', userSelect: 'none',
            }}>{i % 2 === 0 ? '?' : '✓'}</span>
          ))}
        </div>

        {/* Left content */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            color: 'var(--pink)',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700,
            letterSpacing: '1.5px', textTransform: 'uppercase',
            paddingLeft: 14, borderLeft: '3px solid var(--pink)',
            marginBottom: 28,
          }}>
            <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pink)', display: 'inline-block' }} />
            Live now
          </div>

          <h1 className="font-display" style={{ fontSize: 'clamp(40px, 4.8vw, 68px)', lineHeight: 0.98, letterSpacing: '-1.5px', marginBottom: 24, color: 'var(--paper)' }}>
            Play. Learn.<br />
            <span style={{
              color: 'var(--ink)', background: 'var(--yellow)',
              padding: '0 10px', display: 'inline-block',
              transform: 'rotate(-1.2deg)', marginTop: 8,
              boxShadow: '6px 6px 0 var(--pink-dim)',
            }}>Repeat.</span>
          </h1>

          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--slate)', maxWidth: 460, marginBottom: 36 }}>
            Play instantly as a guest, or sign in to track what you've learned and see how it stacks up. <b style={{ color: 'var(--paper)', fontWeight: 700 }}>No downloads, no signup wall</b> — just tap and play.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 48 }}>
            <button
              onClick={() => { if (tags.length > 0) { setSelectedTag(tags[0]); document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' }); } }}
              style={{
                fontWeight: 700, fontSize: 16,
                background: 'var(--pink)', color: 'var(--ink)',
                border: 'none', borderRadius: 6,
                padding: '16px 32px', cursor: 'pointer',
                boxShadow: '0 5px 0 var(--pink-dim)',
                transition: 'transform 0.1s, box-shadow 0.1s',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'translateY(5px)'; e.currentTarget.style.boxShadow = '0 0 0 var(--pink-dim)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 5px 0 var(--pink-dim)'; }}
            >
              Play now →
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              style={{
                fontWeight: 500, fontSize: 15, color: 'var(--paper)',
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                borderBottom: '1px solid rgba(245,242,234,0.3)', paddingBottom: 2,
              }}
            >
              See leaderboard
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32 }}>
            {[
              { num: totalPlays !== null ? totalPlays : '—', lbl: 'Total plays', color: 'var(--paper)' },
              { num: categoryCount || '—', lbl: 'Categories', color: 'var(--paper)' },
              { num: `${quizzes.length || '—'}`, lbl: 'Quiz sets', color: 'var(--green)' },
            ].map(({ num, lbl, color }) => (
              <div key={lbl}>
                <div className="font-mono" style={{ fontWeight: 700, fontSize: 24, color }}>{num}</div>
                <div style={{ fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: animated card — hidden on mobile */}
        <div className="hero-card-wrap" style={{ position: 'relative', zIndex: 2 }}>
          <AnimatedCard />
        </div>
      </section>

      {/* ── Categories ── */}
      <section id="categories" className="categories-section" style={{ background: 'var(--paper)', color: 'var(--ink)', padding: '70px 64px 90px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="categories-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
            <h2 className="font-display" style={{ fontSize: 32, letterSpacing: '-1px' }}>Pick your battlefield</h2>
            <p style={{ color: '#6b6f7d', fontSize: 14, maxWidth: 280, textAlign: 'right' }}>
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
                    onClick={() => setSelectedTag(isActive ? null : tag)}
                    style={{
                      background: isActive ? 'var(--ink)' : '#fff',
                      border: `1.5px solid ${isActive ? 'var(--ink)' : '#D8D4C8'}`,
                      borderRadius: 8, padding: '22px 20px',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
                      color: isActive ? 'var(--paper)' : 'var(--ink)',
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 30px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = 'var(--ink)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = isActive ? 'var(--ink)' : '#D8D4C8'; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 6, background: isActive ? 'rgba(255,255,255,0.1)' : meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>
                      {meta.emoji}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{tag}</div>
                    <div className="font-mono" style={{ fontSize: 12, color: isActive ? 'rgba(245,242,234,0.6)' : '#8a8d99' }}>{count} set{count !== 1 ? 's' : ''}</div>
                    <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase', color: isActive ? 'var(--yellow)' : '#6b6f7d' }}>
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
              <h3 className="font-display" style={{ fontSize: 22, marginBottom: 24, letterSpacing: '-0.5px' }}>
                {tagMeta(selectedTag).emoji} {selectedTag}
              </h3>
              <div className="quiz-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {activeQuizzes.map((quiz) => {
                  const played = playedQuizIds.includes(quiz.id);
                  const diff = quiz.difficulty ? DIFF_STYLE[quiz.difficulty] : null;
                  return (
                    <div key={quiz.id} style={{
                      background: '#fff', border: '1.5px solid #D8D4C8',
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
                          <span style={{ background: '#DCF5E4', color: '#1b7a3d', fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', padding: '4px 8px', borderRadius: 3 }}>
                            ✓ Played
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 6, lineHeight: 1.3 }}>{quiz.title}</div>
                      <div style={{ fontSize: 13, color: '#6b6f7d', lineHeight: 1.5, flex: 1, marginBottom: 16 }}>
                        {quiz.description || 'A quick, friendly quiz experience.'}
                      </div>
                      {played ? (
                        <button
                          onClick={() => navigate(`/quiz/${quiz.id}?review=true`)}
                          style={{
                            background: 'transparent',
                            color: '#1b7a3d',
                            border: '1.5px solid #2ECC71',
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
                            background: 'var(--ink)', color: 'var(--paper)',
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
