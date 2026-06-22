import { useEffect, useState } from 'react';
import api from '../utils/api';

const medals = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/leaderboards/global')
      .then((response) => setLeaderboard(response.data.leaderboard))
      .catch((error) => {
        console.error('Unable to load leaderboard', error);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-10 shadow-2xl shadow-blue-200">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <h2 className="text-3xl font-bold text-white relative">🏆 Global Leaderboard</h2>
        <p className="mt-2 text-blue-100 font-medium relative">Top scores from players around the world.</p>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-lg border border-blue-50">
        {loading ? (
          <div className="text-center text-slate-400 font-medium py-8">Loading leaderboard…</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center text-slate-400 font-medium py-8">No scores yet. Be the first!</div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={`${entry.user?.id}-${entry.completedAt}`}
                className={`flex items-center justify-between gap-4 rounded-2xl p-4 transition ${
                  index === 0
                    ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200'
                    : index === 1
                    ? 'bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200'
                    : index === 2
                    ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200'
                    : 'bg-blue-50/50 border border-blue-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl w-8 text-center">{medals[index] || `#${index + 1}`}</span>
                  {entry.user?.pictureUrl ? (
                    <img
                      src={entry.user.pictureUrl}
                      alt={entry.user.name}
                      className="h-10 w-10 rounded-full ring-2 ring-blue-200"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
                      {entry.user?.name?.[0] || '?'}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900">{entry.user?.name || 'Anonymous'}</p>
                    <p className="text-xs text-slate-400">Quiz #{entry.quizId} · {new Date(entry.completedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                    {entry.score}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">points</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
