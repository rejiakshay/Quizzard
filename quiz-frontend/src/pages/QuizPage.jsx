import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

const TIMER_SECONDS = 10;

export default function QuizPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [currentQuestionResult, setCurrentQuestionResult] = useState(null);

  // Smooth timer
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

  const stopTimer = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  // Restart smooth timer on each new question
  useEffect(() => {
    if (!quiz || result) return;
    timedOutRef.current = false;
    setTimerPct(100);
    setTimeLeftDisplay(TIMER_SECONDS);
    startTimeRef.current = performance.now();

    const tick = (now) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      const remaining = Math.max(0, TIMER_SECONDS - elapsed);
      const pct = (remaining / TIMER_SECONDS) * 100;
      setTimerPct(pct);
      setTimeLeftDisplay(Math.ceil(remaining));

      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else if (!timedOutRef.current) {
        timedOutRef.current = true;
        // trigger timeout via state
        setTimeLeftDisplay(0);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [currentQuestionIndex, quiz, result]);

  // When display hits 0 with no answer, auto-mark wrong
  useEffect(() => {
    if (timeLeftDisplay === 0 && !currentQuestionResult && quiz) {
      stopTimer();
      const question = quiz.questions[currentQuestionIndex];
      const correctOption = question.options.find((o) => o.isCorrect);
      setCurrentQuestionResult({
        isCorrect: false,
        correctOptionId: correctOption?.id,
        correctOptionText: correctOption?.text,
        timedOut: true,
      });
    }
  }, [timeLeftDisplay, currentQuestionResult, quiz, currentQuestionIndex]);

  // Auto-advance 2 seconds after timeout
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
    setCurrentQuestionResult({
      isCorrect: option.isCorrect,
      correctOptionId: correctOption?.id,
      correctOptionText: correctOption?.text,
    });
  };

  const handleSubmit = async () => {
    const payload = {
      answers: Object.entries(answers).map(([questionId, optionId]) => ({
        questionId: Number(questionId),
        optionId,
      })),
    };
    const response = await api.post(`/quizzes/${id}/submit`, payload);
    setResult(response.data);
  };

  const handleNext = async () => {
    if (!quiz) return;
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
    if (isLastQuestion) {
      await handleSubmit();
      return;
    }
    setCurrentQuestionIndex((i) => i + 1);
    setSelectedOptionId(null);
    setCurrentQuestionResult(null);
  };

  if (loading) {
    return <div className="rounded-3xl bg-white p-8 shadow-lg text-center text-slate-400 font-medium">Loading quiz…</div>;
  }
  if (!quiz) {
    return <div className="rounded-3xl bg-white p-8 shadow-lg text-center text-slate-400 font-medium">Quiz not found.</div>;
  }

  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    const isGreat = pct >= 70;
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-10 shadow-2xl shadow-blue-200 text-center">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <p className="text-5xl mb-3">{isGreat ? '🎉' : '💪'}</p>
          <h2 className="text-3xl font-bold text-white">{quiz.title}</h2>
          <p className="mt-2 text-blue-100 font-medium">Quiz complete!</p>
          <div className="mt-6 inline-block rounded-2xl bg-white/20 backdrop-blur px-8 py-4">
            <p className="text-5xl font-extrabold text-white">
              {result.score}<span className="text-2xl font-semibold text-blue-200">/{result.total}</span>
            </p>
            <p className="text-blue-100 text-sm font-semibold mt-1">{pct}% correct</p>
          </div>
          <p className="mt-4 text-blue-100 font-medium">
            {isGreat ? 'Excellent work! You really know your stuff.' : 'Good effort! Keep practising to improve.'}
          </p>
        </section>
      </div>
    );
  }

  const question = quiz.questions[currentQuestionIndex];
  const isLastQuestion = quiz.questions.length === currentQuestionIndex + 1;
  const progressPct = (currentQuestionIndex / quiz.questions.length) * 100;

  const timerBarColor =
    timerPct > 50 ? '#3b82f6' :
    timerPct > 30 ? '#f59e0b' :
    '#ef4444';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <section className="rounded-3xl bg-white p-6 shadow-lg border border-blue-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-slate-900">{quiz.title}</h2>
          <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">
            {currentQuestionIndex + 1} / {quiz.questions.length}
          </span>
        </div>

        {/* Question progress */}
        <div className="h-2 rounded-full bg-blue-100 overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Countdown timer */}
        {!currentQuestionResult && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Time left</span>
              <span
                className="text-sm font-extrabold tabular-nums transition-colors duration-300"
                style={{ color: timerBarColor }}
              >
                {Math.max(0, timeLeftDisplay)}s
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${timerPct}%`,
                  backgroundColor: timerBarColor,
                  transition: 'background-color 0.5s ease',
                }}
              />
            </div>
          </div>
        )}

        {currentQuestionResult?.timedOut && (
          <p className="mt-2 text-xs font-semibold text-slate-400 text-center">Moving to next question…</p>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-lg border border-blue-50">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">
          Question {currentQuestionIndex + 1}
        </p>
        <h3 className="text-lg font-bold text-slate-900 leading-snug">{question.questionText}</h3>

        <div className="mt-5 grid gap-3">
          {question.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const showCorrect = currentQuestionResult && option.id === currentQuestionResult.correctOptionId;
            const isWrongSelected = currentQuestionResult && isSelected && !option.isCorrect;

            let btnClass = 'border-slate-200 bg-white text-slate-800 hover:border-blue-400 hover:bg-blue-50';
            if (currentQuestionResult) {
              if (isSelected && option.isCorrect) btnClass = 'border-emerald-400 bg-emerald-50 text-emerald-900 shadow-md shadow-emerald-100';
              else if (isWrongSelected) btnClass = 'border-rose-400 bg-rose-50 text-rose-900 shadow-md shadow-rose-100';
              else if (showCorrect) btnClass = 'border-emerald-400 bg-emerald-50 text-emerald-900';
              else btnClass = 'border-slate-100 bg-slate-50 text-slate-400';
            } else if (isSelected) {
              btnClass = 'border-blue-500 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-200';
            }

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option)}
                disabled={!!currentQuestionResult}
                className={`rounded-2xl border-2 px-5 py-3.5 text-left font-medium transition-all duration-200 disabled:cursor-default ${btnClass}`}
              >
                {option.text}
              </button>
            );
          })}
        </div>

        {currentQuestionResult && (
          <div className={`mt-5 rounded-2xl p-4 ${currentQuestionResult.isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
            <p className={`font-bold text-sm ${currentQuestionResult.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
              {currentQuestionResult.timedOut
                ? `⏱️ Time's up! The answer was: ${currentQuestionResult.correctOptionText}`
                : currentQuestionResult.isCorrect
                  ? '✅ Correct! Nice work.'
                  : `❌ Wrong! The answer is: ${currentQuestionResult.correctOptionText}`}
            </p>
            {question.funFact && (
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                <span className="font-semibold text-blue-700">Fun fact:</span> {question.funFact}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-400 font-medium">{Object.keys(answers).length} answered</p>
          {!currentQuestionResult?.timedOut && (
            <button
              type="button"
              onClick={handleNext}
              disabled={!currentQuestionResult}
              className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:from-blue-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLastQuestion ? 'Finish quiz 🎯' : 'Next question →'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
