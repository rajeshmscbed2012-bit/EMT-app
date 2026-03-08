import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Question, QuizConfig, QuizResult, MODULES, getModuleInfo } from '../types';
import { shuffleArray } from '../data/questions';

interface QuizScreenProps {
  config: QuizConfig;
  emtName: string;
  emtId: string;
  onComplete: (result: QuizResult) => void;
  isDailyQuiz?: boolean;
  questions: Question[];
  onBack: () => void;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ config, emtName, emtId, onComplete, isDailyQuiz, questions: allQuestions, onBack }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; selected: number; correct: number; isCorrect: boolean }[]>([]);
  const [timeLeft, setTimeLeft] = useState(config.timeLimit * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [shuffledOptionIndices, setShuffledOptionIndices] = useState<number[]>([]);
  const [animating, setAnimating] = useState(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    let filtered = allQuestions.filter(q =>
      config.modules.includes(q.module) &&
      (config.difficulty === 'advanced' || q.difficulty === config.difficulty || q.difficulty === 'basic')
    );
    if (filtered.length < config.questionCount) filtered = allQuestions.filter(q => config.modules.includes(q.module));
    if (filtered.length < config.questionCount) filtered = [...allQuestions];
    setQuestions(shuffleArray(filtered).slice(0, Math.min(config.questionCount, filtered.length)));
  }, [config, allQuestions]);

  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      const indices = questions[currentIndex].options.map((_, i) => i);
      setShuffledOptionIndices(shuffleArray(indices));
    }
  }, [currentIndex, questions]);

  useEffect(() => {
    if (questions.length === 0) return;
    if (timeLeft <= 0) { handleAutoSubmit(); return; }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, questions.length]);

  const handleAutoSubmit = useCallback(() => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const finalAnswers = [...answers];
    for (let i = finalAnswers.length; i < questions.length; i++) {
      finalAnswers.push({ questionId: questions[i].id, selected: -1, correct: questions[i].correctAnswer, isCorrect: false });
    }
    calculateResult(finalAnswers);
  }, [answers, questions, isSubmitting]);

  const calculateResult = (finalAnswers: typeof answers) => {
    const score = finalAnswers.filter(a => a.isCorrect).length;
    const total = questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    let grade = '';
    if (percentage >= 90) grade = '🌟 Excellent EMT';
    else if (percentage >= 75) grade = '✅ Competent';
    else if (percentage >= 60) grade = '⚠️ Needs Improvement';
    else grade = '🔴 Retraining Required';

    const moduleScores: Record<string, { correct: number; total: number }> = {};
    MODULES.forEach(m => { moduleScores[m.key] = { correct: 0, total: 0 }; });
    questions.forEach((q, i) => {
      if (!moduleScores[q.module]) moduleScores[q.module] = { correct: 0, total: 0 };
      moduleScores[q.module].total++;
      if (finalAnswers[i]?.isCorrect) moduleScores[q.module].correct++;
    });

    onComplete({
      id: `RES-${Date.now()}`, emtName, emtId, date: new Date().toISOString(), score, total, percentage, grade,
      timeTaken: Math.round((Date.now() - startTimeRef.current) / 1000), moduleScores, answers: finalAnswers,
    });
  };

  const handleNext = () => {
    if (selectedAnswer === null) { setShowConfirm(true); return; }
    submitAnswer();
  };

  const submitAnswer = () => {
    const currentQ = questions[currentIndex];
    const newAnswer = { questionId: currentQ.id, selected: selectedAnswer ?? -1, correct: currentQ.correctAnswer, isCorrect: selectedAnswer === currentQ.correctAnswer };
    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);
    setSelectedAnswer(null);
    setShowConfirm(false);
    if (currentIndex + 1 >= questions.length) { calculateResult(newAnswers); }
    else {
      setAnimating(true);
      setTimeout(() => { setCurrentIndex(prev => prev + 1); setAnimating(false); }, 200);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (allQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0c1222] flex items-center justify-center p-4">
        <div className="text-white text-center glass-card rounded-3xl p-8 max-w-sm">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-black text-amber-400 mb-2">No Questions Available</h2>
          <p className="text-sm text-gray-400 mb-6">Your Training Officer / Admin needs to add questions first before you can take the test.</p>
          <button onClick={onBack} className="w-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-2xl py-3.5 font-black text-sm transition-all active:scale-95">
            🏠 Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0c1222] flex items-center justify-center">
        <div className="text-white text-center"><div className="animate-spin text-5xl mb-4">⏳</div>
          <p className="text-gray-400 text-sm">Preparing questions...</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isTimeWarning = timeLeft < 300;
  const isTimeCritical = timeLeft < 60;
  const modInfo = getModuleInfo(currentQ.module);

  const typeConfig = {
    theory: { icon: '📖', label: 'Theory MCQ', color: 'from-teal-500/15 to-teal-600/15 border-teal-500/25 text-teal-300' },
    scenario: { icon: '🏥', label: 'Clinical Scenario', color: 'from-cyan-500/15 to-cyan-600/15 border-cyan-500/25 text-cyan-300' },
    protocol: { icon: '📋', label: 'Protocol Based', color: 'from-emerald-500/15 to-emerald-600/15 border-emerald-500/25 text-emerald-300' },
  };

  return (
    <div className="min-h-screen bg-[#0c1222] text-white relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[200px] bg-gradient-to-b from-teal-600/[0.04] to-transparent"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="sticky top-0 z-10 bg-[#0c1222]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500/20 to-emerald-600/20 rounded-lg flex items-center justify-center border border-teal-500/20">
                <span className="text-sm">{isDailyQuiz ? '⚡' : '🎯'}</span>
              </div>
              <div>
                <span className="text-xs font-black text-white">
                  {isDailyQuiz ? 'Daily Quiz' : 'Examination'}
                </span>
                <p className="text-[9px] text-gray-600">{emtName}</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-mono font-black text-sm transition-all ${
              isTimeCritical ? 'bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse glow-red' :
              isTimeWarning ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' :
              'glass text-white'
            }`}>
              <span className="text-sm">⏱️</span>
              {formatTime(timeLeft)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-[11px] text-gray-500 font-mono font-bold min-w-[40px] text-right">
              {currentIndex + 1}/{questions.length}
            </span>
          </div>
        </div>
      </div>

      <div className={`max-w-4xl mx-auto px-4 py-6 relative z-10 transition-all duration-200 ${animating ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}`}>
        <div className="glass-card rounded-3xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`text-[10px] px-2.5 py-1 bg-gradient-to-r ${typeConfig[currentQ.type].color} rounded-xl font-bold border flex items-center gap-1`}>
              {typeConfig[currentQ.type].icon} {typeConfig[currentQ.type].label}
            </span>
            <span className="text-[10px] px-2.5 py-1 bg-gradient-to-r from-gray-500/10 to-gray-600/10 text-gray-400 rounded-xl font-bold border border-gray-500/15">
              {modInfo.icon} {modInfo.name}
            </span>
            <span className={`text-[10px] px-2.5 py-1 rounded-xl font-bold border ${
              currentQ.difficulty === 'basic' ? 'bg-green-500/10 text-green-400 border-green-500/15' :
              currentQ.difficulty === 'intermediate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/15' :
              'bg-red-500/10 text-red-400 border-red-500/15'
            }`}>
              {currentQ.difficulty === 'basic' ? '🟢' : currentQ.difficulty === 'intermediate' ? '🟡' : '🔴'} {currentQ.difficulty}
            </span>
          </div>
          <h2 className="text-base font-bold leading-relaxed">
            <span className="text-teal-500 font-mono text-xs mr-2 opacity-60">Q{currentIndex + 1}.</span>
            {currentQ.question}
          </h2>
        </div>

        <div className="space-y-2.5 mb-6">
          {shuffledOptionIndices.map((optionIdx, displayIdx) => {
            const optionText = currentQ.options[optionIdx];
            const isSelected = selectedAnswer === optionIdx;
            const letters = ['A', 'B', 'C', 'D'];
            return (
              <button key={optionIdx} onClick={() => setSelectedAnswer(optionIdx)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3.5 group active:scale-[0.99] ${
                  isSelected
                    ? 'bg-teal-500/12 border-teal-500/35 shadow-lg shadow-teal-500/10 glow-teal'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/5 hover:border-white/12'
                }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all ${
                  isSelected ? 'bg-teal-500 text-white scale-110 shadow-lg shadow-teal-500/30' : 'bg-white/5 text-gray-500 group-hover:bg-white/10'
                }`}>
                  {letters[displayIdx]}
                </div>
                <span className="text-sm leading-relaxed flex-1">{optionText}</span>
                {isSelected && (
                  <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center shrink-0 animate-bounce-in">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button onClick={handleNext}
          className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] ${
            isLastQuestion
              ? 'bg-gradient-to-r from-emerald-600 to-green-500 shadow-xl shadow-emerald-600/20 hover:from-emerald-500 hover:to-green-400'
              : 'bg-gradient-to-r from-teal-600 to-emerald-500 shadow-xl shadow-teal-600/20 hover:from-teal-500 hover:to-emerald-400'
          }`}>
          {isLastQuestion ? '✅ SUBMIT TEST' : <>NEXT <span className="text-lg">→</span></>}
        </button>

        <div className="flex flex-wrap gap-1 mt-6 justify-center">
          {questions.map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${
              i < currentIndex ? 'bg-emerald-500' :
              i === currentIndex ? 'bg-teal-500 ring-2 ring-teal-400/50 ring-offset-1 ring-offset-[#0c1222] scale-125' :
              'bg-white/10'
            }`}></div>
          ))}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-strong rounded-3xl p-6 max-w-sm w-full animate-scale-in shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-amber-500/15 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="font-black text-lg">No Answer Selected</h3>
              <p className="text-xs text-gray-400 mt-2">Skip this question? You cannot go back.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 glass hover:bg-white/10 rounded-2xl text-sm font-bold transition-all active:scale-95">Cancel</button>
              <button onClick={submitAnswer} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-red-600/20">Skip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizScreen;
