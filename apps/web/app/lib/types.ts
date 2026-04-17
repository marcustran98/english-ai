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

export type SpeakingEvaluateResponse = {
  corrected_version: string;
  natural_version: string;
  feedback: SpeakingFeedback;
};

