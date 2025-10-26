export interface QuizQuestion {
  question: string;
  answers: string[];
  allowMultiple?: boolean;
}

export interface QuizResponse {
  questions: QuizQuestion[];
}

export interface QuizSubmission {
  answers: { [key: number]: string | string[] };
}
