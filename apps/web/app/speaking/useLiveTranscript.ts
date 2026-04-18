"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Narrow Web Speech API surface used here (Chromium / Safari variants). */
interface LiveSpeechAlternative {
  transcript: string;
}

interface LiveSpeechResult {
  readonly isFinal: boolean;
  readonly 0: LiveSpeechAlternative;
}

interface LiveSpeechResults {
  readonly length: number;
  readonly [index: number]: LiveSpeechResult;
}

interface LiveSpeechEvent {
  readonly resultIndex: number;
  readonly results: LiveSpeechResults;
}

interface LiveSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((this: LiveSpeechRecognition, ev: LiveSpeechEvent) => void) | null;
  onerror: ((this: LiveSpeechRecognition, ev: Event) => void) | null;
  onend: ((this: LiveSpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
}

type RecognitionCtor = new () => LiveSpeechRecognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useLiveTranscript() {
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<LiveSpeechRecognition | null>(null);
  const shouldLoopRef = useRef(false);
  const supported = typeof window !== "undefined" && !!getRecognitionCtor();

  const reset = useCallback(() => {
    setText("");
    setInterim("");
  }, []);

  const stop = useCallback(() => {
    shouldLoopRef.current = false;
    const r = recognitionRef.current;
    if (r) {
      try {
        r.onresult = null;
        r.onerror = null;
        r.onend = null;
        r.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setInterim("");
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    stop();
    shouldLoopRef.current = true;
    const r = new Ctor();
    r.lang = "en-US";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (event: LiveSpeechEvent) => {
      let interimChunk = "";
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const res = event.results[i];
        const chunk = res[0]?.transcript ?? "";
        if (res.isFinal) finalChunk += chunk;
        else interimChunk += chunk;
      }
      if (finalChunk) {
        setText((prev) => `${prev}${finalChunk}`.trimStart());
        setInterim("");
      } else {
        setInterim(interimChunk);
      }
    };
    r.onerror = () => {
      setInterim("");
    };
    r.onend = () => {
      if (recognitionRef.current === r && shouldLoopRef.current) {
        try {
          r.start();
        } catch {
          // already started or stopped
        }
      }
    };
    recognitionRef.current = r;
    try {
      r.start();
    } catch {
      // ignore
    }
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  const combined = `${text}${interim ? (text && !text.endsWith(" ") ? " " : "") + interim : ""}`.trim();

  return {
    supported,
    combined,
    text,
    setText,
    reset,
    start,
    stop,
  };
}
