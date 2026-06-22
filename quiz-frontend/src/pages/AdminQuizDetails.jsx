import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const emptyQuestion = {
  questionText: '',
  type: 'multiple_choice',
  order: 0,
  funFact: '',
  options: [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
};

export default function AdminQuizDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [newQuestion, setNewQuestion] = useState(emptyQuestion);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/quizzes/${id}`);
      setQuiz(response.data.quiz);
      setError('');
    } catch (err) {
      console.error('Unable to load quiz details', err);
      setError('Could not load quiz details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const handleUpdateQuiz = async () => {
    if (!quiz) return;
    try {
      const { title, description, tag, isPublished } = quiz;
      await api.patch(`/admin/quizzes/${quiz.id}`, { title, description, tag, isPublished });
      fetchQuiz();
      setError('');
    } catch (err) {
      console.error('Unable to save quiz details', err);
      setError('Failed to save quiz details.');
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quiz) return;
    try {
      await api.delete(`/admin/quizzes/${quiz.id}`);
      navigate('/admin');
    } catch (err) {
      console.error('Unable to delete quiz', err);
      setError('Failed to delete quiz.');
    }
  };

  const handleQuestionChange = (questionId, key, value) => {
    setQuiz((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === questionId ? { ...question, [key]: value } : question
      ),
    }));
  };

  const handleOptionChange = (questionId, optionIndex, key, value) => {
    setQuiz((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option, index) =>
                index === optionIndex ? { ...option, [key]: value } : option
              ),
            }
          : question
      ),
    }));
  };

  const handleSaveQuestion = async (question) => {
    try {
      await api.put(`/admin/quizzes/${quiz.id}/questions/${question.id}`, {
        questionText: question.questionText,
        type: question.type,
        order: question.order,
        funFact: question.funFact,
        options: question.options,
      });
      fetchQuiz();
      setError('');
    } catch (err) {
      console.error('Unable to save question', err);
      setError('Failed to save question.');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await api.delete(`/admin/quizzes/${quiz.id}/questions/${questionId}`);
      setQuiz((current) => ({
        ...current,
        questions: current.questions.filter((question) => question.id !== questionId),
      }));
      setError('');
    } catch (err) {
      console.error('Unable to delete question', err);
      setError('Failed to delete question.');
    }
  };

  const addQuestionOption = (questionId) => {
    setQuiz((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === questionId
          ? { ...question, options: [...question.options, { text: '', isCorrect: false }] }
          : question
      ),
    }));
  };

  const addNewQuestionOption = () => {
    setNewQuestion((current) => ({
      ...current,
      options: [...current.options, { text: '', isCorrect: false }],
    }));
  };

  const handleNewQuestionChange = (key, value) => {
    setNewQuestion((current) => ({ ...current, [key]: value }));
  };

  const handleNewQuestionOptionChange = (index, key, value) => {
    setNewQuestion((current) => ({
      ...current,
      options: current.options.map((option, idx) =>
        idx === index ? { ...option, [key]: value } : option
      ),
    }));
  };

  const handleCreateQuestion = async () => {
    if (!quiz) return;
    try {
      const response = await api.post(`/admin/quizzes/${quiz.id}/questions`, newQuestion);
      setQuiz((current) => ({
        ...current,
        questions: [...current.questions, response.data.question],
      }));
      setNewQuestion(emptyQuestion);
      setError('');
    } catch (err) {
      console.error('Unable to create question', err);
      setError('Failed to create question.');
    }
  };

  const removeNewQuestionOption = (index) => {
    setNewQuestion((current) => ({
      ...current,
      options: current.options.filter((_, idx) => idx !== index),
    }));
  };

  const inputCls = 'rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition w-full';
  const btnPrimary = 'rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:from-blue-700 hover:to-cyan-600 transition';
  const btnSecondary = 'rounded-2xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition';
  const btnDanger = 'rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition';
  const card = 'rounded-3xl bg-white p-6 shadow-lg border border-blue-50';

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-8 shadow-2xl shadow-blue-200">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Quiz Details</h2>
            <p className="mt-1 text-blue-100 font-medium">Manage this quiz, its questions and options.</p>
          </div>
          <Link to="/admin" className={btnSecondary}>← Back to Admin</Link>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

      {loading ? (
        <div className={card + ' text-center text-slate-400 font-medium'}>Loading quiz details…</div>
      ) : !quiz ? (
        <div className={card + ' text-center text-slate-400 font-medium'}>Quiz not found.</div>
      ) : (
        <div className="space-y-6">
          <section className={card}>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Quiz Info</h3>
            <div className="grid gap-3 sm:grid-cols-3 mb-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-blue-500">Title</label>
                <input type="text" value={quiz.title} onChange={(e) => setQuiz((c) => ({ ...c, title: e.target.value }))} className={inputCls + ' mt-1'} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-blue-500">Tag</label>
                <input type="text" value={quiz.tag || ''} onChange={(e) => setQuiz((c) => ({ ...c, tag: e.target.value }))} placeholder="General, Geography, Pub" className={inputCls + ' mt-1'} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-blue-500">Published</label>
                <label className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 cursor-pointer mt-1">
                  <input type="checkbox" checked={quiz.isPublished} onChange={(e) => setQuiz((c) => ({ ...c, isPublished: e.target.checked }))} className="h-4 w-4 accent-blue-600" />
                  <span className="text-sm font-medium text-slate-700">Published</span>
                </label>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wide text-blue-500">Description</label>
              <input type="text" value={quiz.description || ''} onChange={(e) => setQuiz((c) => ({ ...c, description: e.target.value }))} className={inputCls + ' mt-1'} />
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleUpdateQuiz} className={btnPrimary}>Save quiz</button>
              <button onClick={handleDeleteQuiz} className={btnDanger + ' px-5 py-2.5 text-sm'}>Delete quiz</button>
            </div>
          </section>

          <section className={card}>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Questions</h3>
            <p className="text-sm text-slate-500 mb-5">Edit question text, order, and answer options.</p>
            <div className="space-y-5">
              {quiz.questions?.length ? (
                quiz.questions.map((question) => (
                  <article key={question.id} className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <label className="text-xs font-bold uppercase tracking-wide text-blue-500">Question text</label>
                        <input type="text" value={question.questionText} onChange={(e) => handleQuestionChange(question.id, 'questionText', e.target.value)} className={inputCls + ' mt-1'} />
                      </div>
                      <button onClick={() => handleDeleteQuestion(question.id)} className={btnDanger}>Delete</button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3 mb-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-blue-500">Order</label>
                        <input type="number" value={question.order} onChange={(e) => handleQuestionChange(question.id, 'order', Number(e.target.value))} className={inputCls + ' mt-1'} />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-blue-500">Type</label>
                        <select value={question.type} onChange={(e) => handleQuestionChange(question.id, 'type', e.target.value)} className={inputCls + ' mt-1'}>
                          <option value="multiple_choice">Multiple choice</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-blue-500">Fun fact</label>
                        <input type="text" value={question.funFact || ''} onChange={(e) => handleQuestionChange(question.id, 'funFact', e.target.value)} className={inputCls + ' mt-1'} placeholder="Optional fun fact" />
                      </div>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-500 mb-2">Options</p>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="grid gap-2 md:grid-cols-[auto_1fr_auto] md:items-center">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={option.isCorrect} onChange={(e) => handleOptionChange(question.id, optionIndex, 'isCorrect', e.target.checked)} className="h-4 w-4 accent-blue-600" />
                            <span className="text-xs font-semibold text-slate-600">Correct</span>
                          </label>
                          <input type="text" value={option.text} onChange={(e) => handleOptionChange(question.id, optionIndex, 'text', e.target.value)} className={inputCls} placeholder="Option text" />
                          <button type="button" onClick={() => handleOptionChange(question.id, optionIndex, 'text', '')} className={btnSecondary + ' text-xs px-3 py-2'}>Clear</button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => addQuestionOption(question.id)} className={btnPrimary + ' text-xs px-3 py-1.5'}>+ Add option</button>
                      <button onClick={() => handleSaveQuestion(question)} className={btnSecondary + ' text-xs'}>Save question</button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-400 font-medium">No questions yet. Add one below.</p>
              )}
            </div>
          </section>

          <section className={card}>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Add New Question</h3>
            <div className="space-y-4">
              <input type="text" value={newQuestion.questionText} onChange={(e) => handleNewQuestionChange('questionText', e.target.value)} className={inputCls} placeholder="Question text" />
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-blue-500">Order</label>
                  <input type="number" value={newQuestion.order} onChange={(e) => handleNewQuestionChange('order', Number(e.target.value))} className={inputCls + ' mt-1'} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-blue-500">Type</label>
                  <select value={newQuestion.type} onChange={(e) => handleNewQuestionChange('type', e.target.value)} className={inputCls + ' mt-1'}>
                    <option value="multiple_choice">Multiple choice</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-blue-500">Fun fact</label>
                  <input type="text" value={newQuestion.funFact} onChange={(e) => handleNewQuestionChange('funFact', e.target.value)} className={inputCls + ' mt-1'} placeholder="Optional fun fact" />
                </div>
              </div>
              <div className="space-y-2">
                {newQuestion.options.map((option, index) => (
                  <div key={index} className="grid gap-2 md:grid-cols-[auto_1fr_auto] md:items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={option.isCorrect} onChange={(e) => handleNewQuestionOptionChange(index, 'isCorrect', e.target.checked)} className="h-4 w-4 accent-blue-600" />
                      <span className="text-xs font-semibold text-slate-600">Correct</span>
                    </label>
                    <input type="text" value={option.text} onChange={(e) => handleNewQuestionOptionChange(index, 'text', e.target.value)} className={inputCls} placeholder="Option text" />
                    <button type="button" onClick={() => removeNewQuestionOption(index)} className={btnDanger}>Remove</button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={addNewQuestionOption} className={btnPrimary + ' text-xs px-3 py-1.5'}>+ Add option</button>
                <button type="button" onClick={handleCreateQuestion} className={btnSecondary + ' text-xs'}>Create question</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
