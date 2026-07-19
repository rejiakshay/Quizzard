import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getLevel, LEVELS_CONFIG } from '../utils/levels';
import api from '../utils/api';

const wrap = { minHeight: '100vh', background: 'var(--ink)', padding: '40px 16px 80px' };
const inner = { maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 };
const card = {
  background: 'var(--surface)', color: 'var(--paper)',
  borderRadius: 10, padding: '28px 32px',
  border: '1.5px solid var(--surface-border)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
};
const label = { fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--slate)', marginBottom: 6 };

const STAR_COLORS = { active: '#FFC53D', inactive: 'rgba(255,255,255,0.15)' };

function Stars({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 28, padding: '2px 4px', color: n <= (hover || value) ? STAR_COLORS.active : STAR_COLORS.inactive, transition: 'color 0.1s' }}
        >★</button>
      ))}
    </div>
  );
}

function StatBox({ value, label: lbl, sub }) {
  return (
    <div style={{ flex: 1, minWidth: 100, background: 'var(--ink)', borderRadius: 8, padding: '16px 12px', textAlign: 'center' }}>
      <p className="font-mono" style={{ fontSize: 30, fontWeight: 700, color: 'var(--yellow)', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 12, color: 'var(--paper)', fontWeight: 600, marginTop: 6 }}>{lbl}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--slate)', marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [bio, setBio] = useState('');
  const [bioEditing, setBioEditing] = useState(false);
  const [bioSaving, setBioSaving] = useState(false);

  const [fbRating, setFbRating] = useState(0);
  const [fbMessage, setFbMessage] = useState('');
  const [fbName, setFbName] = useState('');
  const [fbEmail, setFbEmail] = useState('');
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbDone, setFbDone] = useState(false);
  const [fbError, setFbError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    setLoading(true);
    api.get('/auth/profile')
      .then(r => {
        setProfile(r.data);
        setBio(r.data.user?.bio || '');
        setFbName(r.data.user?.name || '');
        setFbEmail(r.data.user?.email || '');
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [user, navigate, refreshKey]);

  const saveBio = async () => {
    setBioSaving(true);
    try {
      await api.patch('/auth/profile', { bio });
      setUser(u => ({ ...u, bio }));
      setBioEditing(false);
    } catch {}
    setBioSaving(false);
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!fbMessage.trim()) { setFbError('Please write a message.'); return; }
    setFbSubmitting(true);
    setFbError('');
    try {
      await api.post('/auth/feedback', { rating: fbRating || null, message: fbMessage, name: fbName, email: fbEmail });
      setFbDone(true);
      setFbMessage('');
      setFbRating(0);
    } catch (err) {
      setFbError(err.response?.data?.message || 'Something went wrong.');
    }
    setFbSubmitting(false);
  };

  if (!user) return null;

  if (loading) return (
    <div style={wrap}><div style={{ ...inner, alignItems: 'center', paddingTop: 80 }}>
      <p style={{ color: 'var(--slate)', fontFamily: 'JetBrains Mono, monospace' }}>Loading profile…</p>
    </div></div>
  );

  const level = getLevel(user.totalPoints || 1000);
  const stats = profile?.stats || {};
  const categories = profile?.categories || [];
  const recentScores = profile?.recentScores || [];
  const topCategories = categories.slice(0, 4);

  const tierColors = { Amateur: '#8891A8', Expert: '#3b82f6', Master: '#a855f7', Grandmaster: '#FFC53D' };
  const tierColor = tierColors[level.tierName] || 'var(--pink)';

  return (
    <div style={wrap}>
      <div style={inner}>

        {/* ── Hero card ── */}
        <div style={{ ...card, padding: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: tierColor }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            {user.pictureUrl
              ? <img src={user.pictureUrl} alt="" style={{ width: 72, height: 72, borderRadius: '50%', border: `3px solid ${tierColor}`, flexShrink: 0 }} />
              : (
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--ink)', border: `3px solid ${tierColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 28, color: 'var(--paper)' }}>{(user.name || '?')[0].toUpperCase()}</span>
                </div>
              )
            }
            <div style={{ flex: 1 }}>
              <h1 className="font-display" style={{ fontSize: 26, color: 'var(--paper)', marginBottom: 4 }}>{user.name}</h1>
              <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 8 }}>{user.email}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ background: tierColor, color: '#fff', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, padding: '4px 10px', borderRadius: 4 }}>
                  {level.label}
                </span>
                <span style={{ fontSize: 12, color: 'var(--slate)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {(user.totalPoints || 1000).toLocaleString()} pts
                </span>
              </div>
              {/* Level progress bar */}
              <div style={{ marginTop: 12, maxWidth: 280 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--slate)' }}>Progress to next sub-level</span>
                  <span style={{ fontSize: 10, color: 'var(--slate)', fontFamily: 'JetBrains Mono, monospace' }}>{level.progressInSub}/{LEVELS_CONFIG.SUBLEVEL_SIZE}</span>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: tierColor, width: `${(level.progressInSub / LEVELS_CONFIG.SUBLEVEL_SIZE) * 100}%`, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── About Me ── */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={label}>About me</p>
            {!bioEditing && (
              <button onClick={() => setBioEditing(true)} style={{ fontSize: 12, color: 'var(--pink)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                {bio ? 'Edit' : '+ Add bio'}
              </button>
            )}
          </div>
          {bioEditing ? (
            <div>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Tell people a little about yourself…"
                style={{ width: '100%', borderRadius: 7, border: '1.5px solid var(--surface-border)', padding: '10px 14px', fontSize: 14, fontFamily: 'Inter, sans-serif', resize: 'vertical', outline: 'none', boxSizing: 'border-box', color: 'var(--paper)', background: 'rgba(0,0,0,0.25)' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => { setBioEditing(false); setBio(profile?.user?.bio || ''); }} style={{ fontSize: 13, padding: '8px 16px', borderRadius: 6, border: '1.5px solid var(--surface-border)', background: 'none', cursor: 'pointer', color: 'var(--slate)', fontWeight: 600 }}>Cancel</button>
                <button onClick={saveBio} disabled={bioSaving} style={{ fontSize: 13, padding: '8px 16px', borderRadius: 6, border: 'none', background: 'var(--pink)', color: '#fff', cursor: 'pointer', fontWeight: 700, opacity: bioSaving ? 0.6 : 1 }}>
                  {bioSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 14, color: bio ? 'var(--paper)' : 'var(--slate)', fontStyle: bio ? 'normal' : 'italic', lineHeight: 1.6 }}>
              {bio || 'No bio yet. Click "Add bio" to introduce yourself.'}
            </p>
          )}
        </div>

        {/* ── Progress stats ── */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <p style={label}>Progress</p>
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              style={{ fontSize: 11, color: 'var(--slate)', background: 'none', border: '1px solid var(--surface-border)', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}
            >↻ Refresh</button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <StatBox value={stats.totalQuizzes ?? 0} label="Quizzes" sub="completed" />
            <StatBox value={stats.totalCorrect ?? 0} label="Correct" sub="answers" />
            <StatBox value={stats.totalAnswered ?? 0} label="Questions" sub="answered" />
            <StatBox value={`${stats.accuracy ?? 0}%`} label="Accuracy" sub="overall" />
          </div>

          {/* Top performing categories */}
          {topCategories.length > 0 && (
            <>
              <p style={{ ...label, marginBottom: 12 }}>Top categories</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topCategories.map(cat => (
                  <div key={cat.tag}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--paper)' }}>{cat.tag}</span>
                      <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--slate)' }}>
                        {cat.correct}/{cat.total} · {cat.accuracy}%
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: cat.accuracy >= 80 ? 'var(--green)' : cat.accuracy >= 50 ? 'var(--yellow)' : 'var(--pink)', width: `${cat.accuracy}%`, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Recent quiz history */}
          {recentScores.length > 0 && (
            <>
              <p style={{ ...label, marginTop: 24, marginBottom: 12 }}>Recent quizzes</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentScores.map((s, i) => {
                  const pct = Math.round((s.score / s.total) * 100);
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: 7, border: '1px solid var(--surface-border)' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--paper)', marginBottom: 2 }}>{s.title}</p>
                        {s.tag && <p style={{ fontSize: 11, color: 'var(--slate)' }}>{s.tag}</p>}
                      </div>
                      <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: pct >= 70 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--pink)' }}>
                        {s.score}/{s.total}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {stats.totalQuizzes === 0 && (
            <p style={{ fontSize: 13, color: 'var(--slate)', fontStyle: 'italic', textAlign: 'center', paddingTop: 8 }}>
              No quizzes completed yet. Go play one!
            </p>
          )}
        </div>

        {/* ── Feedback ── */}
        <div style={card}>
          <p style={label}>Share feedback</p>
          <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 20 }}>
            We'd love to hear what you think about Quizzard — bugs, ideas, or just a shout-out. ♥
          </p>

          {fbDone ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>🙌</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--paper)', marginBottom: 4 }}>Thank you!</p>
              <p style={{ fontSize: 13, color: 'var(--slate)' }}>Your feedback helps make Quizzard better.</p>
              <button onClick={() => setFbDone(false)} style={{ marginTop: 16, fontSize: 12, color: 'var(--pink)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Submit another</button>
            </div>
          ) : (
            <form onSubmit={submitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Star rating */}
              <div>
                <p style={label}>Rating (optional)</p>
                <Stars value={fbRating} onChange={setFbRating} />
              </div>

              {/* Name + Email (pre-filled for logged-in users, editable for guests) */}
              {!user && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <p style={label}>Your name</p>
                    <input value={fbName} onChange={e => setFbName(e.target.value)} placeholder="Name" style={inputStyle} />
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <p style={label}>Email</p>
                    <input value={fbEmail} onChange={e => setFbEmail(e.target.value)} placeholder="email@example.com" type="email" style={inputStyle} />
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <p style={label}>Message <span style={{ color: 'var(--pink)' }}>*</span></p>
                <textarea
                  value={fbMessage}
                  onChange={e => { setFbMessage(e.target.value); setFbError(''); }}
                  placeholder="What's on your mind?"
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              {fbError && <p style={{ fontSize: 13, color: 'var(--pink)', fontWeight: 600 }}>{fbError}</p>}

              <button
                type="submit"
                disabled={fbSubmitting}
                style={{ alignSelf: 'flex-start', background: 'var(--pink)', color: '#fff', border: 'none', borderRadius: 7, padding: '11px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: fbSubmitting ? 0.7 : 1, transition: 'opacity 0.15s' }}
              >
                {fbSubmitting ? 'Sending…' : 'Send feedback'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', borderRadius: 7, border: '1.5px solid var(--surface-border)',
  padding: '10px 14px', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', color: 'var(--paper)', background: 'rgba(0,0,0,0.25)',
};
