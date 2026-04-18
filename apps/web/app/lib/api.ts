import type { SpeakingEvaluateResponse, SpeakingPart } from "@/types/speaking";

export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  return base.replace(/\/+$/, "");
}

export async function evaluateSpeaking(input: {
  topic: string;
  answer: string;
  part?: SpeakingPart;
}): Promise<SpeakingEvaluateResponse> {
  const res = await fetch(`${getApiBaseUrl()}/v1/speaking/evaluate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      topic: input.topic,
      answer: input.answer,
      part: input.part ?? "part1",
    }),
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { detail?: string };
      if (data?.detail) detail = data.detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  return (await res.json()) as SpeakingEvaluateResponse;
}

