import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { getLevel, applyQuizToGuest, getAnimationTier, LEVELS_CONFIG, getGuestPlayer, scoreQuiz } from '../utils/levels';
import { trackEvent } from '../utils/analytics';

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

function ChallengeShare({ quizTitle, score, total, quizId }) {
  const [copied, setCopied] = useState(false);
  const quizUrl = `${window.location.origin}/quiz/${quizId}`;
  const msg = `I just scored ${score}/${total} on "${quizTitle}" on Quizzard! 🧠 Think you can beat me? Try it:`;

  const share = (platform) => {
    const encoded = encodeURIComponent(msg);
    const encodedUrl = encodeURIComponent(quizUrl);
    const urls = {
      whatsapp:  `https://wa.me/?text=${encoded}%20${encodedUrl}`,
      telegram:  `https://t.me/share/url?url=${encodedUrl}&text=${encoded}`,
      twitter:   `https://twitter.com/intent/tweet?text=${encoded}&url=${encodedUrl}`,
      sms:       `sms:?body=${encoded}%20${quizUrl}`,
    };
    if (platform === 'instagram') {
      navigator.clipboard.writeText(`${msg} ${quizUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      window.open(urls[platform], '_blank', 'noopener,noreferrer');
    }
  };

  const platforms = [
    { key: 'whatsapp',  label: 'WhatsApp',  color: '#25D366', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.119.553 4.111 1.52 5.843L0 24l6.335-1.493A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.213-3.737.88.933-3.636-.235-.374A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
    )},
    { key: 'telegram',  label: 'Telegram',  color: '#229ED9', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
    )},
    { key: 'twitter',   label: 'X / Twitter', color: '#000000', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    )},
    { key: 'instagram', label: copied ? 'Copied!' : 'Instagram', color: '#E1306C', icon: copied
      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
      : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
    },
    { key: 'sms', label: 'SMS', color: '#34C759', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
    )},
  ];

  return (
    <div style={{ margin: '0 0 24px', padding: '20px', background: '#f0ece3', border: '1.5px dashed var(--paper-dim)', borderRadius: 10 }}>
      <p className="font-mono" style={{ fontSize: 11, color: 'var(--pink)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
        Challenge friends
      </p>
      <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 14 }}>
        Think your friends can beat your score? Send them the quiz link.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {platforms.map(({ key, label, color, icon }) => (
          <button
            key={key}
            onClick={() => share(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: color, color: '#fff',
              border: 'none', borderRadius: 7, padding: '9px 16px',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
      {copied && (
        <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 10, fontWeight: 600 }}>
          ✓ Link copied! Paste it on Instagram.
        </p>
      )}
    </div>
  );
}

const card = {
  background: 'var(--surface)', color: 'var(--paper)',
  borderRadius: 10, padding: '24px 28px',
  border: '1.5px solid var(--surface-border)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
};

export default function QuizPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isReview = searchParams.get('review') === 'true';
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [currentQuestionResult, setCurrentQuestionResult] = useState(null);
  const [pastResponses, setPastResponses] = useState(null);

  const [timerPct, setTimerPct] = useState(100);
  const [timeLeftDisplay, setTimeLeftDisplay] = useState(TIMER_SECONDS);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const timedOutRef = useRef(false);

  useEffect(() => {
    api.get(`/quizzes/${id}`)
      .then((r) => {
        setQuiz(r.data.quiz);
        if (!isReview) trackEvent('quiz_started', { quiz_id: Number(id), title: r.data.quiz?.title, tag: r.data.quiz?.tag, difficulty: r.data.quiz?.difficulty });
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    if (isReview && user) {
      api.get(`/quizzes/${id}/my-responses`)
        .then(r => setPastResponses(r.data.responses))
        .catch(() => setPastResponses([]));
    } else if (isReview) {
      setPastResponses([]);
    }
  }, [id, isReview, user]);

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
        const final = { ...data, ...levelResult };
        trackEvent('quiz_completed', { quiz_id: Number(id), title: quiz?.title, tag: quiz?.tag, difficulty: quiz?.difficulty, score: data.score, total: data.total, pct: Math.round((data.score / data.total) * 100), guest: true });
        setResult(final);
      } else {
        let resultData = { ...data };
        if (!data.levelAfter && user?.totalPoints !== undefined) {
          const earned = scoreQuiz(data.score, data.total);
          const before = getLevel(user.totalPoints);
          const newTotal = user.totalPoints + earned;
          resultData = { ...data, pointsEarned: earned, totalPoints: newTotal, levelBefore: before, levelAfter: getLevel(newTotal) };
        }
        trackEvent('quiz_completed', { quiz_id: Number(id), title: quiz?.title, tag: quiz?.tag, difficulty: quiz?.difficulty, score: resultData.score, total: resultData.total, pct: Math.round((resultData.score / resultData.total) * 100), points_earned: resultData.pointsEarned, level: resultData.levelAfter?.label });
        if (resultData.totalPoints) setUser(u => ({ ...u, totalPoints: resultData.totalPoints }));
        setResult(resultData);
      }
    } catch {
      const score = Object.entries(answers).reduce((acc, [questionId, optionId]) => {
        const q = quiz.questions.find((q) => q.id === Number(questionId));
        const correct = q?.options.find((o) => o.isCorrect);
        return acc + (correct?.id === optionId ? 1 : 0);
      }, 0);
      if (!user) {
        const levelResult = applyQuizToGuest(score, quiz.questions.length);
        trackEvent('quiz_completed', { quiz_id: Number(id), title: quiz?.title, tag: quiz?.tag, score, total: quiz.questions.length, pct: Math.round((score / quiz.questions.length) * 100), guest: true });
        setResult({ score, total: quiz.questions.length, details: [], ...levelResult });
      } else {
        const earned = scoreQuiz(score, quiz.questions.length);
        const before = getLevel(user.totalPoints);
        const newTotal = user.totalPoints + earned;
        trackEvent('quiz_completed', { quiz_id: Number(id), title: quiz?.title, tag: quiz?.tag, score, total: quiz.questions.length, pct: Math.round((score / quiz.questions.length) * 100), points_earned: earned });
        setUser(u => ({ ...u, totalPoints: newTotal }));
        setResult({ score, total: quiz.questions.length, details: [], pointsEarned: earned, totalPoints: newTotal, levelBefore: before, levelAfter: getLevel(newTotal) });
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

  // ── Review mode ──
  if (isReview) {
    const reviewLoading = user && pastResponses === null;
    const responseMap = {};
    (pastResponses || []).forEach(r => { responseMap[r.questionId] = r; });
    const hasHistory = user && pastResponses && pastResponses.length > 0;
    const correctCount = hasHistory ? (pastResponses || []).filter(r => r.isCorrect).length : null;

    return (
      <div style={wrap}>
        <div style={inner}>
          {/* Header */}
          <div style={{ ...card, padding: '20px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <p className="font-mono" style={{ fontSize: 10, color: 'var(--pink)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>Review mode</p>
                <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>{quiz.title}</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {hasHistory && (
                  <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--yellow)', background: 'rgba(255,197,61,0.1)', border: '1px solid rgba(255,197,61,0.25)', padding: '6px 12px', borderRadius: 6 }}>
                    Your score: {correctCount}/{quiz.questions.length}
                  </span>
                )}
                <button
                  onClick={() => navigate('/')}
                  style={{ background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: 6, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  ← Back
                </button>
              </div>
            </div>
          </div>

          {reviewLoading && (
            <div style={{ ...card, textAlign: 'center', color: 'var(--slate)', padding: '32px' }}>Loading your answers…</div>
          )}

          {!reviewLoading && !hasHistory && user && (
            <div style={{ ...card, textAlign: 'center', color: 'var(--slate)', fontSize: 13, padding: '20px' }}>
              No saved responses found for this quiz. Your answers may have been recorded before history tracking was enabled.
            </div>
          )}

          {!reviewLoading && !user && (
            <div style={{ ...card, textAlign: 'center', color: 'var(--slate)', fontSize: 13, padding: '20px' }}>
              Sign in to see your past answers. Showing correct answers only.
            </div>
          )}

          {/* Questions */}
          {!reviewLoading && quiz.questions.map((question, qi) => {
            const past = responseMap[question.id];
            const correctOption = question.options.find(o => o.isCorrect);

            return (
              <div key={question.id} style={{ ...card, padding: '22px 26px' }}>
                <p className="font-mono" style={{ fontSize: 10, color: 'var(--slate)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>
                  Question {qi + 1}
                </p>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.5, marginBottom: 16 }}>{question.questionText}</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {question.options.map((option) => {
                    const isCorrect = option.isCorrect;
                    const wasSelected = past?.selectedOptionId === option.id;
                    const wasWrong = wasSelected && !isCorrect;

                    let bg = 'rgba(255,255,255,0.04)', border = 'rgba(255,255,255,0.08)', color = 'var(--slate)';
                    if (isCorrect) { bg = 'rgba(46,204,113,0.15)'; border = 'var(--green)'; color = '#5eeaa0'; }
                    if (wasWrong)  { bg = 'rgba(255,59,105,0.15)'; border = 'var(--pink)'; color = '#ff8aaa'; }

                    return (
                      <div key={option.id} style={{
                        background: bg, border: `1.5px solid ${border}`, color,
                        borderRadius: 7, padding: '11px 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        fontSize: 14, fontWeight: isCorrect || wasWrong ? 600 : 400,
                      }}>
                        <span>{option.text}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>
                          {isCorrect && wasSelected && '✓ Your answer'}
                          {isCorrect && !wasSelected && (past ? '← Correct answer' : '✓ Correct')}
                          {wasWrong && '✗ Your answer'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {question.funFact && (
                  <div style={{ marginTop: 14, background: 'rgba(255,197,61,0.08)', border: '1px solid rgba(255,197,61,0.25)', borderRadius: 7, padding: '10px 14px' }}>
                    <p style={{ fontSize: 12, color: 'var(--slate)', lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 700, color: 'var(--yellow)' }}>💡 Fun fact: </span>{question.funFact}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={() => navigate('/')}
            style={{ alignSelf: 'center', background: 'var(--ink)', color: 'var(--paper)', border: 'none', borderRadius: 6, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 8 }}
          >
            ← Back to categories
          </button>
        </div>
      </div>
    );
  }

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
            <h2 className="font-display" style={{ fontSize: 24, color: 'var(--paper)', marginBottom: 4 }}>{quiz.title}</h2>
            <p style={{ color: 'var(--slate)', fontSize: 13, marginBottom: 24 }}>Quiz complete!</p>

            {/* Score */}
            <div style={{ display: 'inline-block', background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '18px 36px', marginBottom: 20 }}>
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
                  color: 'var(--green)', borderRadius: 6, padding: '6px 16px',
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 15,
                }}>
                  +{result.pointsEarned} pts
                  {result.score === result.total ? ' 🌟 Perfect bonus!' : ''}
                </span>
              </div>
            )}

            {/* Level info */}
            {levelAfter && (
              <div style={{ background: 'rgba(0,0,0,0.25)', border: '1.5px solid var(--surface-border)', borderRadius: 8, padding: '16px 20px', marginBottom: 20, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--slate)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Current level</p>
                    <p className="font-display" style={{ fontSize: 18, color: 'var(--yellow)' }}>{levelAfter.label}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: 'var(--slate)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Total points</p>
                    <p className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--paper)' }}>{result.totalPoints?.toLocaleString() ?? '—'}</p>
                  </div>
                </div>
                {/* Sub-level progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--slate)' }}>Progress to next level</span>
                    <span style={{ fontSize: 11, color: 'var(--slate)', fontFamily: 'JetBrains Mono, monospace' }}>{levelAfter.progressInSub}/{LEVELS_CONFIG.SUBLEVEL_SIZE}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
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

            <p style={{ color: 'var(--slate)', fontSize: 14, marginBottom: 24 }}>
              {isGreat ? 'Excellent work! You really know your stuff.' : 'Good effort! Keep practising to improve.'}
            </p>

            {/* Challenge friends */}
            <ChallengeShare quizTitle={quiz.title} score={result.score} total={result.total} quizId={id} />

            {/* Guest sign-in prompt */}
            {!user && (
              <div style={{
                margin: '8px 0 16px',
                background: 'rgba(255,197,61,0.08)',
                border: '1.5px solid rgba(255,197,61,0.3)',
                borderRadius: 10, padding: '18px 20px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--yellow)', marginBottom: 6 }}>
                  🏆 Want to appear on the leaderboard?
                </p>
                <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 16, lineHeight: 1.5 }}>
                  Sign in to save your score, track your progress, and compete with others. Your score right now: <strong style={{ color: 'var(--paper)' }}>{result.score}/{result.total}</strong>
                </p>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('quizzard:openLogin'))}
                  style={{
                    background: 'var(--yellow)', color: 'var(--ink)',
                    border: 'none', borderRadius: 6, padding: '11px 28px',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  Sign in to save score →
                </button>
              </div>
            )}

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
            <h2 style={{ fontWeight: 700, fontSize: 17, color: 'var(--paper)' }}>{quiz.title}</h2>
            <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', background: '#eee', padding: '4px 10px', borderRadius: 20 }}>
              {currentQuestionIndex + 1} / {quiz.questions.length}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ height: '100%', borderRadius: 99, background: 'var(--pink)', width: `${progressPct}%`, transition: 'width 0.4s ease' }} />
          </div>

          {/* Timer */}
          {!currentQuestionResult && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--slate)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time left</span>
                <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: timerColor }}>{Math.max(0, timeLeftDisplay)}s</span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
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
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--paper)', lineHeight: 1.4, marginBottom: 20 }}>{question.questionText}</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {question.options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              const showCorrect = currentQuestionResult && option.id === currentQuestionResult.correctOptionId;
              const isWrongSelected = currentQuestionResult && isSelected && !option.isCorrect;

              let bg = 'rgba(255,255,255,0.05)', border = 'rgba(255,255,255,0.1)', color = 'var(--paper)';
              if (currentQuestionResult) {
                if (isSelected && option.isCorrect) { bg = 'rgba(46,204,113,0.18)'; border = 'var(--green)'; color = '#5eeaa0'; }
                else if (isWrongSelected)            { bg = 'rgba(255,59,105,0.15)'; border = 'var(--pink)'; color = '#ff8aaa'; }
                else if (showCorrect)                { bg = 'rgba(46,204,113,0.12)'; border = 'var(--green)'; color = '#5eeaa0'; }
                else                                 { bg = 'rgba(255,255,255,0.03)'; border = 'rgba(255,255,255,0.06)'; color = 'var(--slate)'; }
              } else if (isSelected) {
                bg = 'var(--pink)'; border = 'var(--pink)'; color = '#fff';
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
              <p style={{ fontWeight: 700, fontSize: 14, color: currentQuestionResult.isCorrect ? 'var(--green)' : 'var(--pink)' }}>
                {currentQuestionResult.timedOut
                  ? `⏱️ Time's up! Answer: ${currentQuestionResult.correctOptionText}`
                  : currentQuestionResult.isCorrect
                    ? '✅ Correct! Nice work.'
                    : `❌ Wrong! Answer: ${currentQuestionResult.correctOptionText}`}
              </p>
              {question.funFact && (
                <p style={{ marginTop: 8, fontSize: 13, color: 'var(--slate)', lineHeight: 1.5 }}>
                  <b style={{ color: 'var(--yellow)' }}>Fun fact:</b> {question.funFact}
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
                  background: currentQuestionResult ? 'var(--pink)' : 'rgba(255,255,255,0.08)',
                  color: currentQuestionResult ? '#fff' : 'var(--slate)',
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
