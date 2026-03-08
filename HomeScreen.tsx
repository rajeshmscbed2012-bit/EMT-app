import React, { useState, useEffect } from 'react';
import { Module, Difficulty, QuizConfig, MODULES, DIFFICULTY_LABELS } from '../types';

interface HomeScreenProps {
  onStartQuiz: (config: QuizConfig) => void;
  onDailyQuiz: () => void;
  onLeaderboard: () => void;
  onLogout: () => void;
  emtName: string;
  emtId: string;
  totalQuestions: number;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartQuiz, onDailyQuiz, onLeaderboard, onLogout, emtName, emtId, totalQuestions }) => {
  const [selectedModules, setSelectedModules] = useState<Module[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('basic');
  const [showConfig, setShowConfig] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const toggleModule = (moduleKey: Module) => {
    setSelectedModules(prev => prev.includes(moduleKey) ? prev.filter(m => m !== moduleKey) : [...prev, moduleKey]);
  };

  const selectAll = () => { setSelectedModules(MODULES.map(m => m.key)); };

  const handleStart = () => {
    if (selectedModules.length === 0) { alert('Please select at least one module'); return; }
    onStartQuiz({ modules: selectedModules, difficulty, questionCount: 20, timeLimit: 30 });
  };

  const noQuestions = totalQuestions === 0;

  return (
    <div className="min-h-screen bg-[#0c1222] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-teal-600/[0.06] via-emerald-600/[0.04] to-transparent"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-teal-600/[0.04] rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-emerald-600/[0.04] rounded-full blur-[100px]"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <header className={`relative z-10 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 rotate-3">
                <span className="text-2xl">🏥</span>
              </div>
              <div>
                <h1 className="text-xl font-black text-gradient-teal">EMT Knowledge Test</h1>
                <p className="text-[10px] text-gray-500 font-medium">108 Emergency Medical Assessment</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500/30 to-emerald-500/30 rounded-xl flex items-center justify-center border border-teal-500/20">
                <span className="text-lg">👤</span>
              </div>
              <div>
                <p className="text-sm font-bold">{emtName}</p>
                <p className="text-[10px] text-gray-500 font-mono tracking-wider">{emtId}</p>
              </div>
            </div>
            <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 rounded-xl text-[11px] text-red-400 transition-all font-semibold active:scale-95">
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <main className={`max-w-4xl mx-auto px-4 pb-10 relative z-10 transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="relative overflow-hidden glass-card rounded-3xl p-6 mb-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-bl-full"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl animate-float">🩺</span>
              <div>
                <h2 className="text-xl font-black">🙏 Welcome!</h2>
                <p className="text-xs text-gray-400">Test your medical knowledge & skills</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { icon: '📝', label: 'Questions', value: '20', color: 'from-teal-500/15 to-teal-600/15 border-teal-500/20', valueColor: 'text-teal-400' },
                { icon: '⏰', label: 'Duration', value: '30m', color: 'from-amber-500/15 to-orange-600/15 border-amber-500/20', valueColor: 'text-amber-400' },
                { icon: '🏆', label: 'Pass', value: '70%', color: 'from-emerald-500/15 to-green-600/15 border-emerald-500/20', valueColor: 'text-emerald-400' },
              ].map((item, i) => (
                <div key={i} className={`bg-gradient-to-br ${item.color} rounded-2xl p-3 text-center border`}>
                  <div className="text-xl mb-0.5">{item.icon}</div>
                  <div className={`text-lg font-black ${item.valueColor}`}>{item.value}</div>
                  <div className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {noQuestions && (
          <div className="glass-card rounded-3xl p-6 mb-6 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-500/15 rounded-2xl flex items-center justify-center text-3xl border border-amber-500/20 shrink-0">⚠️</div>
              <div>
                <h3 className="text-base font-black text-amber-400 mb-1">No Questions Available</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Questions have not been added yet. Please contact your Training Officer / Admin to add questions before starting the test.
                </p>
              </div>
            </div>
          </div>
        )}

        {!noQuestions && (
          <div className="glass-card rounded-2xl px-4 py-3 mb-6 flex items-center justify-between border-emerald-500/10">
            <div className="flex items-center gap-2">
              <span className="text-lg">📚</span>
              <span className="text-xs font-bold text-emerald-400">Question Bank Ready</span>
            </div>
            <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/15">{totalQuestions} Questions</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={onDailyQuiz} disabled={noQuestions}
            className={`group relative overflow-hidden glass-card rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${noQuestions ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.02]'}`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full group-hover:w-24 group-hover:h-24 transition-all"></div>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mb-2.5 border border-amber-500/20">
                <span className="text-xl">⚡</span>
              </div>
              <span className="text-sm font-black text-amber-300">Daily Quick Test</span>
              <p className="text-[10px] text-gray-500 mt-0.5">5 Questions • 5 Minutes</p>
            </div>
          </button>
          <button onClick={onLeaderboard} className="group relative overflow-hidden glass-card rounded-2xl p-4 text-left hover:scale-[1.02] transition-all active:scale-[0.98]">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full group-hover:w-24 group-hover:h-24 transition-all"></div>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center mb-2.5 border border-emerald-500/20">
                <span className="text-xl">🏅</span>
              </div>
              <span className="text-sm font-black text-emerald-300">Leaderboard</span>
              <p className="text-[10px] text-gray-500 mt-0.5">See Top EMTs</p>
            </div>
          </button>
        </div>

        {!showConfig ? (
          <div className="space-y-4 animate-fade-in">
            <button onClick={() => { if (!noQuestions) setShowConfig(true); }} disabled={noQuestions}
              className={`group w-full relative overflow-hidden rounded-3xl p-5 flex items-center justify-between transition-all active:scale-[0.99] ${
                noQuestions
                  ? 'bg-gray-600/20 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-teal-600/90 to-emerald-600/90 hover:from-teal-500 hover:to-emerald-500 shadow-xl shadow-teal-600/15'
              }`}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center gap-4 relative">
                <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🎯</div>
                <div className="text-left">
                  <h3 className="text-lg font-black">{noQuestions ? 'Test Not Available' : 'Start Full Test'}</h3>
                  <p className="text-xs text-teal-200/70">{noQuestions ? 'Admin needs to add questions first' : '20 Questions • 30 Min • Certificate'}</p>
                </div>
              </div>
              <span className="text-white/30 group-hover:translate-x-2 transition-transform text-2xl relative">→</span>
            </button>

            <div className="glass-card rounded-3xl p-5">
              <h3 className="font-black text-sm mb-4 flex items-center gap-2">
                <div className="w-7 h-7 bg-teal-500/20 rounded-lg flex items-center justify-center text-sm">📋</div>
                Exam Rules
              </h3>
              <div className="space-y-2.5">
                {[
                  { icon: '⏱️', text: '20 Questions, 30 Minutes Time Limit', color: 'text-teal-400' },
                  { icon: '🚫', text: 'No going back in Exam Mode', color: 'text-red-400' },
                  { icon: '⏳', text: 'Auto Submit when time expires', color: 'text-amber-400' },
                  { icon: '🔀', text: 'Questions & Options Shuffled', color: 'text-emerald-400' },
                  { icon: '✅', text: 'Correct → +1, Wrong → 0, Pass → 70%', color: 'text-green-400' },
                ].map((rule, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className={`text-base ${rule.color}`}>{rule.icon}</span>
                    <span className="text-gray-300 text-xs">{rule.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-3xl p-5">
              <h3 className="font-black text-sm mb-4 flex items-center gap-2">
                <div className="w-7 h-7 bg-amber-500/20 rounded-lg flex items-center justify-center text-sm">🏆</div>
                Grading System
              </h3>
              <div className="space-y-2">
                {[
                  { emoji: '🌟', label: 'Excellent EMT', range: '90-100%', bg: 'bg-green-500/10 border-green-500/20', text: 'text-green-400' },
                  { emoji: '✅', label: 'Competent', range: '75-89%', bg: 'bg-teal-500/10 border-teal-500/20', text: 'text-teal-400' },
                  { emoji: '⚠️', label: 'Needs Improvement', range: '60-74%', bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-400' },
                  { emoji: '🔴', label: 'Retraining Required', range: '<60%', bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400' },
                ].map((grade, i) => (
                  <div key={i} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${grade.bg}`}>
                    <span className="flex items-center gap-2 text-xs font-medium">{grade.emoji} {grade.label}</span>
                    <span className={`font-mono font-black text-xs ${grade.text}`}>{grade.range}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-3xl p-5">
              <h3 className="font-black text-sm mb-4 flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center text-sm">📚</div>
                Available Modules ({MODULES.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {MODULES.map(mod => (
                  <div key={mod.key} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium bg-teal-500/8 border-teal-500/15 text-teal-300">
                    <span>{mod.icon}</span>
                    <span>{mod.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-slide-up">
            <div className="glass-card rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-sm flex items-center gap-2">
                  <div className="w-7 h-7 bg-teal-500/20 rounded-lg flex items-center justify-center text-sm">📚</div>
                  Select Modules ({MODULES.length})
                </h3>
                <button onClick={selectAll} className="text-[11px] text-teal-400 hover:text-teal-300 font-bold px-3 py-1 rounded-lg hover:bg-teal-500/10 transition-all">
                  Select All
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 stagger-children">
                {MODULES.map(mod => (
                  <button key={mod.key} onClick={() => toggleModule(mod.key)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all active:scale-[0.98] animate-fade-in ${
                      selectedModules.includes(mod.key)
                        ? 'bg-teal-500/10 border-teal-500/30 shadow-lg shadow-teal-500/5'
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                    }`}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                      selectedModules.includes(mod.key) ? 'bg-teal-500/25 scale-110' : 'bg-white/5'
                    }`}>
                      {mod.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-sm font-semibold">{mod.name}</span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedModules.includes(mod.key) ? 'border-teal-400 bg-teal-500 scale-110' : 'border-gray-700'
                    }`}>
                      {selectedModules.includes(mod.key) && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {selectedModules.length > 0 && (
                <p className="text-[11px] text-teal-400 mt-3 text-center font-medium">
                  ✅ {selectedModules.length} modules selected
                </p>
              )}
            </div>

            <div className="glass-card rounded-3xl p-5">
              <h3 className="font-black text-sm mb-4 flex items-center gap-2">
                <div className="w-7 h-7 bg-amber-500/20 rounded-lg flex items-center justify-center text-sm">⚡</div>
                Difficulty Level
              </h3>
              <div className="grid grid-cols-3 gap-2.5">
                {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map(diff => (
                  <button key={diff} onClick={() => setDifficulty(diff)}
                    className={`p-3.5 rounded-2xl border text-center transition-all active:scale-95 ${
                      difficulty === diff
                        ? `${diff === 'basic' ? 'bg-green-500/15 border-green-500/30 glow-green' : diff === 'intermediate' ? 'bg-amber-500/15 border-amber-500/30 glow-amber' : 'bg-red-500/15 border-red-500/30 glow-red'}`
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                    }`}>
                    <div className="text-2xl mb-1">{diff === 'basic' ? '🟢' : diff === 'intermediate' ? '🟡' : '🔴'}</div>
                    <div className="text-[11px] font-bold">{DIFFICULTY_LABELS[diff].en}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowConfig(false)}
                className="flex-1 glass rounded-2xl py-4 font-bold text-sm transition-all hover:bg-white/10 active:scale-[0.98]">
                ← Back
              </button>
              <button onClick={handleStart}
                className="flex-[2] bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 rounded-2xl py-4 font-black text-base transition-all shadow-xl shadow-teal-600/20 flex items-center justify-center gap-2 active:scale-[0.98] animate-gradient">
                🚀 START TEST
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomeScreen;
