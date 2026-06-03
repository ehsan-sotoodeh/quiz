export type AnswerStatus = 'correct' | 'incorrect';

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  answer: string;
  status: AnswerStatus;
  explanation: string;
}

export interface UserAnswer {
  questionId: string;
  selectedAnswerId: string;
}

export interface QuestionResult {
  questionId: string;
  question: string;
  selectedAnswerId: string | null;
  selectedAnswerText: string | null;
  correctAnswerId: string;
  correctAnswerText: string;
  isCorrect: boolean;
  explanation: string | null;
}

export interface QuizResult {
  quizId: string;
  quizTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  scorePercentage: number;
  questionResults: QuestionResult[];
}
