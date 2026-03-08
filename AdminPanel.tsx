import React, { useState, useRef } from 'react';
import { Question, QuizResult, Module, Difficulty, QuestionType, MODULES, getModuleInfo, DIFFICULTY_LABELS } from '../types';

interface AdminPanelProps {
  results: QuizResult[];
  onLogout: () => void;
  customQuestions: Question[];
  onAddQuestion: (q: Question) => void;
  onBulkAddQuestions: (questions: Question[]) => void;
  onDeleteQuestion: (id: string) => void;
  onUpdateQuestion: (q: Question) => void;
  onBackupRestore: (data: { questions: Question[]; results: QuizResult[] }) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  results, onLogout, customQuestions,
  onAddQuestion, onBulkAddQuestions, onDeleteQuestion, onUpdateQuestion,
  onBackupRestore
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scores' | 'questions' | 'addQuestion' | 'excelUpload' | 'backup'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showSuccess, setShowSuccess] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  // Question form
  const [formModule, setFormModule] = useState<Module>('airway');
  const [formDifficulty, setFormDifficulty] = useState<Difficulty>('basic');
  const [formType, setFormType] = useState<QuestionType>('theory');
  const [formQuestion, setFormQuestion] = useState('');
  const [formOptions, setFormOptions] = useState(['', '', '', '']);
  const [formCorrectAnswer, setFormCorrectAnswer] = useState<number>(-1);
  const [formExplanation, setFormExplanation] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // CSV
  const [csvData, setCsvData] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [uploadStep, setUploadStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup
  const [backupRestoreStatus, setBackupRestoreStatus] = useState('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<{ questions: Question[]; results: QuizResult[]; users: unknown[] } | null>(null);
  const backupFileRef = useRef<HTMLInputElement>(null);

  const filteredResults = results.filter(r => {
    const matchesSearch = r.emtName.toLowerCase().includes(searchTerm.toLowerCase()) || r.emtId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || r.date.startsWith(dateFilter);
    return matchesSearch && matchesDate;
  });

  const avgScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0;
  const passRate = results.length > 0 ? Math.round((results.filter(r => r.percentage >= 70).length / results.length) * 100) : 0;

  const getWeakestModule = (): string => {
    const ms: Record<string, { correct: number; total: number }> = {};
    results.forEach(r => { Object.entries(r.moduleScores).forEach(([mod, s]) => { if (!ms[mod]) ms[mod] = { correct: 0, total: 0 }; ms[mod].correct += s.correct; ms[mod].total += s.total; }); });
    let w = ''; let lp = 100;
    Object.entries(ms).forEach(([mod, s]) => { if (s.total > 0) { const p = (s.correct / s.total) * 100; if (p < lp) { lp = p; w = mod; } } });
    return w;
  };

  const downloadCSVFile = (content: string, filename: string) => {
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadReport = () => {
    let csv = 'EMT Name,EMT ID,Date,Score,Total,Percentage,Grade,Time Taken (s)\n';
    filteredResults.forEach(r => { const cg = r.grade.replace(/[🌟✅⚠️🔴]/g, '').trim(); csv += `"${r.emtName}","${r.emtId}","${new Date(r.date).toLocaleDateString()}",${r.score},${r.total},${r.percentage}%,"${cg}",${r.timeTaken}\n`; });
    downloadCSVFile(csv, `EMT_Report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const showSuccessMsg = (msg: string) => { setShowSuccess(msg); setTimeout(() => setShowSuccess(''), 4000); };

  const resetForm = () => {
    setFormModule('airway'); setFormDifficulty('basic'); setFormType('theory'); setFormQuestion('');
    setFormOptions(['', '', '', '']); setFormCorrectAnswer(-1);
    setFormExplanation(''); setFormErrors([]); setEditingQuestion(null); setShowPreview(false);
  };

  const loadQuestionForEdit = (q: Question) => {
    setEditingQuestion(q); setFormModule(q.module); setFormDifficulty(q.difficulty); setFormType(q.type);
    setFormQuestion(q.question); setFormOptions([...q.options]); setFormCorrectAnswer(q.correctAnswer);
    setFormExplanation(q.explanation);
    setFormErrors([]); setShowPreview(false); setActiveTab('addQuestion');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateForm = (): boolean => {
    const errs: string[] = [];
    if (!formQuestion.trim()) errs.push('Question text is required');
    if (formOptions.some(o => !o.trim())) errs.push('All 4 options are required');
    if (formCorrectAnswer === -1) errs.push('Select the correct answer');
    if (!formExplanation.trim()) errs.push('Explanation is required');
    const to = formOptions.map(o => o.trim().toLowerCase()).filter(o => o);
    if (new Set(to).size !== to.length) errs.push('Options must be unique');
    setFormErrors(errs); return errs.length === 0;
  };

  const handleSubmitQuestion = () => {
    if (!validateForm()) return;
    const question: Question = {
      id: editingQuestion ? editingQuestion.id : `Q-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      module: formModule, difficulty: formDifficulty, type: formType, question: formQuestion.trim(),
      options: formOptions.map(o => o.trim()),
      correctAnswer: formCorrectAnswer, explanation: formExplanation.trim(),
    };
    if (editingQuestion) { onUpdateQuestion(question); showSuccessMsg('✅ Question updated successfully!'); }
    else { onAddQuestion(question); showSuccessMsg('✅ Question added successfully!'); }
    resetForm(); setActiveTab('questions');
  };

  const confirmDeleteQuestion = (id: string) => {
    onDeleteQuestion(id);
    setDeleteConfirmId(null);
    setExpandedQ(null);
    showSuccessMsg('🗑️ Question deleted successfully!');
  };

  // CSV
  const downloadAllQuestionsAsCSV = () => {
    let csv = 'Module,Difficulty,Type,Question,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,Explanation\n';
    const cl = ['A', 'B', 'C', 'D'];
    customQuestions.forEach(q => {
      const ec = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
      csv += `${q.module},${q.difficulty},${q.type},${ec(q.question)},${ec(q.options[0])},${ec(q.options[1])},${ec(q.options[2])},${ec(q.options[3])},${cl[q.correctAnswer]},${ec(q.explanation)}\n`;
    });
    downloadCSVFile(csv, `EMT_Questions_${new Date().toISOString().split('T')[0]}.csv`);
    showSuccessMsg(`📥 ${customQuestions.length} questions exported!`);
  };

  const downloadQuestionTemplate = () => {
    const h = 'Module,Difficulty,Type,Question,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,Explanation\n';
    const modules = MODULES.map(m => m.key).join(' | ');
    const s = `airway,basic,theory,Sample question?,Option A,Option B,Option C,Option D,B,Explanation here\n# Valid modules: ${modules}\n# Valid difficulties: basic | intermediate | advanced\n# Valid types: theory | scenario | protocol\n# Valid answers: A | B | C | D\n`;
    downloadCSVFile(h + s, 'EMT_Question_Template.csv');
    showSuccessMsg('📥 Template downloaded!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => { const t = ev.target?.result as string; setCsvData(t); parseCSV(t); };
    r.readAsText(f);
  };

  const parseCSV = (text: string) => {
    const errors: string[] = []; const questions: Question[] = [];
    const parseLine = (line: string): string[] => {
      const r: string[] = []; let c = ''; let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { if (inQ && line[i + 1] === '"') { c += '"'; i++; } else inQ = !inQ; }
        else if (ch === ',' && !inQ) { r.push(c.trim()); c = ''; } else c += ch;
      }
      r.push(c.trim()); return r;
    };
    const lines = text.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    if (lines.length < 2) { errors.push('Need at least header + 1 data row'); setParseErrors(errors); return; }
    const validModuleKeys = MODULES.map(m => m.key);
    const vD: Difficulty[] = ['basic', 'intermediate', 'advanced'];
    const vT: QuestionType[] = ['theory', 'scenario', 'protocol'];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]); if (cols.length < 10) { errors.push(`Row ${i + 1}: Not enough columns (need 10)`); continue; }
      const [mod, diff, type, q, oA, oB, oC, oD, ca, exp] = cols;
      const m = mod.toLowerCase().trim(); if (!validModuleKeys.includes(m as Module)) { errors.push(`Row ${i + 1}: Invalid module "${mod}". Valid: ${validModuleKeys.join(', ')}`); continue; }
      const d = diff.toLowerCase().trim() as Difficulty; if (!vD.includes(d)) { errors.push(`Row ${i + 1}: Invalid difficulty "${diff}"`); continue; }
      const tp = type.toLowerCase().trim() as QuestionType; if (!vT.includes(tp)) { errors.push(`Row ${i + 1}: Invalid type "${type}"`); continue; }
      if (!q.trim()) { errors.push(`Row ${i + 1}: Empty question`); continue; }
      if (!oA.trim() || !oB.trim() || !oC.trim() || !oD.trim()) { errors.push(`Row ${i + 1}: All 4 options required`); continue; }
      const am: Record<string, number> = { 'A':0,'B':1,'C':2,'D':3,'a':0,'b':1,'c':2,'d':3,'1':0,'2':1,'3':2,'4':3 };
      const ci = am[ca.trim()]; if (ci === undefined) { errors.push(`Row ${i + 1}: Invalid answer "${ca}"`); continue; }
      if (!exp.trim()) { errors.push(`Row ${i + 1}: Explanation required`); continue; }
      questions.push({ id: `CSV-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`, module: m as Module, difficulty: d, type: tp, question: q.trim(),
        options: [oA.trim(), oB.trim(), oC.trim(), oD.trim()], correctAnswer: ci, explanation: exp.trim() });
    }
    setParsedQuestions(questions); setParseErrors(errors); setUploadStep('preview');
  };

  const handleConfirmUpload = () => { if (parsedQuestions.length === 0) return; onBulkAddQuestions(parsedQuestions); showSuccessMsg(`✅ ${parsedQuestions.length} questions imported!`); setParsedQuestions([]); setParseErrors([]); setCsvData(''); setUploadStep('done'); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const resetUpload = () => { setParsedQuestions([]); setParseErrors([]); setCsvData(''); setUploadStep('upload'); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const getFilteredQuestions = (): Question[] => {
    let qs = [...customQuestions];
    if (moduleFilter !== 'all') qs = qs.filter(q => q.module === moduleFilter);
    return qs;
  };

  // ===== BACKUP & RESTORE =====
  const getStorageSizeKB = (): number => {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('emt_')) {
        total += (localStorage.getItem(key) || '').length;
      }
    }
    return Math.round((total * 2) / 1024); // UTF-16 = 2 bytes per char
  };

  const handleCreateBackup = () => {
    try {
      const backupData: Record<string, unknown> = {
        _meta: {
          version: '2.0',
          createdAt: new Date().toISOString(),
          app: 'EMT Knowledge Test',
        },
        questions: customQuestions,
        results: results,
      };

      // Collect all emt_ keys from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('emt_') && key !== 'emt_custom_questions' && key !== 'emt_quiz_results') {
          try {
            backupData[key] = JSON.parse(localStorage.getItem(key) || '""');
          } catch {
            backupData[key] = localStorage.getItem(key);
          }
        }
      }

      const json = JSON.stringify(backupData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EMT_Backup_${new Date().toISOString().split('T')[0]}_${new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupRestoreStatus('✅ Backup downloaded successfully!');
      setTimeout(() => setBackupRestoreStatus(''), 4000);
    } catch (e) {
      console.error(e);
      setBackupRestoreStatus('❌ Backup failed!');
      setTimeout(() => setBackupRestoreStatus(''), 4000);
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.questions && !data.results) {
          setBackupRestoreStatus('❌ Invalid backup file format!');
          setTimeout(() => setBackupRestoreStatus(''), 4000);
          return;
        }
        setPendingRestoreData({
          questions: data.questions || [],
          results: data.results || [],
          users: data.emt_registered_users || [],
        });
        setShowRestoreConfirm(true);
      } catch {
        setBackupRestoreStatus('❌ Failed to parse backup file!');
        setTimeout(() => setBackupRestoreStatus(''), 4000);
      }
    };
    reader.readAsText(file);
    if (backupFileRef.current) backupFileRef.current.value = '';
  };

  const confirmRestore = (mode: 'replace' | 'merge') => {
    if (!pendingRestoreData) return;
    try {
      if (mode === 'replace') {
        // Replace everything
        onBackupRestore({ questions: pendingRestoreData.questions, results: pendingRestoreData.results });
        if (pendingRestoreData.users && Array.isArray(pendingRestoreData.users) && pendingRestoreData.users.length > 0) {
          localStorage.setItem('emt_registered_users', JSON.stringify(pendingRestoreData.users));
        }
      } else {
        // Merge — add only new items (by ID)
        const existingQIds = new Set(customQuestions.map(q => q.id));
        const existingRIds = new Set(results.map(r => r.id));
        const newQ = pendingRestoreData.questions.filter(q => !existingQIds.has(q.id));
        const newR = pendingRestoreData.results.filter(r => !existingRIds.has(r.id));
        onBackupRestore({
          questions: [...customQuestions, ...newQ],
          results: [...results, ...newR],
        });
        if (pendingRestoreData.users && Array.isArray(pendingRestoreData.users) && pendingRestoreData.users.length > 0) {
          try {
            const existing = JSON.parse(localStorage.getItem('emt_registered_users') || '[]');
            const existingIds = new Set(existing.map((u: { emtId: string }) => u.emtId));
            const newUsers = (pendingRestoreData.users as { emtId: string }[]).filter(u => !existingIds.has(u.emtId));
            localStorage.setItem('emt_registered_users', JSON.stringify([...existing, ...newUsers]));
          } catch { /* ignore */ }
        }
      }
      setShowRestoreConfirm(false);
      setPendingRestoreData(null);
      setBackupRestoreStatus(`✅ Data ${mode === 'replace' ? 'restored' : 'merged'} successfully!`);
      setTimeout(() => setBackupRestoreStatus(''), 4000);
    } catch (e) {
      console.error(e);
      setBackupRestoreStatus('❌ Restore failed!');
      setTimeout(() => setBackupRestoreStatus(''), 4000);
    }
  };

  const handleClearAllData = () => {
    if (!confirm('⚠️ Are you sure you want to DELETE ALL DATA?\n\nThis will remove:\n- All questions\n- All test results\n- All EMT user accounts\n\nThis action CANNOT be undone!')) return;
    if (!confirm('🛑 FINAL WARNING!\n\nThis will permanently delete EVERYTHING.\n\nClick OK to confirm.')) return;

    // Clear all emt_ keys
    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('emt_')) keysToDelete.push(key);
    }
    keysToDelete.forEach(key => localStorage.removeItem(key));

    onBackupRestore({ questions: [], results: [] });
    setBackupRestoreStatus('🗑️ All data cleared!');
    setTimeout(() => setBackupRestoreStatus(''), 4000);
  };

  const tabConfig = [
    { key: 'dashboard' as const, icon: '📊', label: 'Dashboard' },
    { key: 'scores' as const, icon: '📋', label: 'Scores' },
    { key: 'questions' as const, icon: '❓', label: `Q&A (${customQuestions.length})` },
    { key: 'addQuestion' as const, icon: '➕', label: 'Add Q' },
    { key: 'excelUpload' as const, icon: '📥', label: 'Excel' },
    { key: 'backup' as const, icon: '💾', label: 'Backup' },
  ];

  return (
    <div className="min-h-screen bg-[#0c1222] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-amber-600/[0.04] to-transparent"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* Header */}
      <div className="bg-[#0c1222]/90 backdrop-blur-xl border-b border-white/5 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500/25 to-orange-500/25 rounded-xl flex items-center justify-center border border-amber-500/20">
                <span className="text-xl">🛡️</span>
              </div>
              <div>
                <h1 className="font-black text-sm text-gradient-teal">Admin Panel</h1>
                <p className="text-[9px] text-gray-600">Training Officer Dashboard</p>
              </div>
            </div>
            <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 rounded-xl text-[11px] text-red-400 font-bold transition-all active:scale-95">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 relative z-10">
        {showSuccess && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3 flex items-center gap-3 text-sm text-emerald-300 animate-slide-down">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">✅</div>
            <span className="text-xs font-bold">{showSuccess}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-5 glass rounded-2xl p-1.5 overflow-x-auto">
          {tabConfig.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); if (tab.key === 'addQuestion' && !editingQuestion) resetForm(); if (tab.key === 'excelUpload') resetUpload(); }}
              className={`flex-1 py-2.5 px-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap active:scale-95 ${
                activeTab === tab.key
                  ? tab.key === 'addQuestion' ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-lg shadow-emerald-600/20'
                  : tab.key === 'backup' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-600/20'
                  : tab.key === 'excelUpload' ? 'bg-gradient-to-r from-teal-600 to-cyan-500 text-white shadow-lg shadow-teal-600/20'
                  : 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-lg shadow-amber-600/20'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ===== DASHBOARD ===== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { icon: '📝', value: results.length, label: 'Tests', color: 'from-teal-500/12 to-cyan-500/12 border-teal-500/15', vColor: 'text-teal-400' },
                { icon: '📊', value: `${avgScore}%`, label: 'Avg Score', color: 'from-emerald-500/12 to-green-500/12 border-emerald-500/15', vColor: 'text-emerald-400' },
                { icon: '🏆', value: `${passRate}%`, label: 'Pass Rate', color: 'from-amber-500/12 to-orange-500/12 border-amber-500/15', vColor: 'text-amber-400' },
                { icon: '⚠️', value: (() => { const w = getWeakestModule(); return w ? getModuleInfo(w).name.split(' ')[0] : 'N/A'; })(), label: 'Weakest', color: 'from-red-500/12 to-pink-500/12 border-red-500/15', vColor: 'text-red-400' },
              ].map((s, i) => (
                <div key={i} className={`bg-gradient-to-br ${s.color} border rounded-2xl p-4 text-center`}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className={`text-xl font-black ${s.vColor}`}>{s.value}</div>
                  <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {customQuestions.length === 0 && (
              <div className="bg-gradient-to-br from-amber-500/8 to-orange-500/8 border border-amber-500/15 rounded-3xl p-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-amber-500/15 rounded-2xl flex items-center justify-center text-3xl border border-amber-500/20 shrink-0">📝</div>
                  <div className="flex-1">
                    <h3 className="text-sm font-black text-amber-400 mb-1">No Questions Added Yet</h3>
                    <p className="text-[11px] text-gray-400 leading-relaxed">EMTs cannot take tests until you add questions. Use the "Add Q" tab or import from Excel.</p>
                  </div>
                  <button onClick={() => { resetForm(); setActiveTab('addQuestion'); }} className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-xl text-xs font-black transition-all active:scale-95 shrink-0">
                    ➕ Add Now
                  </button>
                </div>
              </div>
            )}

            <div className="glass-card rounded-3xl p-5">
              <h3 className="font-black text-sm mb-4 flex items-center gap-2">📚 Question Bank</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MODULES.map(mod => {
                  const c = customQuestions.filter(q => q.module === mod.key).length;
                  return (
                    <div key={mod.key} className="rounded-xl p-3 flex items-center justify-between border bg-white/[0.02] border-white/5">
                      <span className="text-xs flex items-center gap-2">{mod.icon} {mod.name}</span>
                      <span className="text-[11px] text-teal-400 font-mono font-bold">{c}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="font-black">Total Questions</span>
                <span className="text-teal-400 font-black">{customQuestions.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* ===== SCORES ===== */}
        {activeTab === 'scores' && (
          <div className="animate-fade-in">
            <div className="flex gap-2 mb-4 flex-wrap">
              <div className="flex-1 min-w-[200px] relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">🔍</span>
                <input type="text" placeholder="Search name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm placeholder:text-gray-700 focus:outline-none focus:border-teal-500/50 transition-all" />
              </div>
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500/50 transition-all" style={{ colorScheme: 'dark' }} />
            </div>
            <button onClick={downloadReport} className="w-full mb-4 glass hover:bg-emerald-500/10 border-emerald-500/20 rounded-2xl py-3 text-sm font-bold text-emerald-400 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
              📥 Download Report (CSV)
            </button>
            {filteredResults.length === 0 ? (
              <div className="text-center py-16 text-gray-600"><div className="text-6xl mb-4 opacity-15">📋</div><p className="text-sm font-black">No Results</p></div>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] text-gray-600 mb-2 font-bold">{filteredResults.length} results</p>
                {filteredResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(r => (
                  <div key={r.id} className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:bg-white/[0.03] transition-all">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-black shrink-0 ${
                      r.percentage >= 90 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                      r.percentage >= 75 ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20' :
                      r.percentage >= 60 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                      'bg-red-500/15 text-red-400 border border-red-500/20'
                    }`}>{r.percentage}%</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{r.emtName}</div>
                      <div className="text-[10px] text-gray-600 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{r.emtId}</span><span>•</span><span>{r.score}/{r.total}</span><span>•</span><span>{new Date(r.date).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                    <div className={`text-[10px] px-2.5 py-1.5 rounded-xl font-black ${r.percentage >= 70 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
                      {r.percentage >= 70 ? '✅ PASS' : '❌ FAIL'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== QUESTIONS ===== */}
        {activeTab === 'questions' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex gap-2 flex-wrap items-center">
              <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[11px] focus:outline-none focus:border-teal-500/50" style={{ colorScheme: 'dark' }}>
                <option value="all" className="bg-slate-800">All Modules</option>
                {MODULES.map(mod => (
                  <option key={mod.key} value={mod.key} className="bg-slate-800">{mod.icon} {mod.name}</option>
                ))}
              </select>
              <span className="text-[10px] text-gray-600 font-bold">{getFilteredQuestions().length} questions</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { resetForm(); setActiveTab('addQuestion'); }}
                className="glass border-dashed border-emerald-500/25 hover:bg-emerald-500/5 rounded-2xl py-3 text-xs font-black text-emerald-400 flex items-center justify-center gap-1.5 transition-all active:scale-95">
                ➕ Add Question
              </button>
              <button onClick={downloadAllQuestionsAsCSV} disabled={customQuestions.length === 0}
                className={`glass border-dashed rounded-2xl py-3 text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 ${customQuestions.length === 0 ? 'border-gray-700 text-gray-700 cursor-not-allowed' : 'border-teal-500/25 hover:bg-teal-500/5 text-teal-400'}`}>
                📥 Export CSV
              </button>
            </div>

            {(() => {
              const fq = getFilteredQuestions();
              if (fq.length === 0) return (
                <div className="text-center py-12 text-gray-600">
                  <div className="text-6xl mb-4 opacity-15">❓</div>
                  <p className="text-sm font-black mb-2">No Questions Found</p>
                  <p className="text-xs text-gray-700 mb-4">Add questions using the "Add Q" tab or import from Excel</p>
                  <button onClick={() => { resetForm(); setActiveTab('addQuestion'); }} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black transition-all active:scale-95">
                    ➕ Add First Question
                  </button>
                </div>
              );
              return (
                <div className="space-y-2">
                  {fq.map(q => {
                    const modInfo = getModuleInfo(q.module);
                    return (
                      <div key={q.id} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden transition-all">
                        <button type="button" onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                          className="w-full p-3.5 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors">
                          <span className="text-lg shrink-0">{modInfo.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate pr-2">{q.question}</p>
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              <span className="text-[8px] px-1.5 py-0.5 bg-gray-500/10 text-gray-400 rounded-full font-bold">{modInfo.name}</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${q.difficulty === 'basic' ? 'bg-green-500/10 text-green-400' : q.difficulty === 'intermediate' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>{q.difficulty}</span>
                              <span className="text-[8px] px-1.5 py-0.5 bg-teal-500/10 text-teal-300 rounded-full font-bold">{q.type}</span>
                            </div>
                          </div>
                          <span className="text-gray-600 text-xs shrink-0">{expandedQ === q.id ? '▲' : '▼'}</span>
                        </button>
                        {expandedQ === q.id && (
                          <div className="border-t border-white/5 p-4 bg-white/[0.01]">
                            <p className="text-xs font-semibold mb-3 leading-relaxed">{q.question}</p>
                            <div className="space-y-1.5 mb-3">
                              {q.options.map((opt, i) => (
                                <div key={i} className={`text-[11px] px-3 py-2 rounded-xl flex items-center gap-2 ${
                                  i === q.correctAnswer ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/15 font-bold' : 'bg-white/[0.02] text-gray-400 border border-white/5'
                                }`}>
                                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0 ${i === q.correctAnswer ? 'bg-emerald-500 text-white' : 'bg-white/5'}`}>{String.fromCharCode(65 + i)}</span>
                                  <span className="flex-1">{opt}</span>
                                  {i === q.correctAnswer && <span className="text-xs">✅</span>}
                                </div>
                              ))}
                            </div>
                            <div className="bg-teal-500/5 border border-teal-500/10 rounded-xl p-3 mb-3">
                              <p className="text-[11px] text-teal-300">💡 {q.explanation}</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => loadQuestionForEdit(q)} className="flex-1 py-2.5 bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/20 rounded-xl text-xs text-teal-300 font-bold transition-all active:scale-95">✏️ Edit</button>
                              <button onClick={() => setDeleteConfirmId(q.id)} className="flex-1 py-2.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 rounded-xl text-xs text-red-300 font-bold transition-all active:scale-95">🗑️ Delete</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ===== ADD QUESTION ===== */}
        {activeTab === 'addQuestion' && (
          <div className="animate-fade-in">
            <div className="glass-card rounded-3xl p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-base flex items-center gap-2">{editingQuestion ? '✏️ Edit' : '➕ New'} Question</h3>
                {editingQuestion && <button onClick={resetForm} className="text-[11px] text-gray-400 hover:text-white glass px-3 py-1.5 rounded-xl font-bold active:scale-95">❌ Cancel</button>}
              </div>

              {formErrors.length > 0 && (
                <div className="mb-5 bg-red-500/10 border border-red-500/15 rounded-2xl p-4 space-y-1">
                  {formErrors.map((e, i) => <p key={i} className="text-[11px] text-red-300">❌ {e}</p>)}
                </div>
              )}

              {/* Step 1 */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 bg-teal-600 rounded-lg flex items-center justify-center text-[10px] text-white font-black">1</div><span className="text-[11px] font-black text-teal-400 uppercase tracking-wider">Category</span></div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] text-gray-600 font-bold mb-1 uppercase">Module</label>
                    <select value={formModule} onChange={(e) => setFormModule(e.target.value as Module)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-teal-500/50" style={{ colorScheme: 'dark' }}>
                      {MODULES.map(m => <option key={m.key} value={m.key} className="bg-slate-800">{m.icon} {m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-600 font-bold mb-1 uppercase">Difficulty</label>
                    <select value={formDifficulty} onChange={(e) => setFormDifficulty(e.target.value as Difficulty)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-teal-500/50" style={{ colorScheme: 'dark' }}>
                      {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map(d => <option key={d} value={d} className="bg-slate-800">{DIFFICULTY_LABELS[d].en}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-600 font-bold mb-1 uppercase">Type</label>
                    <select value={formType} onChange={(e) => setFormType(e.target.value as QuestionType)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-teal-500/50" style={{ colorScheme: 'dark' }}>
                      <option value="theory" className="bg-slate-800">📖 Theory</option>
                      <option value="scenario" className="bg-slate-800">🏥 Scenario</option>
                      <option value="protocol" className="bg-slate-800">📋 Protocol</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 bg-teal-600 rounded-lg flex items-center justify-center text-[10px] text-white font-black">2</div><span className="text-[11px] font-black text-teal-400 uppercase tracking-wider">Question</span></div>
                <textarea value={formQuestion} onChange={(e) => setFormQuestion(e.target.value)} placeholder="Enter question text *" rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs placeholder:text-gray-700 focus:outline-none focus:border-teal-500/50 resize-none" />
              </div>

              {/* Step 3 */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1"><div className="w-6 h-6 bg-teal-600 rounded-lg flex items-center justify-center text-[10px] text-white font-black">3</div><span className="text-[11px] font-black text-teal-400 uppercase tracking-wider">Options</span></div>
                <p className="text-[10px] text-gray-600 mb-3 ml-8">Click letter to mark correct answer</p>
                <div className="space-y-2">
                  {formOptions.map((opt, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2 rounded-2xl transition-all ${formCorrectAnswer === i ? 'bg-emerald-500/[0.06] border border-emerald-500/15' : ''}`}>
                      <button type="button" onClick={() => setFormCorrectAnswer(i)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all border-2 active:scale-90 ${
                          formCorrectAnswer === i ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/30 scale-110' : 'bg-white/[0.02] border-white/10 text-gray-600 hover:border-teal-500/40'
                        }`}>{String.fromCharCode(65 + i)}</button>
                      <input type="text" value={opt} onChange={(e) => { const n = [...formOptions]; n[i] = e.target.value; setFormOptions(n); }}
                        placeholder={`Option ${String.fromCharCode(65 + i)} *`} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs placeholder:text-gray-700 focus:outline-none focus:border-teal-500/50" />
                      {formCorrectAnswer === i && <span className="text-emerald-400 shrink-0">✅</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 4 */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 bg-teal-600 rounded-lg flex items-center justify-center text-[10px] text-white font-black">4</div><span className="text-[11px] font-black text-teal-400 uppercase tracking-wider">Explanation</span></div>
                <textarea value={formExplanation} onChange={(e) => setFormExplanation(e.target.value)} placeholder="Explanation for the correct answer *" rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs placeholder:text-gray-700 focus:outline-none focus:border-teal-500/50 resize-none" />
              </div>

              {/* Preview */}
              <button onClick={() => setShowPreview(!showPreview)} className="w-full mb-4 glass hover:bg-teal-500/5 rounded-2xl py-2.5 text-[11px] font-bold text-teal-400 transition-all active:scale-[0.98]">
                👁️ {showPreview ? 'Hide' : 'Show'} Preview
              </button>
              {showPreview && formQuestion && (
                <div className="mb-5 glass-card rounded-2xl p-4 border-teal-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-teal-400 font-black">PREVIEW</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-lg font-bold bg-teal-500/10 text-teal-300">
                      {getModuleInfo(formModule).icon} {getModuleInfo(formModule).name}
                    </span>
                  </div>
                  <p className="text-xs font-bold mb-3">{formQuestion}</p>
                  <div className="space-y-1.5">
                    {formOptions.map((o, i) => o.trim() && (
                      <div key={i} className={`text-[11px] px-3 py-2 rounded-xl flex items-center gap-2 border ${i === formCorrectAnswer ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/15 font-bold' : 'bg-white/[0.02] text-gray-500 border-white/5'}`}>
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black ${i === formCorrectAnswer ? 'bg-emerald-500 text-white' : 'bg-white/5'}`}>{String.fromCharCode(65 + i)}</span>
                        {o} {i === formCorrectAnswer && '✅'}
                      </div>
                    ))}
                  </div>
                  {formExplanation && (
                    <div className="mt-3 bg-teal-500/5 border border-teal-500/10 rounded-xl p-3">
                      <p className="text-[11px] text-teal-300">💡 {formExplanation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => { resetForm(); setActiveTab('questions'); }} className="flex-1 glass hover:bg-white/10 rounded-2xl py-3.5 font-bold text-xs transition-all active:scale-95">❌ Cancel</button>
                <button onClick={handleSubmitQuestion} className="flex-[2] bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 rounded-2xl py-3.5 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-600/20">
                  {editingQuestion ? '💾 Update' : '➕ Add'} Question
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== EXCEL ===== */}
        {activeTab === 'excelUpload' && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-card rounded-3xl p-5">
              <h3 className="font-black text-base mb-4 flex items-center gap-2">📥 Export</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={downloadAllQuestionsAsCSV} disabled={customQuestions.length === 0}
                  className={`bg-gradient-to-br rounded-2xl py-5 font-bold text-xs flex flex-col items-center gap-2 transition-all active:scale-95 ${
                    customQuestions.length === 0 ? 'from-gray-500/5 to-gray-600/5 border border-gray-500/10 text-gray-600 cursor-not-allowed' : 'from-teal-500/15 to-cyan-500/15 border border-teal-500/20 hover:bg-teal-500/20'
                  }`}>
                  <span className="text-3xl">📊</span><span>All Questions</span><span className="text-[9px] text-gray-500">({customQuestions.length} as CSV)</span>
                </button>
                <button onClick={downloadQuestionTemplate} className="bg-gradient-to-br from-emerald-500/15 to-green-500/15 border border-emerald-500/20 rounded-2xl py-5 font-bold text-xs flex flex-col items-center gap-2 transition-all hover:bg-emerald-500/20 active:scale-95">
                  <span className="text-3xl">📋</span><span>Template</span><span className="text-[9px] text-gray-500">(with sample)</span>
                </button>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-5">
              <h3 className="font-black text-base mb-2 flex items-center gap-2">📤 Import</h3>
              <p className="text-[10px] text-gray-600 mb-4">Valid modules: {MODULES.map(m => `${m.icon} ${m.key}`).join(', ')}</p>
              {uploadStep === 'upload' && (
                <>
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-teal-500/30 transition-all mb-4">
                    <input type="file" accept=".csv,.txt" onChange={handleFileUpload} ref={fileInputRef} className="hidden" id="csv-upload" />
                    <label htmlFor="csv-upload" className="cursor-pointer"><div className="text-5xl mb-3 opacity-60">📂</div><p className="font-black text-xs mb-1">Upload CSV</p><p className="text-[10px] text-gray-600">.csv or .txt files</p></label>
                  </div>
                  <textarea value={csvData} onChange={(e) => setCsvData(e.target.value)} placeholder="Or paste CSV data here..." rows={4}
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3 text-[11px] font-mono placeholder:text-gray-700 focus:outline-none focus:border-teal-500/50 resize-none" />
                  {csvData.trim() && <button onClick={() => parseCSV(csvData)} className="mt-2 w-full bg-teal-600 hover:bg-teal-500 rounded-2xl py-3 font-black text-xs transition-all active:scale-95">🔍 Parse</button>}
                </>
              )}
              {uploadStep === 'preview' && (
                <>
                  <div className="flex gap-3 mb-4">
                    {parsedQuestions.length > 0 && <div className="bg-emerald-500/10 border border-emerald-500/15 rounded-xl px-4 py-2"><span className="text-lg font-black text-emerald-400">{parsedQuestions.length}</span><span className="text-[10px] text-emerald-300 ml-1.5">Valid</span></div>}
                    {parseErrors.length > 0 && <div className="bg-red-500/10 border border-red-500/15 rounded-xl px-4 py-2"><span className="text-lg font-black text-red-400">{parseErrors.length}</span><span className="text-[10px] text-red-300 ml-1.5">Errors</span></div>}
                  </div>
                  {parseErrors.length > 0 && <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 mb-4 max-h-32 overflow-y-auto">{parseErrors.map((e, i) => <p key={i} className="text-[10px] text-red-300/80 py-0.5">⚠️ {e}</p>)}</div>}
                  {parsedQuestions.length > 0 && (
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto mb-4">
                      {parsedQuestions.map((q, i) => {
                        const qMod = getModuleInfo(q.module);
                        return (
                          <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                            <div className="flex items-center gap-1.5 mb-1"><span className="text-[9px] text-gray-500 font-mono">#{i + 1}</span><span className="text-[9px] px-1.5 py-0.5 bg-teal-500/15 text-teal-300 rounded-full">{qMod.icon} {q.module}</span></div>
                            <p className="text-[11px] font-semibold truncate">{q.question}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={resetUpload} className="flex-1 glass rounded-2xl py-3 font-bold text-xs transition-all active:scale-95">❌ Cancel</button>
                    {parsedQuestions.length > 0 && <button onClick={handleConfirmUpload} className="flex-[2] bg-gradient-to-r from-emerald-600 to-green-500 rounded-2xl py-3 font-black text-xs transition-all active:scale-95 shadow-lg shadow-emerald-600/20">✅ Import {parsedQuestions.length}</button>}
                  </div>
                </>
              )}
              {uploadStep === 'done' && (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4 animate-bounce-in">🎉</div>
                  <h3 className="text-lg font-black text-emerald-400 mb-2">Success!</h3>
                  <div className="flex gap-3 justify-center mt-4">
                    <button onClick={resetUpload} className="px-5 py-2.5 bg-teal-600 rounded-xl font-bold text-xs transition-all active:scale-95">📤 More</button>
                    <button onClick={() => { setActiveTab('questions'); }} className="px-5 py-2.5 bg-amber-600 rounded-xl font-bold text-xs transition-all active:scale-95">❓ View</button>
                  </div>
                </div>
              )}
            </div>

            {/* CSV Format Guide */}
            <div className="glass-card rounded-3xl p-5">
              <h3 className="font-black text-sm mb-3 flex items-center gap-2">📖 CSV Format Guide</h3>
              <div className="overflow-x-auto">
                <table className="text-[10px] w-full">
                  <thead>
                    <tr className="text-gray-500 border-b border-white/5">
                      <th className="py-2 px-2 text-left font-black">#</th>
                      <th className="py-2 px-2 text-left font-black">Column</th>
                      <th className="py-2 px-2 text-left font-black">Values</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-400">
                    {[
                      ['1', 'Module', MODULES.map(m => m.key).join(', ')],
                      ['2', 'Difficulty', 'basic, intermediate, advanced'],
                      ['3', 'Type', 'theory, scenario, protocol'],
                      ['4', 'Question', 'Question text'],
                      ['5-8', 'OptionA-D', '4 answer options'],
                      ['9', 'CorrectAnswer', 'A, B, C, or D'],
                      ['10', 'Explanation', 'Explanation text'],
                    ].map(([n, col, val], i) => (
                      <tr key={i} className="border-b border-white/[0.02]">
                        <td className="py-1.5 px-2 font-mono text-teal-400">{n}</td>
                        <td className="py-1.5 px-2 font-bold">{col}</td>
                        <td className="py-1.5 px-2 text-gray-500">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== BACKUP & RESTORE ===== */}
        {activeTab === 'backup' && (
          <div className="space-y-4 animate-fade-in">
            {backupRestoreStatus && (
              <div className={`rounded-2xl px-4 py-3 flex items-center gap-3 text-xs font-bold animate-slide-down ${
                backupRestoreStatus.startsWith('✅') || backupRestoreStatus.startsWith('🗑️')
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/20 text-red-300'
              }`}>
                {backupRestoreStatus}
              </div>
            )}

            {/* Current Data Overview */}
            <div className="glass-card rounded-3xl p-5">
              <h3 className="font-black text-base mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center">💾</div>
                Local Storage Data
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                {[
                  { icon: '❓', label: 'Questions', value: customQuestions.length, color: 'text-teal-400' },
                  { icon: '📝', label: 'Test Results', value: results.length, color: 'text-emerald-400' },
                  { icon: '👥', label: 'EMT Users', value: (() => { try { return JSON.parse(localStorage.getItem('emt_registered_users') || '[]').length; } catch { return 0; } })(), color: 'text-amber-400' },
                  { icon: '💿', label: 'Storage Used', value: `${getStorageSizeKB()} KB`, color: 'text-purple-400' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 text-center">
                    <div className="text-xl mb-1">{item.icon}</div>
                    <div className={`text-lg font-black ${item.color}`}>{item.value}</div>
                    <div className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Module breakdown */}
              <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-3">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Questions by Module</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {MODULES.map(mod => {
                    const count = customQuestions.filter(q => q.module === mod.key).length;
                    return (
                      <div key={mod.key} className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-white/[0.02]">
                        <span className="flex items-center gap-1.5">{mod.icon} {mod.name.split(' ')[0]}</span>
                        <span className={`font-mono font-bold ${count > 0 ? 'text-teal-400' : 'text-gray-700'}`}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Backup Download */}
            <div className="glass-card rounded-3xl p-5">
              <h3 className="font-black text-sm mb-2 flex items-center gap-2">
                <div className="w-7 h-7 bg-teal-500/20 rounded-lg flex items-center justify-center text-sm">📥</div>
                Create Backup
              </h3>
              <p className="text-[11px] text-gray-500 mb-4 ml-9">Download all data as a JSON file. Includes questions, test results, EMT user accounts, and all settings.</p>
              <button onClick={handleCreateBackup}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 rounded-2xl py-4 font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-teal-600/20">
                <span className="text-2xl">💾</span>
                Download Backup File
              </button>
              <div className="mt-3 bg-teal-500/5 border border-teal-500/10 rounded-xl p-3">
                <p className="text-[10px] text-teal-300/70 leading-relaxed">
                  💡 <strong>Tip:</strong> Create regular backups before making changes. The backup file can be used to restore data on any device or after clearing browser data.
                </p>
              </div>
            </div>

            {/* Restore from Backup */}
            <div className="glass-card rounded-3xl p-5">
              <h3 className="font-black text-sm mb-2 flex items-center gap-2">
                <div className="w-7 h-7 bg-amber-500/20 rounded-lg flex items-center justify-center text-sm">📤</div>
                Restore from Backup
              </h3>
              <p className="text-[11px] text-gray-500 mb-4 ml-9">Upload a previously downloaded backup file to restore data.</p>
              <div className="border-2 border-dashed border-amber-500/20 rounded-2xl p-6 text-center hover:border-amber-500/40 transition-all">
                <input type="file" accept=".json" onChange={handleRestoreFile} ref={backupFileRef} className="hidden" id="backup-upload" />
                <label htmlFor="backup-upload" className="cursor-pointer">
                  <div className="text-4xl mb-2 opacity-70">📂</div>
                  <p className="font-black text-xs text-amber-300 mb-1">Select Backup File</p>
                  <p className="text-[10px] text-gray-600">.json backup files only</p>
                </label>
              </div>
              <div className="mt-3 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                <p className="text-[10px] text-amber-300/70 leading-relaxed">
                  ⚠️ <strong>Note:</strong> You can choose to <strong>Replace</strong> all existing data or <strong>Merge</strong> with current data during restore.
                </p>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-card rounded-3xl p-5 border-red-500/10">
              <h3 className="font-black text-sm mb-2 flex items-center gap-2">
                <div className="w-7 h-7 bg-red-500/20 rounded-lg flex items-center justify-center text-sm">⚠️</div>
                <span className="text-red-400">Danger Zone</span>
              </h3>
              <p className="text-[11px] text-gray-500 mb-4 ml-9">Permanently delete all data from local storage. This action cannot be undone.</p>
              <button onClick={handleClearAllData}
                className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl py-3.5 font-black text-sm text-red-400 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                🗑️ Clear All Data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Question Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setDeleteConfirmId(null)}>
          <div className="glass-strong rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-red-500/15 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-red-500/20">
                <span className="text-3xl">🗑️</span>
              </div>
              <h3 className="font-black text-lg text-red-300">Delete Question?</h3>
              <p className="text-[11px] text-gray-500 mt-2">This question will be permanently removed.</p>
              {(() => {
                const qd = customQuestions.find(q => q.id === deleteConfirmId);
                if (qd) return <div className="mt-3 bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-left"><p className="text-[11px] text-red-200/80 truncate">{qd.question}</p></div>;
                return null;
              })()}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 glass hover:bg-white/10 rounded-2xl text-xs font-bold transition-all active:scale-95">Cancel</button>
              <button onClick={() => confirmDeleteQuestion(deleteConfirmId)} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-2xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-red-600/20">🗑️ Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirm Modal */}
      {showRestoreConfirm && pendingRestoreData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => { setShowRestoreConfirm(false); setPendingRestoreData(null); }}>
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-amber-500/15 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
                <span className="text-3xl">📦</span>
              </div>
              <h3 className="font-black text-lg">Restore Backup</h3>
              <p className="text-[11px] text-gray-500 mt-2">Choose how to restore this backup:</p>
            </div>

            {/* Backup contents */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-5">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Backup Contains:</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-lg font-black text-teal-400">{pendingRestoreData.questions.length}</div>
                  <div className="text-[9px] text-gray-600">Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-emerald-400">{pendingRestoreData.results.length}</div>
                  <div className="text-[9px] text-gray-600">Results</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-amber-400">{pendingRestoreData.users.length}</div>
                  <div className="text-[9px] text-gray-600">Users</div>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button onClick={() => confirmRestore('replace')}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 rounded-2xl text-xs font-black flex flex-col items-center gap-0.5 transition-all active:scale-95 shadow-lg shadow-red-600/20">
                <span>🔄 Replace All Data</span>
                <span className="text-[9px] font-normal opacity-70">Deletes current data, replaces with backup</span>
              </button>
              <button onClick={() => confirmRestore('merge')}
                className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 rounded-2xl text-xs font-black flex flex-col items-center gap-0.5 transition-all active:scale-95 shadow-lg shadow-teal-600/20">
                <span>🔗 Merge with Current</span>
                <span className="text-[9px] font-normal opacity-70">Keeps existing data, adds new items only</span>
              </button>
              <button onClick={() => { setShowRestoreConfirm(false); setPendingRestoreData(null); }}
                className="w-full py-3 glass hover:bg-white/10 rounded-2xl text-xs font-bold transition-all active:scale-95">
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
