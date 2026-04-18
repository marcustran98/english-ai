"use client";

import { useCallback, useRef, useState } from "react";

export function useMicRecorder() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const clear = useCallback(() => {
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setError(null);
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime =
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.("audio/webm")
          ? "audio/webm"
          : undefined;
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      };
      mr.start(250);
      recorderRef.current = mr;
      return true;
    } catch {
      setError("Microphone access was blocked or unavailable.");
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    const mr = recorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
    }
    recorderRef.current = null;
  }, []);

  return { audioUrl, error, start, stop, clear };
}

