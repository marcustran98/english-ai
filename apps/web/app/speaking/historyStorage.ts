import type { SpeakingAttempt } from "@/types/speaking";

const KEY = "english-ai:speaking-history:v1";
const MAX_ITEMS = 48;

export function readSpeakingHistory(): SpeakingAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAttempt);
  } catch {
    return [];
  }
}

function isAttempt(x: unknown): x is SpeakingAttempt {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.at === "string" &&
    typeof o.topicId === "string" &&
    typeof o.part === "string" &&
    typeof o.questionId === "string" &&
    typeof o.questionText === "string" &&
    typeof o.transcript === "string" &&
    typeof o.overall === "number"
  );
}

export function appendSpeakingAttempt(entry: SpeakingAttempt): void {
  if (typeof window === "undefined") return;
  try {
    const prev = readSpeakingHistory();
    const next = [entry, ...prev].slice(0, MAX_ITEMS);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
}
