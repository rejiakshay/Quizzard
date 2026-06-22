import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const TAG_META = {
  Geography:  { emoji: '🌍', gradient: 'from-cyan-500 to-blue-500',   light: 'bg-cyan-50  border-cyan-200  text-cyan-700'  },
  Movies:     { emoji: '🎬', gradient: 'from-rose-500 to-pink-500',   light: 'bg-rose-50  border-rose-200  text-rose-700'  },
  Science:    { emoji: '🔬', gradient: 'from-emerald-500 to-teal-500',light: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  History:    { emoji: '🏛️', gradient: 'from-amber-500 to-orange-500',light: 'bg-amber-50 border-amber-200 text-amber-700' },
  General:    { emoji: '🧠', gradient: 'from-violet-500 to-purple-500',light: 'bg-violet-50 border-violet-200 text-violet-700' },
  Pub:        { emoji: '🍺', gradient: 'from-yellow-500 to-amber-400', light: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
};

const defaultMeta = { emoji: '📚', gradient: 'from-blue-500 to-cyan-500', light: 'bg-blue-50 border-blue-200 text-blue-700' };

function tagMeta(tag) {
  return TAG_META[tag] || defaultMeta;
}

const difficultyLabel = { easy: { label: 'Easy', cls: 'bg-emerald-100 text-emerald-700' }, medium: { label: 'Medium', cls: 'bg-amber-100 text-amber-700' }, hard: { label: 'Hard', cls: 'bg-rose-100 text-rose-700' } };

export default function Home() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPlays, setTotalPlays] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const navigate = useNavigate();

  const handleStartQuiz = async (quizId) => {
    try {
      await api.post(`/quizzes/${quizId}/play`);
      setTotalPlays((prev) => (prev !== null ? prev + 1 : prev));
    } catch (err) {
      console.error('Failed to record play:', err);
    }
    navigate(`/quiz/${quizId}`);
  };

  useEffect(() => {
    api.get('/quizzes')
      .then((r) => setQuizzes(r.data.quizzes))
      .catch(console.error)
      .finally(() => setLoading(false));
    api.get('/quizzes/stats')
      .then((r) => setTotalPlays(r.data.totalPlays))
      .catch(console.error);
  }, []);

  // Group quizzes by tag
  const tagGroups = quizzes.reduce((acc, quiz) => {
    const tag = quiz.tag || 'General';
    if (!acc[tag]) acc[tag] = [];
    acc[tag].push(quiz);
    return acc;
  }, {});

  const tags = Object.keys(tagGroups).sort();
  const activeQuizzes = selectedTag ? (tagGroups[selectedTag] || []) : [];

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-10 shadow-2xl shadow-blue-200">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-cyan-400/20 blur-2xl" />
        <div className="relative">
          <span className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm mb-4">
            🎉 Welcome to Quizzard
          </span>
          <h2 className="text-4xl font-bold text-white leading-tight">
            Test your knowledge.<br />Challenge the world.
          </h2>
          <p className="mt-3 max-w-xl text-blue-100 font-medium">
            Play instantly as a guest, or sign in with Google to save your high scores and climb the leaderboard.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-5 py-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-white/20">🎮</div>
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Total Plays</p>
              <p className="text-white text-2xl font-extrabold leading-tight">
                {totalPlays !== null ? totalPlays.toLocaleString() : '—'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section>
        <h3 className="text-xl font-bold text-slate-800 mb-5">Quiz Categories</h3>
        {loading ? (
          <div className="rounded-3xl bg-white p-8 shadow-lg text-center text-slate-400 font-medium">Loading…</div>
        ) : tags.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 shadow-lg text-center text-slate-400 font-medium">No quizzes available yet.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => {
              const meta = tagMeta(tag);
              const count = tagGroups[tag].length;
              const isActive = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(isActive ? null : tag)}
                  className={`group relative overflow-hidden rounded-3xl p-6 text-left transition-all duration-300 shadow-lg hover:-translate-y-1 hover:shadow-xl ${
                    isActive
                      ? `bg-gradient-to-br ${meta.gradient} shadow-lg`
                      : 'bg-white border border-blue-50 hover:shadow-blue-100'
                  }`}
                >
                  <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl transition-opacity duration-300 ${isActive ? 'bg-white/15 opacity-100' : 'bg-blue-100 opacity-0 group-hover:opacity-100'}`} />
                  <div className="relative">
                    <div className={`inline-flex items-center justify-center h-12 w-12 rounded-2xl text-2xl mb-4 ${isActive ? 'bg-white/20' : `bg-gradient-to-br ${meta.gradient}`} shadow-md`}>
                      {meta.emoji}
                    </div>
                    <h4 className={`text-xl font-bold ${isActive ? 'text-white' : 'text-slate-900'}`}>{tag}</h4>
                    <p className={`mt-1 text-sm font-medium ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                      {count} quiz set{count !== 1 ? 's' : ''} available
                    </p>
                    <div className={`mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${isActive ? 'text-white/90' : 'text-blue-600'}`}>
                      {isActive ? '▲ Hide quizzes' : '▼ Browse quizzes'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Quiz List for selected tag */}
      {selectedTag && activeQuizzes.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">{tagMeta(selectedTag).emoji}</span>
            <h3 className="text-xl font-bold text-slate-800">{selectedTag} Quizzes</h3>
            <span className={`rounded-full px-3 py-0.5 text-xs font-bold border ${tagMeta(selectedTag).light}`}>
              {activeQuizzes.length} sets
            </span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeQuizzes.map((quiz) => {
              const diff = quiz.difficulty ? difficultyLabel[quiz.difficulty] : null;
              return (
                <article
                  key={quiz.id}
                  className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg border border-blue-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tagMeta(selectedTag).gradient} rounded-t-3xl`} />
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {diff && (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${diff.cls}`}>{diff.label}</span>
                      )}
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">{quiz.title}</h4>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                      {quiz.description || 'A quick, friendly quiz experience.'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartQuiz(quiz.id)}
                    className={`mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r ${tagMeta(selectedTag).gradient} px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90`}
                  >
                    Start quiz →
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
