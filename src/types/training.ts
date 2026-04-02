export interface ParagraphTiming {
  paragraph_index: number;
  enter_time: number;
  exit_time: number;
  duration: number;
}

export interface QuestionAttempt {
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  time_spent: number;
  start_time: number;
  submit_time: number;
}

export interface DiagnosisResult {
  error_category: string;
  evidence_sentence: string;
  fix_suggestion: string;
  similar_distractor?: string;
}

export interface TrainingQuestion {
  question_id: string;
  question_text: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: string;
  question_type: string;
  explanation?: string;
}

export interface TrainingArticle {
  article_id: string;
  title: string;
  content: string;
  word_count: number;
  difficulty: string;
  genre: string;
  questions: TrainingQuestion[];
}

export interface ArticleSession {
  article_id: string;
  start_time: number;
  end_time: number;
  reading_duration: number;
  paragraph_timestamps: ParagraphTiming[];
  question_attempts: QuestionAttempt[];
  status: 'in_progress' | 'completed';
}

export interface TrainingGroup {
  group_id: string;
  user_id: string;
  difficulty: string;
  start_time: number;
  end_time: number;
  total_duration: number;
  articles: TrainingArticle[];
  sessions: ArticleSession[];
  status: 'in_progress' | 'completed';
}

export interface PowerScore {
  total: number;
  accuracy: number;
  speed: number;
  vocabulary?: number;
  grammar?: number;
  inference?: number;
  endurance?: number;
  updated_at: string;
}
