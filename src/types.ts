export interface Question {
  id: string;
  content: string;
  options?: string[];
  answer: string;
  explanation: string;
  commonErrors?: string;
  isOriginal?: boolean;
}

export interface WrongQuestionRecord {
  id: string;
  title: string;
  timestamp: number;
  knowledgePoint: string;
  originalQuestion: Question;
  similarQuestions: Question[];
  subject?: string;
}

export interface OCRResult {
  text: string;
  options?: string[];
  answer?: string;
  knowledgePoint?: string;
  subject?: string;
}
