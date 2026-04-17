"use client";

import { useMemo, useState } from "react";

import { FeedbackSection } from "@/app/components/FeedbackSection";
import { evaluateSpeaking } from "@/app/lib/api";
import type { SpeakingEvaluateResponse } from "@/app/lib/types";

import styles from "../page.module.css";

export default function SpeakingPage() {
  const [topic, setTopic] = useState("Describe your last weekend");
  const [answer, setAnswer] = useState(
    "Last weekend I go to the coffee with my friend. We talking about work and I feel very relax."
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpeakingEvaluateResponse | null>(null);

  const canSubmit = useMemo(() => topic.trim().length > 0 && answer.trim().length > 0, [topic, answer]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || isLoading) return;
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

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <section className="card">
          <div className="cardHeader">
            <h1 className={styles.title}>Speaking Trainer</h1>
            <p className="muted" style={{ marginTop: 6 }}>
              Hello: Type your answer (simulate speaking). You’ll get corrections, a more natural version, and simple feedback.
            </p>
          </div>
          <div className="cardBody">
            <form className={styles.grid} onSubmit={onSubmit}>
              <div className="field">
                <div className="label">Topic</div>
                <input
                  className="input"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Describe a memorable trip"
                />
              </div>
              <div className="field">
                <div className="label">Your answer</div>
                <textarea
                  className="textarea"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type what you would say..."
                />
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button className="btn" disabled={!canSubmit || isLoading} type="submit">
                  {isLoading ? "Evaluating..." : "Evaluate"}
                </button>
                <span className="muted" style={{ fontSize: 13 }}>
                  Backend: <span style={{ fontFamily: "var(--font-geist-mono)" }}>/v1/speaking/evaluate</span>
                </span>
              </div>

              {error ? <div className={styles.error}>{error}</div> : null}
            </form>
          </div>
        </section>

        {result ? (
          <div className={styles.resultGrid}>
            <section className="card">
              <div className="cardHeader">
                <h2 className="sectionTitle">Corrected version</h2>
              </div>
              <div className="cardBody">
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{result.corrected_version}</p>
              </div>
            </section>

            <section className="card">
              <div className="cardHeader">
                <h2 className="sectionTitle">Natural version</h2>
              </div>
              <div className="cardBody">
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{result.natural_version}</p>
              </div>
            </section>

            <div className={styles.twoCol}>
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

