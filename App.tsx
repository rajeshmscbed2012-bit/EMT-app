import { useState, useEffect } from 'react';
import { Question, QuizConfig, QuizResult, MODULES } from './types';
import LoginScreen from './components/LoginScreen';
import HomeScreen from './components/HomeScreen';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import AdminPanel from './components/AdminPanel';
import Leaderboard from './components/Leaderboard';

type Screen = 'login' | 'home' | 'quiz' | 'result' | 'admin' | 'leaderboard';

function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
  const [emtName, setEmtName] = useState('');
  const [emtId, setEmtId] = useState('');
  const [currentResult, setCurrentResult] = useState<QuizResult | null>(null);
  const [allResults, setAllResults] = useState<QuizResult[]>([]);
  const [isDailyQuiz, setIsDailyQuiz] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // Load session & data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('emt_quiz_results');
      if (saved) setAllResults(JSON.parse(saved));
      const savedCustomQ = localStorage.getItem('emt_custom_questions');
      if (savedCustomQ) setCustomQuestions(JSON.parse(savedCustomQ));
      const session = localStorage.getItem('emt_session');
      if (session) {
        const data = JSON.parse(session);
        if (data.isLoggedIn && !data.isAdmin) {
          setIsLoggedIn(true);
          setEmtName(data.emtName || '');
          setEmtId(data.emtId || '');
          setIsAdmin(false);
          setScreen('home');
        }
      }
    } catch (e) { console.error(e); }
    setSessionLoaded(true);
  }, []);

  useEffect(() => {
    if (sessionLoaded) {
      try { localStorage.setItem('emt_quiz_results', JSON.stringify(allResults)); } catch (e) { console.error(e); }
    }
  }, [allResults, sessionLoaded]);

  useEffect(() => {
    if (sessionLoaded) {
      try { localStorage.setItem('emt_custom_questions', JSON.stringify(customQuestions)); } catch (e) { console.error(e); }
    }
  }, [customQuestions, sessionLoaded]);

  const saveSession = (name: string, id: string, admin: boolean) => {
    if (!admin) {
      localStorage.setItem('emt_session', JSON.stringify({ isLoggedIn: true, emtName: name, emtId: id, isAdmin: false }));
    }
  };

  const handleEmtLogin = (name: string, id: string) => {
    setEmtName(name); setEmtId(id); setIsLoggedIn(true); setIsAdmin(false);
    saveSession(name, id, false); setScreen('home');
  };

  const handleAdminLogin = () => {
    setIsLoggedIn(true); setIsAdmin(true); setEmtName('Admin'); setEmtId('ADMIN');
    localStorage.removeItem('emt_session'); setScreen('admin');
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setIsAdmin(false); setEmtName(''); setEmtId('');
    localStorage.removeItem('emt_session'); setScreen('login');
  };

  const handleStartQuiz = (config: QuizConfig) => {
    setQuizConfig(config); setIsDailyQuiz(false); setScreen('quiz');
  };

  const handleDailyQuiz = () => {
    const allModuleKeys = MODULES.map(m => m.key);
    setQuizConfig({ modules: allModuleKeys, difficulty: 'basic', questionCount: 5, timeLimit: 5 });
    setIsDailyQuiz(true); setScreen('quiz');
  };

  const handleQuizComplete = (result: QuizResult) => {
    setCurrentResult(result); setAllResults(prev => [...prev, result]); setScreen('result');
  };

  const handleRetest = () => { if (quizConfig) setScreen('quiz'); else setScreen('home'); };

  const handleAddQuestion = (q: Question) => { setCustomQuestions(prev => [...prev, q]); };
  const handleBulkAddQuestions = (questions: Question[]) => { setCustomQuestions(prev => [...prev, ...questions]); };
  const handleDeleteQuestion = (id: string) => {
    setCustomQuestions(prev => prev.filter(q => q.id !== id));
  };
  const handleUpdateQuestion = (updated: Question) => { setCustomQuestions(prev => prev.map(q => q.id === updated.id ? updated : q)); };

  // Backup & Restore
  const handleBackupRestore = (data: { questions: Question[]; results: QuizResult[] }) => {
    setCustomQuestions(data.questions);
    setAllResults(data.results);
  };

  if (!sessionLoaded) {
    return (
      <div className="min-h-screen bg-[#0c1222] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl mb-4" style={{ animation: 'spin 1s linear infinite' }}>🏥</div>
          <p className="text-sm text-gray-400">Loading EMT Quiz...</p>
        </div>
      </div>
    );
  }

  const activeScreen: Screen = isLoggedIn ? screen : 'login';

  return (
    <div className="font-sans relative">
      {activeScreen === 'login' && (
        <LoginScreen onEmtLogin={handleEmtLogin} onAdminLogin={handleAdminLogin} />
      )}
      {activeScreen === 'home' && isLoggedIn && !isAdmin && (
        <HomeScreen
          onStartQuiz={handleStartQuiz} onDailyQuiz={handleDailyQuiz}
          onLeaderboard={() => setScreen('leaderboard')} onLogout={handleLogout}
          emtName={emtName} emtId={emtId}
          totalQuestions={customQuestions.length}
        />
      )}
      {activeScreen === 'quiz' && quizConfig && isLoggedIn && (
        <QuizScreen
          config={quizConfig} emtName={emtName} emtId={emtId}
          onComplete={handleQuizComplete} isDailyQuiz={isDailyQuiz}
          questions={customQuestions}
          onBack={() => setScreen('home')}
        />
      )}
      {activeScreen === 'result' && currentResult && isLoggedIn && (
        <ResultScreen result={currentResult} onRetest={handleRetest} onHome={() => setScreen('home')} questions={customQuestions} />
      )}
      {activeScreen === 'admin' && isLoggedIn && isAdmin && (
        <AdminPanel
          results={allResults} onLogout={handleLogout}
          customQuestions={customQuestions}
          onAddQuestion={handleAddQuestion} onBulkAddQuestions={handleBulkAddQuestions}
          onDeleteQuestion={handleDeleteQuestion}
          onUpdateQuestion={handleUpdateQuestion}
          onBackupRestore={handleBackupRestore}
        />
      )}
      {activeScreen === 'leaderboard' && isLoggedIn && (
        <Leaderboard results={allResults} onBack={() => setScreen('home')} />
      )}
    </div>
  );
}

export default App;
