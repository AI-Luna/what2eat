export interface QuizQuestion {
  question: string;
  answers: string[];
}

export interface QuizResponse {
  questions: QuizQuestion[];
}

export interface QuizSubmission {
  answers: { [key: number]: string };
}
