import { Question } from '../types';

// No built-in questions - all questions are added by admin
export const questionBank: Question[] = [];

export const getQuestionsByModule = (module: string, questions: Question[]): Question[] => {
  return questions.filter(q => q.module === module);
};

export const getQuestionsByDifficulty = (difficulty: string, questions: Question[]): Question[] => {
  return questions.filter(q => q.difficulty === difficulty);
};

export const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
