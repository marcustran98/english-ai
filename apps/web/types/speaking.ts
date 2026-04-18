export type SpeakingPart = "part1" | "part2" | "part3" | "extra";

export type FeedbackItem = {
  issue: string;
  explanation_simple: string;
  suggestion: string;
  original_snippet: string | null;
};

export type SpeakingFeedback = {
  grammar_mistakes: FeedbackItem[];
  vocabulary_improvements: FeedbackItem[];
  clarity_comments: FeedbackItem[];
};

export type SpeakingScores = {
  fluency: number;
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  overall: number;
};

export type SpeakingEvaluateResponse = {
  corrected_version: string;
  natural_version: string;
  feedback: SpeakingFeedback;
  scores: SpeakingScores;
  sample_answer: string;
  key_vocabulary: string[];
};

export type SpeakingAttempt = {
  id: string;
  at: string;
  topicId: string;
  part: SpeakingPart;
  questionId: string;
  questionText: string;
  transcript: string;
  overall: number;
};
