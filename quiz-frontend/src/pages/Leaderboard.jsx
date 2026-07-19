import { useEffect, useState } from 'react';
import api from '../utils/api';

const medals = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaderboards/global')
      .then(r => setLeaderboard(r.data.leaderboard))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', padding: '48px 24px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--pink) 0%, #7c3aed 100%)',
          borderRadius: 12, padding: '32px 36px', marginBottom: 24,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <h2 className="font-display" style={{ fontSize: 28, color: '#fff', marginBottom: 6 }}>🏆 Global Leaderboard</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>Top scores from players around the world.</p>
        </div>

        {/* Entries */}
        <div style={{
          background: 'var(--surface)', borderRadius: 12, padding: 8,
          border: '1.5px solid var(--surface-border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--slate)', padding: '40px 0', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>Loading…</p>
          ) : leaderboard.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--slate)', padding: '40px 0', fontSize: 14 }}>No scores yet. Be the first!</p>
          ) : (
            leaderboard.map((entry, index) => {
              const isTop3 = index < 3;
              return (
                <div key={`${entry.user?.id}-${entry.completedAt}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                  padding: '14px 18px', borderRadius: 8, marginBottom: 4,
                  background: isTop3 ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: isTop3 ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                  transition: 'background 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: isTop3 ? 22 : 15, minWidth: 28, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', color: 'var(--slate)', fontWeight: 700 }}>
                      {medals[index] || `#${index + 1}`}
                    </span>
                    {entry.user?.pictureUrl ? (
                      <img src={entry.user.pictureUrl} alt={entry.user.name} style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--surface-border)', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--ink)', border: '2px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--paper)' }}>{(entry.user?.name || '?')[0]}</span>
                      </div>
                    )}
                    <div>
                      <p style={{ fontWeight: 700, color: 'var(--paper)', fontSize: 14, marginBottom: 2 }}>{entry.user?.name || 'Anonymous'}</p>
                      <p style={{ fontSize: 11, color: 'var(--slate)', fontFamily: 'JetBrains Mono, monospace' }}>
                        Quiz #{entry.quizId} · {new Date(entry.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: index === 0 ? 'var(--yellow)' : index === 1 ? 'var(--slate)' : index === 2 ? '#cd7c3a' : 'var(--paper)', lineHeight: 1 }}>
                      {entry.score}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--slate)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>pts</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
