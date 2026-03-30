export interface Question {
  id: string;
  prompt: string;
  options: string[];
  answer?: string;
}

export interface ArticleDisplay {
  content: string;
  currentParagraph: number;
  totalParagraphs: number;
  onParagraphComplete: (timeSpent: number) => void;
  mode: "speed" | "intensive" | "guess" | "exam";
}

export interface QuestionPanel {
  questions: Question[];
  currentIndex: number;
  onAnswer: (answer: string, timeSpent: number) => void;
  onSubmit: () => void;
}

