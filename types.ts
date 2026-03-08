export type Module = 'airway' | 'ventilation' | 'cardiac' | 'trauma' | 'pph' | 'vitals' | 'drugs';
export type Difficulty = 'basic' | 'intermediate' | 'advanced';
export type QuestionType = 'theory' | 'scenario' | 'protocol';

export interface Question {
  id: string;
  module: Module;
  difficulty: Difficulty;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuizConfig {
  modules: Module[];
  difficulty: Difficulty;
  questionCount: number;
  timeLimit: number;
}

export interface QuizResult {
  id: string;
  emtName: string;
  emtId: string;
  date: string;
  score: number;
  total: number;
  percentage: number;
  grade: string;
  timeTaken: number;
  moduleScores: Record<string, { correct: number; total: number }>;
  answers: { questionId: string; selected: number; correct: number; isCorrect: boolean }[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  requirement: string;
  earned: boolean;
}

export const MODULES: { key: Module; name: string; icon: string }[] = [
  { key: 'airway', name: 'Basic Airway Management', icon: '🫁' },
  { key: 'ventilation', name: 'Oxygen & Ventilation', icon: '💨' },
  { key: 'cardiac', name: 'Cardiac Emergencies', icon: '❤️' },
  { key: 'trauma', name: 'Trauma Care', icon: '🩹' },
  { key: 'pph', name: 'Obstetrics (PPH)', icon: '🤰' },
  { key: 'vitals', name: 'Vital Signs', icon: '📊' },
  { key: 'drugs', name: 'Pharmacology', icon: '💊' },
];

export function getModuleInfo(moduleKey: string): { name: string; icon: string } {
  const found = MODULES.find(m => m.key === moduleKey);
  if (found) return { name: found.name, icon: found.icon };
  return { name: moduleKey, icon: '📁' };
}

export const MODULE_LABELS: Record<Module, { en: string; icon: string }> = {
  airway: { en: 'Basic Airway Management', icon: '🫁' },
  ventilation: { en: 'Oxygen & Ventilation', icon: '💨' },
  cardiac: { en: 'Cardiac Emergencies', icon: '❤️' },
  trauma: { en: 'Trauma Care', icon: '🩹' },
  pph: { en: 'Obstetrics (PPH)', icon: '🤰' },
  vitals: { en: 'Vital Signs', icon: '📊' },
  drugs: { en: 'Pharmacology', icon: '💊' },
};

export const DIFFICULTY_LABELS: Record<Difficulty, { en: string; color: string }> = {
  basic: { en: 'Basic EMT', color: 'bg-green-500' },
  intermediate: { en: 'Intermediate', color: 'bg-yellow-500' },
  advanced: { en: 'Advanced Scenario', color: 'bg-red-500' },
};
