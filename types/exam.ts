export interface Question {
  question: string;
  options: string[];
  correctAnswer: string; // single uppercase letter, e.g. "A"
  explanation?: string;
}

export type AnswerMap = Record<number, string>;

export interface ExamResult {
  id: number;
  date: string;
  score: number;
  total: number;
  percentage: number;
  questions: Question[];
  answers: AnswerMap;
}
