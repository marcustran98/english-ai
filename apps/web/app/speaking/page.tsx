"use client";

import { useState } from "react";

import { FeedbackSection } from "@/app/components/FeedbackSection";
import { evaluateSpeaking } from "@/app/lib/api";
import type { SpeakingEvaluateResponse } from "@/app/lib/types";

export default function SpeakingPage() {
  const [topic, setTopic] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const [result, setResult] = useState<SpeakingEvaluateResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;

    if (!topic.trim()) {
      setValidation("Add a topic or question you want to answer.");
      setError(null);
      return;
    }
    if (!answer.trim()) {
      setValidation("Write your answer first, then submit.");
      setError(null);
      return;
    }

    setValidation(null);
    setIsLoading(true);
    setError(null);
    try {
      const data = await evaluateSpeaking({ topic: topic.trim(), answer: answer.trim() });
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-control border border-border bg-card px-3 py-2.5 text-foreground outline-none ring-offset-background focus:ring-2 focus:ring-foreground/15";

  return (
    <div className="flex flex-col gap-4">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <section className="rounded-card border border-border bg-card">
          <div className="px-4 pb-0 pt-4">
            <h1 className="font-sans text-[22px] font-bold tracking-tight text-foreground">Speaking Trainer</h1>
            <p className="mt-1.5 text-sm text-muted">
              Read the question, type what you would say out loud, and submit for corrections and feedback.
            </p>
          </div>
          <div className="p-4">
            <form className="grid gap-4" onSubmit={onSubmit}>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] text-muted" htmlFor="speaking-topic">
                  Topic or question
                </label>
                <input
                  id="speaking-topic"
                  className={fieldClass}
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    if (validation) setValidation(null);
                  }}
                  placeholder="e.g. Describe your last weekend"
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] text-muted" htmlFor="speaking-answer">
                  Your answer
                </label>
                <textarea
                  id="speaking-answer"
                  className={`${fieldClass} min-h-40 resize-y`}
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    if (validation) setValidation(null);
                  }}
                  placeholder="Type your answer as naturally as you can…"
                  rows={8}
                />
              </div>
              <div className="flex flex-col gap-2.5">
                <button
                  className="inline-flex cursor-pointer items-center justify-center rounded-control border border-transparent bg-primary px-3.5 py-2.5 font-semibold text-primaryText disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? "Checking…" : "Submit"}
                </button>
                {validation ? <p className="text-sm text-amber-700 dark:text-amber-400">{validation}</p> : null}
                {error ? (
                  <div className="rounded-control border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-700 dark:text-red-400">
                    {error}
                  </div>
                ) : null}
              </div>
            </form>
          </div>
        </section>

        {result ? (
          <div className="flex flex-col gap-4">
            <p className="mt-1 text-sm text-muted">
              Read in order: what to fix, how a native might say it, then detailed notes.
            </p>

            <section className="rounded-card border border-border bg-card" aria-labelledby="corrected-heading">
              <div className="px-4 pb-0 pt-4">
                <h2 id="corrected-heading" className="m-0 font-sans text-base font-semibold text-foreground">
                  Corrected version
                </h2>
              </div>
              <div className="p-4">
                <p className="whitespace-pre-wrap leading-relaxed text-foreground">{result.corrected_version}</p>
              </div>
            </section>

            <section className="rounded-card border border-border bg-card" aria-labelledby="natural-heading">
              <div className="px-4 pb-0 pt-4">
                <h2 id="natural-heading" className="m-0 font-sans text-base font-semibold text-foreground">
                  More natural version
                </h2>
              </div>
              <div className="p-4">
                <p className="whitespace-pre-wrap leading-relaxed text-foreground">{result.natural_version}</p>
              </div>
            </section>

            <div className="flex flex-col gap-3">
              <FeedbackSection
                title="Grammar"
                items={result.feedback.grammar_mistakes}
                emptyText="No major grammar issues detected."
              />
              <FeedbackSection
                title="Vocabulary"
                items={result.feedback.vocabulary_improvements}
                emptyText="No obvious vocabulary improvements."
              />
              <FeedbackSection title="Clarity" items={result.feedback.clarity_comments} emptyText="Your message is clear." />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
