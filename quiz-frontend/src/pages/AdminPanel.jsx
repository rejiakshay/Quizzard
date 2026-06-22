import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const emptyQuiz = {
  title: '',
  description: '',
  tag: '',
  difficulty: '',
  isPublished: false,
  questions: [],
};

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

const DIFFICULTY_MAP = { '1': 'easy', '2': 'medium', '3': 'hard' };

const sampleCsvTemplate = `Category,Level,Set,Qn No,Question,Option A,Option B,Option C,Option D,Answer,Fun Fact
Geography,1,1,1,🐨 This country is home to more species of venomous snakes than any other nation on Earth. Which country?,Brazil 🇧🇷,India 🇮🇳,Australia 🇦🇺,South Africa 🇿🇦,C) Australia,Australia has 21 of the world's 25 most venomous snakes.
`;

export default function AdminPanel() {
  const { user, setUser } = useContext(AuthContext);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuiz, setNewQuiz] = useState(emptyQuiz);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [newQuestion, setNewQuestion] = useState(emptyQuestion);
  const [error, setError] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [healthStatus, setHealthStatus] = useState('');
  const [healthLoading, setHealthLoading] = useState(false);

  // Bulk CSV state
  const [csvFileName, setCsvFileName] = useState('');
  const [csvError, setCsvError] = useState('');
  const [csvPreviewQuizzes, setCsvPreviewQuizzes] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvUploadResult, setCsvUploadResult] = useState('');

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/quizzes');
      setQuizzes(response.data.quizzes);
    } catch (err) {
      console.error('Unable to load admin quizzes', err);
      setError('Unable to load admin data. Are you logged in as an admin?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.isAdmin) {
      fetchQuizzes();
    } else {
      setQuizzes([]);
      setLoading(false);
    }
  }, [user]);

  const handleAdminLogin = async () => {
    setLoginError('');
    setError('');
    try {
      const response = await api.post('/auth/login', { username: adminUsername, password: adminPassword });
      const { token, user: userData } = response.data;
      localStorage.setItem('quizAppToken', token);
      setUser(userData);
      setAdminUsername('');
      setAdminPassword('');
    } catch (err) {
      const message = err?.response?.data?.message || 'Admin login failed.';
      setLoginError(message);
    }
  };

  const handleHealthCheck = async () => {
    setHealthStatus('');
    setHealthLoading(true);
    try {
      await api.get('/health');
      setHealthStatus('Backend is healthy.');
    } catch {
      setHealthStatus('Backend is not reachable.');
    } finally {
      setHealthLoading(false);
    }
  };

  const handleCreateQuiz = async () => {
    try {
      await api.post('/admin/quizzes', newQuiz);
      setNewQuiz(emptyQuiz);
      fetchQuizzes();
    } catch (err) {
      setError('Failed to create quiz.');
    }
  };

  const normalizeHeader = (h) => h.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

  const parseCsvText = (csvText) => {
    const rows = [];
    let row = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const next = csvText[i + 1];
      if (char === '"') {
        if (inQuotes && next === '"') { current += '"'; i++; continue; }
        inQuotes = !inQuotes; continue;
      }
      if (char === ',' && !inQuotes) { row.push(current); current = ''; continue; }
      if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && next === '\n') i++;
        row.push(current); rows.push(row); row = []; current = ''; continue;
      }
      current += char;
    }
    if (current !== '' || row.length > 0) { row.push(current); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim() !== ''));
  };

  const parseQuestionRow = (row, headerRow, rowIndex) => {
    const get = (key) => {
      const idx = headerRow.indexOf(normalizeHeader(key));
      return idx >= 0 ? (row[idx] || '').trim() : '';
    };

    const questionText = get('question') || get('questiontext');
    if (!questionText) throw new Error(`Missing Question on row ${rowIndex + 2}`);

    const rawOrder = get('qnno') || get('qno') || get('order');
    const order = rawOrder ? Number(rawOrder) : rowIndex + 1;
    const funFact = get('funfact');

    const optionLabels = ['optiona', 'optionb', 'optionc', 'optiond'];
    const options = optionLabels.map((l) => get(l)).filter(Boolean);
    if (options.length === 0) throw new Error(`No options on row ${rowIndex + 2}`);

    const correctRaw = get('answer') || get('correctanswer') || get('correctoption');
    const correctIndexes = [];
    if (correctRaw) {
      const letterMatch = correctRaw.match(/^[A-Za-z]/);
      if (letterMatch) {
        const idx = letterMatch[0].toUpperCase().charCodeAt(0) - 65;
        if (idx >= 0 && idx < options.length) correctIndexes.push(idx);
      }
    }
    if (correctIndexes.length === 0) throw new Error(`No correct answer on row ${rowIndex + 2}`);

    return {
      questionText,
      type: 'multiple_choice',
      order,
      funFact,
      options: options.map((text, i) => ({ text, isCorrect: correctIndexes.includes(i) })),
    };
  };

  const parseBulkCsv = (rows) => {
    if (rows.length < 2) throw new Error('CSV must have a header row and at least one question row.');
    const headerRow = rows[0].map(normalizeHeader);

    const hasCategory = headerRow.includes('category');
    const hasSet = headerRow.includes('set');

    if (!hasCategory || !hasSet) {
      throw new Error('CSV must include Category and Set columns to auto-create quiz sets.');
    }

    const getCol = (row, key) => {
      const idx = headerRow.indexOf(normalizeHeader(key));
      return idx >= 0 ? (row[idx] || '').trim() : '';
    };

    const groups = {};
    rows.slice(1).forEach((row, i) => {
      const category = getCol(row, 'category');
      const level = getCol(row, 'level');
      const set = getCol(row, 'set');
      if (!category || !set) return;
      const key = `${category}__${set}`;
      if (!groups[key]) groups[key] = { category, level, set, rows: [], startIndex: i };
      groups[key].rows.push({ row, globalIndex: i });
    });

    return Object.values(groups).map((group) => {
      const difficulty = DIFFICULTY_MAP[group.level] || 'easy';
      const questions = group.rows.map(({ row, globalIndex }) =>
        parseQuestionRow(row, headerRow, globalIndex)
      );
      return {
        title: `${group.category} - Set ${group.set}`,
        tag: group.category,
        difficulty,
        description: `${group.category} quiz · Set ${group.set} · ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`,
        isPublished: false,
        questions,
      };
    });
  };

  const handleCsvFileChange = async (e) => {
    const file = e.target.files?.[0];
    setCsvPreviewQuizzes(null);
    setCsvError('');
    setCsvFileName('');
    setCsvUploadResult('');
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) { setCsvError('Please upload a CSV file.'); return; }
    setCsvFileName(file.name);
    try {
      const text = await file.text();
      const parsed = parseBulkCsv(parseCsvText(text));
      setCsvPreviewQuizzes(parsed);
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : 'Unable to parse CSV.');
    }
  };

  const handleBulkUpload = async () => {
    if (!csvPreviewQuizzes?.length) return;
    setCsvUploading(true);
    setCsvUploadResult('');
    let created = 0;
    try {
      for (const quiz of csvPreviewQuizzes) {
        await api.post('/admin/quizzes', quiz);
        created++;
      }
      setCsvUploadResult(`✅ ${created} quiz set${created > 1 ? 's' : ''} created successfully!`);
      setCsvPreviewQuizzes(null);
      setCsvFileName('');
      fetchQuizzes();
    } catch (err) {
      setCsvUploadResult(`❌ Failed after creating ${created} quizzes.`);
    } finally {
      setCsvUploading(false);
    }
  };

  const handleTogglePublish = async (quizId, currentState) => {
    try {
      await api.post(`/admin/quizzes/${quizId}/publish`, { isPublished: !currentState });
      fetchQuizzes();
    } catch {
      setError('Failed to update quiz status.');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    try {
      await api.delete(`/admin/quizzes/${quizId}`);
      if (selectedQuiz?.id === quizId) setSelectedQuiz(null);
      fetchQuizzes();
    } catch {
      setError('Failed to delete quiz.');
    }
  };

  const handleUpdateQuiz = async () => {
    if (!selectedQuiz) return;
    try {
      const { title, description, isPublished } = selectedQuiz;
      await api.patch(`/admin/quizzes/${selectedQuiz.id}`, { title, description, isPublished });
      fetchQuizzes();
    } catch {
      setError('Failed to save quiz.');
    }
  };

  const handleQuestionChange = (questionId, key, value) => {
    setSelectedQuiz((c) => ({
      ...c,
      questions: c.questions.map((q) => q.id === questionId ? { ...q, [key]: value } : q),
    }));
  };

  const handleOptionChange = (questionId, optionIndex, key, value) => {
    setSelectedQuiz((c) => ({
      ...c,
      questions: c.questions.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.map((o, i) => i === optionIndex ? { ...o, [key]: value } : o) }
          : q
      ),
    }));
  };

  const handleSaveQuestion = async (question) => {
    try {
      await api.put(`/admin/quizzes/${selectedQuiz.id}/questions/${question.id}`, {
        questionText: question.questionText,
        type: question.type,
        order: question.order,
        options: question.options,
      });
      fetchQuizzes();
    } catch {
      setError('Failed to save question.');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await api.delete(`/admin/quizzes/${selectedQuiz.id}/questions/${questionId}`);
      setSelectedQuiz((c) => ({ ...c, questions: c.questions.filter((q) => q.id !== questionId) }));
      fetchQuizzes();
    } catch {
      setError('Failed to delete question.');
    }
  };

  const handleCreateQuestion = async () => {
    if (!selectedQuiz) return;
    try {
      const response = await api.post(`/admin/quizzes/${selectedQuiz.id}/questions`, newQuestion);
      setSelectedQuiz((c) => ({ ...c, questions: [...c.questions, response.data.question] }));
      setNewQuestion(emptyQuestion);
      fetchQuizzes();
    } catch {
      setError('Failed to create question.');
    }
  };

  const difficultyBadge = (d) => {
    if (d === 'easy') return 'bg-emerald-100 text-emerald-700';
    if (d === 'medium') return 'bg-amber-100 text-amber-700';
    if (d === 'hard') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-500';
  };

  const inputCls = 'rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition w-full';
  const btnPrimary = 'rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:from-blue-700 hover:to-cyan-600 transition';
  const btnSecondary = 'rounded-2xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition';
  const btnDanger = 'rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition';
  const card = 'rounded-3xl bg-white p-6 shadow-lg border border-blue-50';

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-10 shadow-2xl shadow-blue-200">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <h2 className="text-3xl font-bold text-white relative">⚙️ Admin Panel</h2>
        <p className="mt-2 text-blue-100 font-medium relative">Create quizzes, publish content, and manage questions.</p>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
      )}

      <section className={card}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-4 flex-1">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Admin Login</h3>
              <p className="mt-1 text-sm text-slate-500">Sign in to manage quizzes and content.</p>
            </div>
            {!user?.isAdmin ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input type="text" placeholder="Username" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} className={inputCls} />
                  <input type="password" placeholder="Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className={inputCls} onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()} />
                </div>
                <button type="button" onClick={handleAdminLogin} className={btnPrimary}>Sign in →</button>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                ✅ Signed in as admin. You can now manage quizzes.
              </div>
            )}
            {loginError && <p className="text-sm font-medium text-red-600">{loginError}</p>}
          </div>
          <div className="space-y-2">
            <button type="button" onClick={handleHealthCheck} disabled={healthLoading} className={btnSecondary + ' disabled:opacity-50'}>
              {healthLoading ? 'Checking…' : '🔍 Health check'}
            </button>
            {healthStatus && <p className="text-xs font-medium text-slate-500">{healthStatus}</p>}
          </div>
        </div>
      </section>

      {!user?.isAdmin && (
        <div className="rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-10 text-center">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-lg font-bold text-slate-700">Admin access required</p>
          <p className="mt-1 text-sm text-slate-500">Sign in with your admin credentials above to manage quizzes.</p>
        </div>
      )}

      {user?.isAdmin && <>

      {/* ── Bulk CSV Upload ── */}
      <section className={card}>
        <h3 className="text-xl font-bold text-slate-900 mb-1">📂 Bulk CSV Upload</h3>
        <p className="text-sm text-slate-500 mb-4">
          Upload a CSV with <strong>Category, Level, Set</strong> columns — each unique Category + Set becomes a separate quiz set automatically.
        </p>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            <input type="file" accept=".csv" onChange={handleCsvFileChange} className="flex-1 min-w-0 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none" />
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([sampleCsvTemplate], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.setAttribute('download', 'quiz-template.csv');
                document.body.appendChild(a); a.click();
                document.body.removeChild(a); URL.revokeObjectURL(url);
              }}
              className={btnSecondary + ' text-xs whitespace-nowrap'}
            >
              ⬇ Download template
            </button>
          </div>

          {csvFileName && <p className="text-xs text-slate-500 font-medium">📄 {csvFileName}</p>}
          {csvError && <p className="text-sm font-medium text-red-600">⚠️ {csvError}</p>}

          {csvPreviewQuizzes && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-700">Preview — {csvPreviewQuizzes.length} quiz set{csvPreviewQuizzes.length > 1 ? 's' : ''} detected:</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {csvPreviewQuizzes.map((q, i) => (
                  <div key={i} className="rounded-2xl border border-blue-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{q.title}</p>
                      <p className="text-xs text-slate-500">{q.questions.length} questions</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${difficultyBadge(q.difficulty)}`}>
                      {q.difficulty}
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleBulkUpload}
                disabled={csvUploading}
                className={btnPrimary + ' disabled:opacity-60 disabled:cursor-not-allowed'}
              >
                {csvUploading ? 'Creating quiz sets…' : `Upload ${csvPreviewQuizzes.length} quiz set${csvPreviewQuizzes.length > 1 ? 's' : ''} ✨`}
              </button>
            </div>
          )}

          {csvUploadResult && (
            <p className="text-sm font-semibold text-slate-700">{csvUploadResult}</p>
          )}
        </div>
      </section>

      {/* ── Manual Quiz Creation ── */}
      <section className={card}>
        <h3 className="text-xl font-bold text-slate-900 mb-4">✏️ Create Quiz Manually</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input type="text" placeholder="Quiz title" value={newQuiz.title} onChange={(e) => setNewQuiz((c) => ({ ...c, title: e.target.value }))} className={inputCls} />
          <input type="text" placeholder="Description" value={newQuiz.description} onChange={(e) => setNewQuiz((c) => ({ ...c, description: e.target.value }))} className={inputCls} />
          <input type="text" placeholder="Tag (Geography, Science…)" value={newQuiz.tag} onChange={(e) => setNewQuiz((c) => ({ ...c, tag: e.target.value }))} className={inputCls} />
          <select value={newQuiz.difficulty} onChange={(e) => setNewQuiz((c) => ({ ...c, difficulty: e.target.value }))} className={inputCls}>
            <option value="">Difficulty…</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <label className="mt-3 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 cursor-pointer w-fit">
          <input type="checkbox" checked={newQuiz.isPublished} onChange={(e) => setNewQuiz((c) => ({ ...c, isPublished: e.target.checked }))} className="h-4 w-4 accent-blue-600" />
          <span className="text-sm font-medium text-slate-700">Publish immediately</span>
        </label>
        <button onClick={handleCreateQuiz} className={'mt-4 ' + btnPrimary}>Create quiz ✨</button>
      </section>

      {/* ── Quiz List + Editor ── */}
      <section className="grid gap-6 lg:grid-cols-[350px_minmax(0,_1fr)]">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">All Quiz Sets</h3>
          {loading ? (
            <div className={card + ' text-slate-400 font-medium text-center'}>Loading…</div>
          ) : quizzes.length === 0 ? (
            <div className={card + ' text-slate-400 font-medium text-center'}>No quizzes yet.</div>
          ) : (
            quizzes.map((quiz) => (
              <article key={quiz.id} className="rounded-3xl bg-white p-5 shadow-lg border border-blue-50 hover:shadow-xl transition">
                <div className="flex flex-col gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900">{quiz.title}</h4>
                    {quiz.description && <p className="mt-1 text-sm text-slate-500">{quiz.description}</p>}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {quiz.tag && <span className="rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-semibold">{quiz.tag}</span>}
                      {quiz.difficulty && <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${difficultyBadge(quiz.difficulty)}`}>{quiz.difficulty}</span>}
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${quiz.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {quiz.isPublished ? '✅ Published' : '⏳ Draft'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/admin/${quiz.id}`} className={btnSecondary + ' text-xs'}>Manage</Link>
                    <button onClick={() => handleTogglePublish(quiz.id, quiz.isPublished)} className={btnPrimary + ' text-xs px-3 py-1.5'}>
                      {quiz.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onClick={() => handleDeleteQuiz(quiz.id)} className={btnDanger}>Delete</button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {selectedQuiz && (
          <div className="space-y-6">
            <section className={card}>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Edit Quiz</h3>
              <div className="space-y-3">
                <input type="text" value={selectedQuiz.title} onChange={(e) => setSelectedQuiz((c) => ({ ...c, title: e.target.value }))} className={inputCls} placeholder="Quiz title" />
                <input type="text" value={selectedQuiz.description || ''} onChange={(e) => setSelectedQuiz((c) => ({ ...c, description: e.target.value }))} className={inputCls} placeholder="Description" />
                <label className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 cursor-pointer">
                  <input type="checkbox" checked={selectedQuiz.isPublished} onChange={(e) => setSelectedQuiz((c) => ({ ...c, isPublished: e.target.checked }))} className="h-4 w-4 accent-blue-600" />
                  <span className="text-sm font-medium text-slate-700">Published</span>
                </label>
                <button onClick={handleUpdateQuiz} className={btnPrimary}>Save quiz</button>
              </div>
            </section>

            <section className={card}>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Questions</h3>
              <p className="text-sm text-slate-500 mb-5">Edit question text, options, and the correct answer.</p>
              <div className="space-y-5">
                {selectedQuiz.questions.map((question) => (
                  <article key={question.id} className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <label className="text-xs font-bold uppercase tracking-wide text-blue-500">Question text</label>
                        <input type="text" value={question.questionText} onChange={(e) => handleQuestionChange(question.id, 'questionText', e.target.value)} className={inputCls + ' mt-1'} />
                      </div>
                      <button onClick={() => handleDeleteQuestion(question.id)} className={btnDanger}>Delete</button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 mb-4">
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
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-500 mb-2">Options</p>
                    <div className="space-y-2">
                      {question.options.map((option, optIdx) => (
                        <div key={optIdx} className="grid gap-2 md:grid-cols-[auto_1fr_auto] md:items-center">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={option.isCorrect} onChange={(e) => handleOptionChange(question.id, optIdx, 'isCorrect', e.target.checked)} className="h-4 w-4 accent-blue-600" />
                            <span className="text-xs font-semibold text-slate-600">Correct</span>
                          </label>
                          <input type="text" value={option.text} onChange={(e) => handleOptionChange(question.id, optIdx, 'text', e.target.value)} className={inputCls} placeholder="Option text" />
                          <button type="button" onClick={() => handleOptionChange(question.id, optIdx, 'text', '')} className={btnSecondary + ' text-xs px-3 py-2'}>Clear</button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => handleSaveQuestion(question)} className={btnSecondary + ' text-xs'}>Save question</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className={card}>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Add New Question</h3>
              <input type="text" value={newQuestion.questionText} onChange={(e) => setNewQuestion((c) => ({ ...c, questionText: e.target.value }))} className={inputCls + ' mb-4'} placeholder="Question text" />
              <div className="space-y-2 mb-4">
                {newQuestion.options.map((option, index) => (
                  <div key={index} className="grid gap-2 md:grid-cols-[auto_1fr_auto] md:items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={option.isCorrect} onChange={(e) => setNewQuestion((c) => ({ ...c, options: c.options.map((o, i) => i === index ? { ...o, isCorrect: e.target.checked } : o) }))} className="h-4 w-4 accent-blue-600" />
                      <span className="text-xs font-semibold text-slate-600">Correct</span>
                    </label>
                    <input type="text" value={option.text} onChange={(e) => setNewQuestion((c) => ({ ...c, options: c.options.map((o, i) => i === index ? { ...o, text: e.target.value } : o) }))} className={inputCls} placeholder="Option text" />
                    <button type="button" onClick={() => setNewQuestion((c) => ({ ...c, options: c.options.filter((_, i) => i !== index) }))} className={btnDanger}>Remove</button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setNewQuestion((c) => ({ ...c, options: [...c.options, { text: '', isCorrect: false }] }))} className={btnPrimary + ' text-xs px-3 py-1.5'}>+ Add option</button>
                <button type="button" onClick={handleCreateQuestion} className={btnSecondary + ' text-xs'}>Create question</button>
              </div>
            </section>
          </div>
        )}
      </section>

      </>}
    </div>
  );
}
