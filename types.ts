export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
  AUTO = 'Auto'
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  totalQuestions: number;
  color: string;
}

export interface Question {
  id: string;
  subjectId: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: Difficulty;
  explanation?: string; // Pre-stored explanation
}

export interface UserResponse {
  questionId: string;
  selectedOptionIndex: number;
  timeTakenSeconds: number;
  isCorrect: boolean;
}

export interface TestSession {
  id: string;
  subjectId: string;
  startTime: number;
  endTime?: number;
  difficultyMode: Difficulty;
  questions: Question[];
  responses: UserResponse[];
  score: number;
  completed: boolean;
}

export interface SubjectAnalytics {
  subjectId: string;
  testsTaken: number;
  avgAccuracy: number;
  totalQuestionsSolved: number;
  lastAttemptDate: number;
  difficultyDistribution: {
    [key in Difficulty]?: number // Accuracy per difficulty
  };
}

export interface UserProfile {
  streak: number;
  lastLoginDate: string; // ISO date string YYYY-MM-DD
  totalTests: number;
  globalAccuracy: number;
  xp: number;
}

// For API Simulation
export interface TestConfig {
  subjectId: string;
  questionCount: number;
  difficulty: Difficulty;
}