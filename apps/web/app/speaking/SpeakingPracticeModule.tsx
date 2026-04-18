"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FeedbackSection } from "@/app/components/FeedbackSection";
import { evaluateSpeaking } from "@/app/lib/api";
import type { SpeakingAttempt, SpeakingEvaluateResponse, SpeakingPart } from "@/types/speaking";

import { appendSpeakingAttempt, readSpeakingHistory } from "./historyStorage";
import { PART_LABELS, SPEAKING_TOPICS, buildPart2Prompt, stableQuestionId, type Difficulty, type SpeakingTopicPack } from "./topics";
import { useLiveTranscript } from "./useLiveTranscript";
import { useMicRecorder } from "./useMicRecorder";

const PART2_PREP_SECONDS = 60;
const PART2_SPEAK_SECONDS = 120;
const DEFAULT_SPEAK_SECONDS = 120;

type ActiveQuestion = {
  questionId: string;
  questionText: string;
  part: SpeakingPart;
};

function formatBand(n: number): string {
  const v = Math.round(n * 2) / 2;
  return v % 1 === 0 ? `${v.toFixed(1)}` : v.toFixed(1);
}

function difficultyLabel(d: Difficulty): string {
  if (d === "beginner") return "Beginner";
  if (d === "intermediate") return "Intermediate";
  return "Advanced";
}

function questionCards(topic: SpeakingTopicPack, part: SpeakingPart): { id: string; text: string }[] {
  if (part === "part1") {
    return topic.part1.map((text, i) => ({ id: stableQuestionId(topic.id, part, i), text }));
  }
  if (part === "part2") {
    return [{ id: stableQuestionId(topic.id, part, 0), text: buildPart2Prompt(topic) }];
  }
  if (part === "part3") {
    return topic.part3.map((text, i) => ({ id: stableQuestionId(topic.id, part, i), text }));
  }
  return topic.extra.map((text, i) => ({ id: stableQuestionId(topic.id, part, i), text }));
}

function totalTrackedQuestions(topic: SpeakingTopicPack): number {
  return (
    topic.part1.length + 1 + topic.part3.length + topic.extra.length
  );
}

function topicProgress(topicId: string, history: SpeakingAttempt[], topic: SpeakingTopicPack): { done: number; total: number } {
  const total = totalTrackedQuestions(topic);
  const done = new Set(history.filter((h) => h.topicId === topicId).map((h) => h.questionId)).size;
  return { done: Math.min(done, total), total };
}

function suggestedTopicId(history: SpeakingAttempt[], topics: SpeakingTopicPack[], currentId: string): string | null {
  if (history.length === 0) return null;
  const byTopic = new Map<string, number[]>();
  for (const h of history) {
    if (!byTopic.has(h.topicId)) byTopic.set(h.topicId, []);
    byTopic.get(h.topicId)!.push(h.overall);
  }
  let best: { id: string; score: number } | null = null;
  for (const t of topics) {
    if (t.id === currentId) continue;
    const arr = byTopic.get(t.id);
    if (!arr?.length) {
      return t.id;
    }
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    if (!best || avg < best.score) best = { id: t.id, score: avg };
  }
  return best?.id ?? null;
}

const fieldClass =
  "w-full rounded-control border border-border bg-background px-3 py-2.5 text-foreground outline-none ring-offset-background focus:ring-2 focus:ring-foreground/15";

export function SpeakingPracticeModule() {
  const topics = useMemo(() => SPEAKING_TOPICS, []);
  const [part, setPart] = useState<SpeakingPart>("part1");
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "hobbies");
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");
  const [hideSamples, setHideSamples] = useState(false);
  const [history, setHistory] = useState<SpeakingAttempt[]>([]);

  const [active, setActive] = useState<ActiveQuestion | null>(null);
  const [prepTick, setPrepTick] = useState<number | null>(null);
  const [speakTick, setSpeakTick] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [evalState, setEvalState] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [evalError, setEvalError] = useState<string | null>(null);
  const [result, setResult] = useState<SpeakingEvaluateResponse | null>(null);

  const mic = useMicRecorder();
  const live = useLiveTranscript();
  const liveCombinedRef = useRef("");
  const prepZeroGuard = useRef(false);
  const speakZeroGuard = useRef(false);
  const questionsAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    liveCombinedRef.current = live.combined;
  }, [live.combined]);

  useEffect(() => {
    setHistory(readSpeakingHistory());
  }, []);

  const filteredTopics = useMemo(() => {
    if (difficulty === "all") return topics;
    return topics.filter((t) => t.difficulty === difficulty);
  }, [topics, difficulty]);

  const topic = useMemo(() => {
    const t = filteredTopics.find((x) => x.id === topicId) ?? filteredTopics[0] ?? topics[0];
    return t;
  }, [filteredTopics, topicId, topics]);

  useEffect(() => {
    if (filteredTopics.length && !filteredTopics.some((t) => t.id === topicId)) {
      setTopicId(filteredTopics[0].id);
    }
  }, [filteredTopics, topicId]);

  const cards = useMemo(() => (topic ? questionCards(topic, part) : []), [topic, part]);
  const progress = topic ? topicProgress(topic.id, history, topic) : { done: 0, total: 1 };
  const suggestId = useMemo(() => suggestedTopicId(history, topics, topic?.id ?? ""), [history, topics, topic?.id]);
  const suggestTopic = suggestId ? topics.find((t) => t.id === suggestId) : null;

  const closePanel = useCallback(() => {
    setActive(null);
    setPrepTick(null);
    setSpeakTick(null);
    setIsRecording(false);
    setReviewText("");
    setEvalState("idle");
    setEvalError(null);
    setResult(null);
    mic.stop();
    mic.clear();
    live.stop();
    live.reset();
    prepZeroGuard.current = false;
    speakZeroGuard.current = false;
  }, [live, mic]);

  const startRecordingFlow = useCallback(async () => {
    if (!active) return;
    prepZeroGuard.current = false;
    speakZeroGuard.current = false;
    live.reset();
    mic.clear();
    const ok = await mic.start();
    if (!ok) {
      setSpeakTick(null);
      setIsRecording(false);
      return;
    }
    live.start();
    setIsRecording(true);
    const max =
      active.part === "part2" ? PART2_SPEAK_SECONDS : DEFAULT_SPEAK_SECONDS;
    setSpeakTick(max);
  }, [active, live, mic]);

  useEffect(() => {
    if (prepTick === null || prepTick < 0) return;
    if (prepTick === 0) {
      if (prepZeroGuard.current) return;
      prepZeroGuard.current = true;
      setPrepTick(null);
      void startRecordingFlow();
      return;
    }
    const id = window.setTimeout(() => setPrepTick((s) => (s === null ? null : s - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [prepTick, startRecordingFlow]);

  useEffect(() => {
    if (speakTick === null || speakTick < 0 || !isRecording) return;
    if (speakTick === 0) {
      if (speakZeroGuard.current) return;
      speakZeroGuard.current = true;
      setSpeakTick(null);
      const captured = liveCombinedRef.current.trim();
      mic.stop();
      live.stop();
      setIsRecording(false);
      setReviewText(captured);
      return;
    }
    const id = window.setTimeout(() => setSpeakTick((s) => (s === null ? null : s - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [speakTick, isRecording, live, mic]);

  const stopRecordingManual = useCallback(() => {
    speakZeroGuard.current = true;
    setSpeakTick(null);
    const captured = liveCombinedRef.current.trim();
    mic.stop();
    live.stop();
    setIsRecording(false);
    setReviewText(captured);
  }, [live, mic]);

  const beginPart2Prep = useCallback(() => {
    prepZeroGuard.current = false;
    speakZeroGuard.current = false;
    setPrepTick(PART2_PREP_SECONDS);
  }, []);

  const skipPrep = useCallback(() => {
    setPrepTick(null);
    void startRecordingFlow();
  }, [startRecordingFlow]);

  const onSubmitEvaluation = useCallback(async () => {
    if (!active || !topic) return;
    const text = reviewText.trim();
    if (!text) {
      setEvalError("Add a transcript (from speech-to-text or by typing) before requesting feedback.");
      setEvalState("error");
      return;
    }
    setEvalError(null);
    setEvalState("loading");
    try {
      const data = await evaluateSpeaking({
        topic: active.questionText,
        answer: text,
        part: active.part,
      });
      setResult(data);
      setEvalState("done");
      const entry: SpeakingAttempt = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        at: new Date().toISOString(),
        topicId: topic.id,
        part: active.part,
        questionId: active.questionId,
        questionText: active.questionText,
        transcript: text,
        overall: data.scores.overall,
      };
      appendSpeakingAttempt(entry);
      setHistory(readSpeakingHistory());
    } catch (e) {
      setEvalError(e instanceof Error ? e.message : "Evaluation failed");
      setEvalState("error");
      setResult(null);
    }
  }, [active, reviewText, topic]);

  const scrollToQuestions = useCallback(() => {
    questionsAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const openQuestion = useCallback(
    (q: { id: string; text: string }) => {
      setActive({ questionId: q.id, questionText: q.text, part });
      setPrepTick(null);
      setSpeakTick(null);
      setIsRecording(false);
      setReviewText("");
      setEvalState("idle");
      setEvalError(null);
      setResult(null);
      mic.stop();
      mic.clear();
      live.stop();
      live.reset();
      prepZeroGuard.current = false;
      speakZeroGuard.current = false;
    },
    [live, mic, part],
  );

  const partOrder: SpeakingPart[] = ["part1", "part2", "part3", "extra"];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground sm:text-[26px]">
            Speaking practice
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            IELTS-style prompts, timed responses, speech-to-text, and AI feedback with band-style scores.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border accent-foreground"
            checked={hideSamples}
            onChange={(e) => setHideSamples(e.target.checked)}
          />
          Hide sample answers
        </label>
      </header>

      <div className="flex flex-wrap gap-2">
        {(["all", "beginner", "intermediate", "advanced"] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDifficulty(d)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              difficulty === d
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-foreground hover:bg-card/80"
            }`}
          >
            {d === "all" ? "All levels" : difficultyLabel(d)}
          </button>
        ))}
      </div>

      {suggestTopic ? (
        <section className="rounded-card border border-dashed border-border bg-card/60 px-4 py-3 text-sm text-muted">
          <span className="font-medium text-foreground">Suggested next topic: </span>
          <button
            type="button"
            className="text-foreground underline decoration-border underline-offset-2 hover:opacity-90"
            onClick={() => setTopicId(suggestTopic.id)}
          >
            {suggestTopic.title}
          </button>
          <span> — based on your recent attempts.</span>
        </section>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-64">
          <div className="rounded-card border border-border bg-card p-3">
            <div className="px-1 pb-2 pt-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Topics</h2>
            </div>
            <label className="mb-3 block lg:hidden">
              <span className="mb-1 block text-[13px] text-muted">Select topic</span>
              <select
                className={fieldClass}
                value={topic?.id}
                onChange={(e) => setTopicId(e.target.value)}
              >
                {filteredTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
            <nav className="hidden max-h-[min(420px,55vh)] flex-col gap-1 overflow-y-auto pr-1 lg:flex">
              {filteredTopics.map((t) => {
                const { done, total } = topicProgress(t.id, history, t);
                const activeRow = t.id === topic?.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTopicId(t.id)}
                    className={`rounded-control border px-3 py-2.5 text-left text-sm transition-colors ${
                      activeRow
                        ? "border-foreground/25 bg-foreground/5"
                        : "border-transparent hover:bg-foreground/[0.04]"
                    }`}
                  >
                    <div className="font-semibold text-foreground">{t.title}</div>
                    <div className="mt-0.5 text-[12px] text-muted">
                      {done}/{total} prompts tried · {difficultyLabel(t.difficulty)}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex gap-1 overflow-x-auto rounded-control border border-border bg-card p-1">
            {partOrder.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPart(p)}
                className={`shrink-0 rounded-control px-3 py-2 text-sm font-semibold transition-colors ${
                  part === p ? "bg-foreground text-background" : "text-muted hover:text-foreground"
                }`}
              >
                {PART_LABELS[p]}
              </button>
            ))}
          </div>

          {topic ? (
            <section className="rounded-card border border-border bg-card">
              <div className="border-b border-border px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-sans text-lg font-semibold text-foreground">{topic.title}</h2>
                    <p className="mt-1 text-sm text-muted">{topic.description}</p>
                    <p className="mt-2 text-[13px] text-muted">
                      Progress for this topic:{" "}
                      <span className="font-medium text-foreground">
                        {progress.done}/{progress.total}
                      </span>{" "}
                      prompts with at least one attempt.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={scrollToQuestions}
                    className="inline-flex shrink-0 items-center justify-center rounded-control bg-primary px-3.5 py-2.5 text-sm font-semibold text-primaryText"
                  >
                    Practice this topic
                  </button>
                </div>
              </div>

              <div ref={questionsAnchorRef} className="px-4 py-4 sm:px-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  {part === "part2" ? "Cue card" : "Questions"}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {cards.map((q, idx) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => openQuestion(q)}
                      className="rounded-card border border-border bg-background p-4 text-left transition-shadow hover:shadow-sm"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        {part === "part2" ? "Long turn" : `Question ${idx + 1}`}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{q.text}</p>
                      <div className="mt-3 text-[13px] font-medium text-muted">Tap to practice →</div>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {history.length > 0 ? (
            <section className="mt-6 rounded-card border border-border bg-card px-4 py-4 sm:px-5">
              <h3 className="text-sm font-semibold text-foreground">Recent attempts</h3>
              <ul className="mt-3 flex list-none flex-col gap-2 p-0">
                {history.slice(0, 8).map((h) => (
                  <li
                    key={h.id}
                    className="rounded-control border border-border px-3 py-2 text-[13px] text-muted"
                  >
                    <span className="font-medium text-foreground">{PART_LABELS[h.part]}</span>
                    {" · "}
                    Band {formatBand(h.overall)}
                    {" · "}
                    {new Date(h.at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="speaking-practice-title"
          onClick={closePanel}
        >
          <div
            className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-card border border-border bg-card shadow-lg sm:rounded-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
              <h2 id="speaking-practice-title" className="text-base font-semibold text-foreground">
                {PART_LABELS[active.part]}
              </h2>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-control border border-border px-2.5 py-1 text-sm text-muted hover:text-foreground"
              >
                Close
              </button>
            </div>

            <div className="px-4 py-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{active.questionText}</p>

              {!isRecording && prepTick === null && !reviewText && evalState !== "done" ? (
                <div className="mt-4 flex flex-col gap-3">
                  {active.part === "part2" ? (
                    <>
                      <button
                        type="button"
                        onClick={beginPart2Prep}
                        className="rounded-control bg-primary px-3.5 py-2.5 text-sm font-semibold text-primaryText"
                      >
                        Start {PART2_PREP_SECONDS}s preparation
                      </button>
                      <button
                        type="button"
                        onClick={skipPrep}
                        className="text-sm text-muted underline decoration-border underline-offset-2"
                      >
                        Skip prep and start recording
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void startRecordingFlow()}
                      className="rounded-control bg-primary px-3.5 py-2.5 text-sm font-semibold text-primaryText"
                    >
                      Start recording
                    </button>
                  )}
                  <p className="text-[13px] text-muted">
                    {live.supported
                      ? "Speech-to-text runs in your browser (Chrome works best). You can edit the transcript after stopping."
                      : "Speech-to-text is not available in this browser — you can still record and type your answer."}
                  </p>
                  {mic.error ? (
                    <p className="text-sm text-red-600 dark:text-red-400">{mic.error}</p>
                  ) : null}
                </div>
              ) : null}

              {prepTick !== null && prepTick > 0 ? (
                <div className="mt-4 rounded-control border border-border bg-background px-4 py-4 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted">Preparation</div>
                  <div className="mt-2 font-mono text-4xl font-bold tabular-nums text-foreground">{prepTick}s</div>
                  <p className="mt-2 text-sm text-muted">Plan your long turn; recording starts automatically.</p>
                  <button
                    type="button"
                    onClick={skipPrep}
                    className="mt-3 text-sm font-medium text-foreground underline decoration-border underline-offset-2"
                  >
                    Skip to recording
                  </button>
                </div>
              ) : null}

              {isRecording ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-control border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted">Recording</div>
                    <div className="mt-1 font-mono text-3xl font-bold tabular-nums text-foreground">
                      {speakTick !== null ? `${speakTick}s left` : "—"}
                    </div>
                  </div>
                  <p className="min-h-[4.5rem] rounded-control border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground">
                    {live.combined || "Listening…"}
                  </p>
                  <button
                    type="button"
                    onClick={stopRecordingManual}
                    className="w-full rounded-control border border-border bg-card py-2.5 text-sm font-semibold text-foreground"
                  >
                    Stop recording
                  </button>
                </div>
              ) : null}

              {!isRecording && (reviewText || evalState === "done" || evalState === "loading" || evalState === "error") ? (
                <div className="mt-4 space-y-3">
                  <label className="block text-[13px] text-muted" htmlFor="transcript-review">
                    Transcript (edit if needed)
                  </label>
                  <textarea
                    id="transcript-review"
                    className={`${fieldClass} min-h-32 resize-y`}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={6}
                    disabled={evalState === "loading"}
                  />
                  {mic.audioUrl ? (
                    <div>
                      <p className="mb-1 text-[13px] text-muted">Your recording</p>
                      <audio className="w-full" controls src={mic.audioUrl} />
                    </div>
                  ) : null}
                  {evalState !== "done" ? (
                    <button
                      type="button"
                      onClick={() => void onSubmitEvaluation()}
                      disabled={evalState === "loading"}
                      className="w-full rounded-control bg-primary px-3.5 py-2.5 text-sm font-semibold text-primaryText disabled:opacity-60"
                    >
                      {evalState === "loading" ? "Getting AI feedback…" : "Get AI feedback"}
                    </button>
                  ) : null}
                  {evalError ? (
                    <p className="text-sm text-red-600 dark:text-red-400">{evalError}</p>
                  ) : null}
                </div>
              ) : null}

              {result && evalState === "done" ? (
                <div className="mt-6 space-y-4 border-t border-border pt-4">
                  <div className="rounded-control border border-border bg-background px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted">Overall band (approx.)</div>
                    <div className="mt-1 text-3xl font-bold text-foreground">{formatBand(result.scores.overall)}</div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      {(
                        [
                          ["Fluency", result.scores.fluency],
                          ["Pronunciation", result.scores.pronunciation],
                          ["Grammar", result.scores.grammar],
                          ["Vocabulary", result.scores.vocabulary],
                        ] as const
                      ).map(([label, val]) => (
                        <div key={label} className="flex items-center justify-between rounded-control border border-border px-2 py-1.5">
                          <dt className="text-muted">{label}</dt>
                          <dd className="font-mono font-semibold text-foreground">{formatBand(val)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {result.key_vocabulary.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Key vocabulary</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {result.key_vocabulary.map((w) => (
                          <span
                            key={w}
                            className="rounded-full border border-border bg-card px-2.5 py-1 text-[13px] text-foreground"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {!hideSamples ? (
                    <section className="rounded-control border border-border bg-card p-3">
                      <h3 className="text-sm font-semibold text-foreground">Sample answer (high band)</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {result.sample_answer}
                      </p>
                    </section>
                  ) : null}

                  <section className="rounded-control border border-border bg-card p-3">
                    <h3 className="text-sm font-semibold text-foreground">Improved version</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {result.corrected_version}
                    </p>
                  </section>

                  {!hideSamples ? (
                    <section className="rounded-control border border-border bg-card p-3">
                      <h3 className="text-sm font-semibold text-foreground">More natural phrasing</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {result.natural_version}
                      </p>
                    </section>
                  ) : null}

                  <FeedbackSection
                    title="Grammar highlights"
                    items={result.feedback.grammar_mistakes}
                    emptyText="No major grammar issues detected."
                  />
                  <FeedbackSection
                    title="Vocabulary"
                    items={result.feedback.vocabulary_improvements}
                    emptyText="No obvious vocabulary improvements."
                  />
                  <FeedbackSection
                    title="Clarity & coherence"
                    items={result.feedback.clarity_comments}
                    emptyText="Your message reads clearly."
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setEvalState("idle");
                      setResult(null);
                      setReviewText("");
                      mic.clear();
                      live.reset();
                    }}
                    className="w-full rounded-control border border-border py-2.5 text-sm font-semibold text-foreground"
                  >
                    Practice again
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
