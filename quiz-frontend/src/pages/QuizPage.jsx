import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { getLevel, applyQuizToGuest, getAnimationTier, LEVELS_CONFIG, getGuestPlayer } from '../utils/levels';

const TIMER_SECONDS = 10;

function LevelUpToast({ label }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => { const t = setTimeout(() => setVisible(false), 3500); return () => clearTimeout(t); }, []);
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 1000,
      background: 'var(--paper)', border: '2px solid var(--yellow)',
      borderRadius: 10, padding: '14px 20px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
      animation: 'slideInOut 3.5s ease forwards',
    }}>
      <style>{`@keyframes slideInOut{0%{transform:translateX(120%);opacity:0}10%{transform:translateX(0);opacity:1}85%{transform:translateX(0);opacity:1}100%{transform:translateX(120%);opacity:0}}`}</style>
      <span style={{ fontSize: 22, color: 'var(--yellow)' }}>★</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
        Level up! You're now <strong>{label}</strong>
      </span>
    </div>
  );
}

function TierUpOverlay({ tierName, label }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    color: i % 3 === 0 ? '#e8c97a' : i % 3 === 1 ? 'var(--pink)' : 'var(--yellow)',
  }));
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(18,23,43,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, animation: 'fadeInOverlay 0.4s ease forwards' }}>
      <style>{`
        @keyframes fadeInOverlay{from{opacity:0}to{opacity:1}}
        @keyframes popIn{from{transform:scale(0.7)}to{transform:scale(1)}}
        @keyframes fall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(500px) rotate(360deg);opacity:0}}
      `}</style>
      {pieces.map((p, i) => (
        <div key={i} style={{ position: 'absolute', width: 8, height: 8, borderRadius: 2, background: p.color, left: `${p.left}%`, top: -20, animation: `fall 2.2s ease-in ${p.delay}s forwards` }} />
      ))}
      <div style={{ background: 'var(--paper)', borderRadius: 16, padding: '48px 56px', textAlign: 'center', animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both', position: 'relative' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
        <p style={{ color: '#6b6f7d', fontSize: 15, marginBottom: 4 }}>You've reached a new tier</p>
        <p className="font-display" style={{ fontSize: 40, color: 'var(--yellow)', marginBottom: 6 }}>{tierName}</p>
        <p style={{ color: 'var(--slate)', fontSize: 15, marginBottom: 28 }}>{label}</p>
        <button
          onClick={() => setVisible(false)}
          style={{ background: 'var(--yellow)', color: 'var(--ink)', border: 'none', borderRadius: 8, padding: '12px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

const card = {
  background: 'var(--paper)', color: 'var(--ink)',
  borderRadius: 10, padding: '24px 28px',
  border: '1.5px solid var(--paper-dim)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
};

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [currentQuestionResult, setCurrentQuestionResult] = useState(null);

  const [timerPct, setTimerPct] = useState(100);
  const [timeLeftDisplay, setTimeLeftDisplay] = useState(TIMER_SECONDS);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const timedOutRef = useRef(false);

  useEffect(() => {
    api.get(`/quizzes/${id}`)
      .then((r) => setQuiz(r.data.quiz))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const stopTimer = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };

  useEffect(() => {
    if (!quiz || result) return;
    timedOutRef.current = false;
    setTimerPct(100);
    setTimeLeftDisplay(TIMER_SECONDS);
    startTimeRef.current = performance.now();
    const tick = (now) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      const remaining = Math.max(0, TIMER_SECONDS - elapsed);
      setTimerPct((remaining / TIMER_SECONDS) * 100);
      setTimeLeftDisplay(Math.ceil(remaining));
      if (remaining > 0) rafRef.current = requestAnimationFrame(tick);
      else if (!timedOutRef.current) { timedOutRef.current = true; setTimeLeftDisplay(0); }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [currentQuestionIndex, quiz, result]);

  useEffect(() => {
    if (timeLeftDisplay === 0 && !currentQuestionResult && quiz) {
      stopTimer();
      const question = quiz.questions[currentQuestionIndex];
      const correctOption = question.options.find((o) => o.isCorrect);
      setCurrentQuestionResult({ isCorrect: false, correctOptionId: correctOption?.id, correctOptionText: correctOption?.text, timedOut: true });
    }
  }, [timeLeftDisplay, currentQuestionResult, quiz, currentQuestionIndex]);

  useEffect(() => {
    if (!currentQuestionResult?.timedOut) return;
    const t = setTimeout(() => handleNext(), 2000);
    return () => clearTimeout(t);
  }, [currentQuestionResult]);

  const handleSelect = (option) => {
    if (currentQuestionResult) return;
    stopTimer();
    const question = quiz.questions[currentQuestionIndex];
    const correctOption = question.options.find((o) => o.isCorrect);
    setAnswers((c) => ({ ...c, [question.id]: option.id }));
    setSelectedOptionId(option.id);
    setCurrentQuestionResult({ isCorrect: option.isCorrect, correctOptionId: correctOption?.id, correctOptionText: correctOption?.text });
  };

  const handleSubmit = async () => {
    const payload = { answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId: Number(questionId), optionId })) };
    try {
      const response = await api.post(`/quizzes/${id}/submit`, payload);
      const data = response.data;
      const played = JSON.parse(localStorage.getItem('playedQuizIds') || '[]');
      if (!played.includes(Number(id))) localStorage.setItem('playedQuizIds', JSON.stringify([...played, Number(id)]));

      if (!user) {
        const levelResult = applyQuizToGuest(data.score, data.total);
        setResult({ ...data, ...levelResult });
      } else {
        // Update user totalPoints in context so Header reflects new level immediately
        if (data.totalPoints) setUser(u => ({ ...u, totalPoints: data.totalPoints }));
        setResult(data);
      }
    } catch {
      const score = Object.entries(answers).reduce((acc, [questionId, optionId]) => {
        const q = quiz.questions.find((q) => q.id === Number(questionId));
        const correct = q?.options.find((o) => o.isCorrect);
        return acc + (correct?.id === optionId ? 1 : 0);
      }, 0);
      if (!user) {
        const levelResult = applyQuizToGuest(score, quiz.questions.length);
        setResult({ score, total: quiz.questions.length, details: [], ...levelResult });
      } else {
        setResult({ score, total: quiz.questions.length, details: [] });
      }
    }
  };

  const handleNext = async () => {
    if (!quiz) return;
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
    if (isLastQuestion) { await handleSubmit(); return; }
    setCurrentQuestionIndex((i) => i + 1);
    setSelectedOptionId(null);
    setCurrentQuestionResult(null);
  };

  const wrap = { minHeight: 'calc(100vh - 64px)', background: 'var(--ink)', padding: '40px 24px' };
  const inner = { maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 };

  if (loading) return (
    <div style={wrap}><div style={{ ...inner, alignItems: 'center' }}>
      <div style={{ ...card, textAlign: 'center', color: 'var(--slate)' }}>Loading quiz…</div>
    </div></div>
  );
  if (!quiz) return (
    <div style={wrap}><div style={{ ...inner, alignItems: 'center' }}>
      <div style={{ ...card, textAlign: 'center', color: 'var(--slate)' }}>Quiz not found.</div>
    </div></div>
  );

  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    const isGreat = pct >= 70;
    const levelAfter = result.levelAfter || (result.totalPoints ? getLevel(result.totalPoints) : null);
    const levelBefore = result.levelBefore || null;
    const animTier = levelBefore && levelAfter ? getAnimationTier(levelBefore, levelAfter) : null;

    return (
      <div style={wrap}>
        {/* Sub-level toast */}
        {animTier === 'sublevel' && levelAfter && (
          <LevelUpToast label={levelAfter.label} />
        )}
        {/* Tier-up overlay */}
        {animTier === 'tier' && levelAfter && (
          <TierUpOverlay tierName={levelAfter.tierName} label={levelAfter.label} />
        )}

        <div style={inner}>
          <div style={{ ...card, textAlign: 'center', padding: '40px 32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: isGreat ? 'var(--green)' : 'var(--pink)' }} />

            <p style={{ fontSize: 52, marginBottom: 10 }}>{isGreat ? '🎉' : '💪'}</p>
            <h2 className="font-display" style={{ fontSize: 24, color: 'var(--ink)', marginBottom: 4 }}>{quiz.title}</h2>
            <p style={{ color: 'var(--slate)', fontSize: 13, marginBottom: 24 }}>Quiz complete!</p>

            {/* Score */}
            <div style={{ display: 'inline-block', background: 'var(--ink)', borderRadius: 10, padding: '18px 36px', marginBottom: 20 }}>
              <p className="font-mono" style={{ fontSize: 48, fontWeight: 700, color: isGreat ? 'var(--green)' : 'var(--pink)' }}>
                {result.score}<span style={{ fontSize: 22, color: 'var(--slate)' }}>/{result.total}</span>
              </p>
              <p style={{ color: 'var(--slate)', fontSize: 12, marginTop: 4 }}>{pct}% correct</p>
            </div>

            {/* Points earned */}
            {result.pointsEarned !== undefined && result.pointsEarned > 0 && (
              <div style={{ marginBottom: 20 }}>
                <span style={{
                  display: 'inline-block',
                  background: 'rgba(46,204,113,0.12)', border: '1px solid var(--green)',
                  color: '#1b7a3d', borderRadius: 6, padding: '6px 16px',
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 15,
                }}>
                  +{result.pointsEarned} pts
                  {result.score === result.total ? ' 🌟 Perfect bonus!' : ''}
                </span>
              </div>
            )}

            {/* Level info */}
            {levelAfter && (
              <div style={{ background: '#f8f6f1', border: '1.5px solid var(--paper-dim)', borderRadius: 8, padding: '16px 20px', marginBottom: 20, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--slate)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Current level</p>
                    <p className="font-display" style={{ fontSize: 18, color: 'var(--ink)' }}>{levelAfter.label}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: 'var(--slate)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Total points</p>
                    <p className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{result.totalPoints?.toLocaleString() ?? '—'}</p>
                  </div>
                </div>
                {/* Sub-level progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--slate)' }}>Progress to next level</span>
                    <span style={{ fontSize: 11, color: 'var(--slate)', fontFamily: 'JetBrains Mono, monospace' }}>{levelAfter.progressInSub}/{LEVELS_CONFIG.SUBLEVEL_SIZE}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: '#D8D4C8', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      background: 'linear-gradient(90deg, var(--pink), #ff6b8a)',
                      width: `${(levelAfter.progressInSub / LEVELS_CONFIG.SUBLEVEL_SIZE) * 100}%`,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              </div>
            )}

            <p style={{ color: '#6b6f7d', fontSize: 14, marginBottom: 24 }}>
              {isGreat ? 'Excellent work! You really know your stuff.' : 'Good effort! Keep practising to improve.'}
            </p>

            <button
              onClick={() => navigate('/')}
              style={{ background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: 6, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              ← Back to categories
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestionIndex];
  const isLastQuestion = quiz.questions.length === currentQuestionIndex + 1;
  const progressPct = (currentQuestionIndex / quiz.questions.length) * 100;
  const timerColor = timerPct > 50 ? '#3b82f6' : timerPct > 30 ? '#f59e0b' : '#ef4444';

  return (
    <div style={wrap}>
      <div style={inner}>
        {/* Header card */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>{quiz.title}</h2>
            <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', background: '#eee', padding: '4px 10px', borderRadius: 20 }}>
              {currentQuestionIndex + 1} / {quiz.questions.length}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 4, borderRadius: 99, background: '#D8D4C8', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ height: '100%', borderRadius: 99, background: 'var(--ink)', width: `${progressPct}%`, transition: 'width 0.4s ease' }} />
          </div>

          {/* Timer */}
          {!currentQuestionResult && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--slate)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time left</span>
                <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: timerColor }}>{Math.max(0, timeLeftDisplay)}s</span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: '#D8D4C8', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, backgroundColor: timerColor, width: `${timerPct}%`, transition: 'background-color 0.5s ease' }} />
              </div>
            </div>
          )}
          {currentQuestionResult?.timedOut && (
            <p style={{ fontSize: 12, color: 'var(--slate)', textAlign: 'center', marginTop: 8 }}>Moving to next question…</p>
          )}
        </div>

        {/* Question card */}
        <div style={card}>
          <p className="font-mono" style={{ fontSize: 11, color: 'var(--pink)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>
            Question {currentQuestionIndex + 1}
          </p>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.4, marginBottom: 20 }}>{question.questionText}</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {question.options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              const showCorrect = currentQuestionResult && option.id === currentQuestionResult.correctOptionId;
              const isWrongSelected = currentQuestionResult && isSelected && !option.isCorrect;

              let bg = '#fff', border = '#D8D4C8', color = 'var(--ink)';
              if (currentQuestionResult) {
                if (isSelected && option.isCorrect) { bg = 'rgba(46,204,113,0.12)'; border = 'var(--green)'; color = '#1b7a3d'; }
                else if (isWrongSelected)            { bg = 'rgba(255,59,105,0.08)'; border = 'var(--pink)'; color = '#b3325c'; }
                else if (showCorrect)                { bg = 'rgba(46,204,113,0.08)'; border = 'var(--green)'; color = '#1b7a3d'; }
                else                                 { bg = '#f8f8f6'; border = '#e8e4dc'; color = '#aaa'; }
              } else if (isSelected) {
                bg = 'var(--ink)'; border = 'var(--ink)'; color = 'var(--paper)';
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option)}
                  disabled={!!currentQuestionResult}
                  style={{
                    background: bg, border: `1.5px solid ${border}`, color,
                    borderRadius: 7, padding: '12px 16px', textAlign: 'left',
                    fontWeight: 500, fontSize: 14, cursor: currentQuestionResult ? 'default' : 'pointer',
                    transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <span>{option.text}</span>
                  {isSelected && option.isCorrect && <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span>}
                  {isWrongSelected && <span style={{ color: 'var(--pink)', fontWeight: 700 }}>✗</span>}
                  {!isSelected && showCorrect && <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span>}
                </button>
              );
            })}
          </div>

          {currentQuestionResult && (
            <div style={{
              marginTop: 16, borderRadius: 8, padding: '14px 16px',
              background: currentQuestionResult.isCorrect ? 'rgba(46,204,113,0.1)' : 'rgba(255,59,105,0.08)',
              border: `1px solid ${currentQuestionResult.isCorrect ? 'var(--green)' : 'var(--pink)'}`,
            }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: currentQuestionResult.isCorrect ? '#1b7a3d' : '#b3325c' }}>
                {currentQuestionResult.timedOut
                  ? `⏱️ Time's up! Answer: ${currentQuestionResult.correctOptionText}`
                  : currentQuestionResult.isCorrect
                    ? '✅ Correct! Nice work.'
                    : `❌ Wrong! Answer: ${currentQuestionResult.correctOptionText}`}
              </p>
              {question.funFact && (
                <p style={{ marginTop: 8, fontSize: 13, color: '#5a5d70', lineHeight: 1.5 }}>
                  <b style={{ color: 'var(--ink)' }}>Fun fact:</b> {question.funFact}
                </p>
              )}
            </div>
          )}

          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="font-mono" style={{ fontSize: 12, color: 'var(--slate)' }}>{Object.keys(answers).length} answered</span>
            {!currentQuestionResult?.timedOut && (
              <button
                onClick={handleNext}
                disabled={!currentQuestionResult}
                style={{
                  background: currentQuestionResult ? 'var(--pink)' : '#e0ddd6',
                  color: currentQuestionResult ? 'var(--ink)' : '#aaa',
                  border: 'none', borderRadius: 6,
                  padding: '11px 24px', fontWeight: 700, fontSize: 14,
                  cursor: currentQuestionResult ? 'pointer' : 'not-allowed',
                  boxShadow: currentQuestionResult ? '0 4px 0 var(--pink-dim)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {isLastQuestion ? 'Finish quiz 🎯' : 'Next question →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
