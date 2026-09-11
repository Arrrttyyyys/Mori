"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { TherapyResponse } from "@/lib/therapy/types";
interface Props {
  sessionId: string;
  onClose: () => void;
  language?: string;
  mode?: string;
  audioAllowed?: boolean;
}
export default function TherapyInterface({
  sessionId,
  onClose,
  language = "en-US",
  mode = "guided",
  audioAllowed = true,
}: Props) {
  const { authorizedFetch } = useAuth();
  const [caption, setCaption] = useState(
    "Take your time. We can begin whenever you feel ready.",
  );
  const [memory, setMemory] = useState<{
    image: string;
    title: string;
    mediaKind: string;
  } | null>(null);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [closed, setClosed] = useState(false);
  const [voice, setVoice] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [turns, setTurns] = useState<{ who: string; text: string }[]>([]);
  const [cameraOn, setCameraOn] = useState(false);
  const cameraStream = useRef<MediaStream | null>(null);
  const cameraVideo = useRef<HTMLVideoElement | null>(null);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (closed || paused) return;
    const timer = setInterval(() => setSeconds((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [closed, paused]);
  useEffect(() => {
    if (cameraVideo.current) cameraVideo.current.srcObject = cameraStream.current;
  }, [cameraOn]);
  const toggleCamera = async () => {
    if (cameraStream.current) {
      cameraStream.current.getTracks().forEach((track) => track.stop());
      cameraStream.current = null;
      setCameraOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (!mounted.current || !active.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      cameraStream.current = stream;
      setCameraOn(true);
    } catch {
      setError("Camera access is unavailable. You can continue without it.");
    }
  };
  const transcriptEnd = useRef<HTMLDivElement | null>(null);
  useEffect(() => { transcriptEnd.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [turns, closed]);
  const recognition = useRef<any>(null);
  const active = useRef(true);
  const processing = useRef(false);
  const speaking = useRef(false);
  const voiceRef = useRef(false);
  const pausedRef = useRef(false);
  const sendRef = useRef<(text: string) => Promise<void>>(async () => {});
  const restart = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSpeech = useRef<{ text: string; at: number }>({
    text: "",
    at: 0,
  });
  const mounted = useRef(true);
  const requestAbort = useRef<AbortController | null>(null);
  const startListening = useCallback(() => {
    if (
      active.current &&
      voiceRef.current &&
      !pausedRef.current &&
      !speaking.current &&
      !processing.current &&
      recognition.current
    ) {
      try {
        recognition.current.start();
      } catch {}
    }
  }, []);
  const stopAudio = () => {
    if (restart.current) clearTimeout(restart.current);
    recognition.current?.abort();
    window.speechSynthesis?.cancel();
    speaking.current = false;
    setListening(false);
  };
  const speak = (text: string) => {
    if (!voiceRef.current || pausedRef.current || !window.speechSynthesis) {
      processing.current = false;
      return;
    }
    recognition.current?.abort();
    speaking.current = true;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.85;
    const available = window.speechSynthesis.getVoices();
    utterance.voice =
      available.find((v) => v.lang.toLowerCase() === language.toLowerCase()) ??
      available.find((v) => v.lang.startsWith(language.split("-")[0])) ??
      null;
    utterance.onend = utterance.onerror = () => {
      speaking.current = false;
      if (mounted.current) restart.current = setTimeout(startListening, 500);
    };
    window.speechSynthesis.speak(utterance);
  };
  const send = async (text: string) => {
    text = text.trim();
    if (!text || processing.current || pausedRef.current || !active.current)
      return;
    processing.current = true;
    setBusy(true);
    setError("");
    recognition.current?.abort();
    setTurns((t) => [...t, { who: "You", text }]);
    try {
      const controller = new AbortController();
      requestAbort.current = controller;
      const timeout = setTimeout(() => controller.abort(), 45000);
      let response: Response;
      try {
        response = await authorizedFetch("/api/therapy/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            user_message: text,
            mode,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          pausedRef.current = true;
          setPaused(true);
        }
        throw new Error(
          data.error ?? "We could not connect. Please try again.",
        );
      }
      if (!mounted.current || !active.current) return;
      const reply: TherapyResponse = data.response;
      const textReply = [reply.spoken_response, reply.next_question]
        .filter(Boolean)
        .join(" ");
      setCaption(textReply);
      setTurns((t) => [...t, { who: "Mori", text: textReply }]);
      setMemory(reply.show_photo ? data.selected_memory : null);
      processing.current = false;
      setBusy(false);
      if (reply.session_action === "close") {
        active.current = false;
        cameraStream.current?.getTracks().forEach((track) => track.stop());
        setCameraOn(false);
        setClosed(true);
        setMemory(null);
      }
      if (reply.safety?.supervisor_attention) {
        pausedRef.current = true;
        setPaused(true);
        setError("Please check in with a caregiver before continuing.");
      }
      speak(textReply);
    } catch (e) {
      if (mounted.current) {
        setError(
          (e as Error).name === "AbortError"
            ? "The connection is taking too long. Take a moment, then try again."
            : (e as Error).message,
        );
        setCaption("We can take a quiet moment together.");
      }
    } finally {
      processing.current = false;
      if (mounted.current) {
        setBusy(false);
        if (!speaking.current)
          restart.current = setTimeout(startListening, 700);
      }
    }
  };
  sendRef.current = send;
  useEffect(() => {
    mounted.current = true;
    active.current = true;
    const Constructor =
      (window as any).SpeechRecognition ??
      (window as any).webkitSpeechRecognition;
    if (Constructor) {
      const r = new Constructor();
      recognition.current = r;
      r.continuous = false;
      r.interimResults = false;
      r.lang = language;
      r.onstart = () => setListening(true);
      r.onend = () => {
        if (!mounted.current) return;
        setListening(false);
        if (!processing.current && !speaking.current)
          restart.current = setTimeout(startListening, 600);
      };
      r.onresult = (event: any) => {
        if (processing.current || speaking.current || pausedRef.current) return;
        const text = event.results[event.resultIndex]?.[0]?.transcript ?? "";
        const now = Date.now();
        if (
          text === latestSpeech.current.text &&
          now - latestSpeech.current.at < 1500
        )
          return;
        latestSpeech.current = { text, at: now };
        sendRef.current(text);
      };
      r.onerror = (event: any) => {
        if (
          ["not-allowed", "service-not-allowed", "audio-capture"].includes(
            event.error,
          )
        ) {
          voiceRef.current = false;
          setVoice(false);
          setError("Microphone access is unavailable. You can type below.");
        }
      };
    }
    return () => {
      cameraStream.current?.getTracks().forEach((track) => track.stop());
      mounted.current = false;
      active.current = false;
      if (restart.current) clearTimeout(restart.current);
      if (recognition.current) {
        recognition.current.onend = null;
        recognition.current.onresult = null;
        recognition.current.abort();
      }
      window.speechSynthesis?.cancel();
      requestAbort.current?.abort();
    };
  }, [language, startListening]);
  const toggleVoice = () => {
    if (!audioAllowed) {
      setError("Voice is turned off in the family profile.");
      return;
    }
    if (!recognition.current) {
      setError(
        "This browser does not support voice input. You can type below.",
      );
      return;
    }
    voiceRef.current = !voiceRef.current;
    setVoice(voiceRef.current);
    if (voiceRef.current) startListening();
    else stopAudio();
  };
  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (pausedRef.current) stopAudio();
    else startListening();
  };
  const finish = async () => {
    pausedRef.current = true;
    setPaused(true);
    stopAudio();
    if (processing.current) {
      setError("Please wait for this reply to finish, then end the session.");
      return;
    }
    try {
      const r = await authorizedFetch(
        `/api/therapy/session?session_id=${sessionId}`,
        { method: "DELETE" },
      );
      if (!r.ok) throw Error("Could not save the ending. Please try again.");
      active.current = false;
      cameraStream.current?.getTracks().forEach((track) => track.stop());
      setCameraOn(false);
      setClosed(true);
      setMemory(null);
      setCaption(
        "Thank you for spending this time together. We can talk again whenever you like.",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const status = closed ? "Session ended" : paused ? "Taking a pause" : busy ? "Mori is thinking…" : listening ? "Listening…" : "Ready to listen";
  return (
    <main className="flex min-h-screen flex-col bg-background lg:h-screen lg:flex-row lg:overflow-hidden">
      <section aria-label="Mori session" className="flex min-w-0 flex-1 flex-col">
        <div className="relative flex min-h-[55vh] flex-1 items-center justify-center bg-gray-900 px-6 pb-36 pt-12">
          <div className="text-center">
            <img src="/images/mori-companion.png" alt="Mori companion" className="mx-auto mb-5 h-56 w-56 rounded-full object-cover md:h-80 md:w-80" />
            <div className="inline-block rounded-lg bg-black/50 px-5 py-2 text-white">
              <h1 className="text-xl font-medium">Mori</h1>
              <p className="text-sm tabular-nums">{Math.floor(seconds / 60).toString().padStart(2, "0")}:{(seconds % 60).toString().padStart(2, "0")}</p>
            </div>
          </div>
          <div className="absolute bottom-5 left-5">
            {cameraOn ? <video ref={cameraVideo} autoPlay playsInline muted aria-label="Your camera preview" className="h-24 w-24 rounded-full border-4 border-white object-cover md:h-32 md:w-32" /> : <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-secondary text-3xl text-text md:h-32 md:w-32" aria-label="Your camera is off">You</div>}
          </div>
          {!closed && <div className="absolute bottom-6 right-5 flex gap-2">
            <button aria-label={voice ? "Mute microphone" : "Turn microphone on"} title={voice ? "Mute microphone" : "Turn microphone on"} onClick={toggleVoice} className={`rounded-full px-4 py-3 text-sm text-white ${voice ? "bg-white/20" : "bg-red-600"}`}>Mic {voice ? "on" : "off"}</button>
            <button aria-label={cameraOn ? "Turn camera off" : "Turn camera on"} onClick={toggleCamera} className="rounded-full bg-white/20 px-4 py-3 text-sm text-white">Camera {cameraOn ? "on" : "off"}</button>
            <button onClick={finish} disabled={busy} className="rounded-full bg-red-600 px-4 py-3 text-sm text-white disabled:opacity-50">End call</button>
          </div>}
        </div>
        {memory && <div className="border-t border-secondary/50 bg-secondary/20 p-4">
          <div className="mx-auto max-w-lg">
            {memory.image ? memory.mediaKind === "video" ? <video key={memory.image} controls src={memory.image} className="max-h-48 w-full rounded-xl" onPlay={() => { pausedRef.current = true; setPaused(true); stopAudio(); }} /> : memory.mediaKind === "audio" ? <audio key={memory.image} controls src={memory.image} className="w-full" onPlay={() => { pausedRef.current = true; setPaused(true); stopAudio(); }} /> : <img src={memory.image} alt={memory.title} className="h-48 w-full rounded-xl object-contain" /> : <p className="text-center text-xl">{memory.title}</p>}
          </div>
        </div>}
      </section>
      <aside aria-label="Live conversation" className="flex min-h-[45vh] w-full flex-col border-l border-secondary/50 bg-white lg:h-screen lg:w-96 lg:shrink-0">
        <header className="border-b border-secondary/50 p-6">
          <h2 className="text-2xl font-semibold">Live Conversation</h2>
          <p className="mt-1 text-sm text-text/60">Captions from your session</p>
        </header>
        <div role="log" aria-live="polite" className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
          <div><p className="mb-1 font-semibold text-primary">Mori</p><p className="leading-relaxed text-text/80">Take your time. We can begin whenever you feel ready.</p></div>
          {turns.map((turn, index) => <div key={index} className="flex items-start gap-3">
            <div aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${turn.who === "Mori" ? "bg-primary/20 text-primary" : "bg-blue-100 text-blue-700"}`}>{turn.who === "Mori" ? "M" : "Y"}</div>
            <div><p className="mb-1 font-semibold">{turn.who}</p><p className="leading-relaxed text-text/80">{turn.text}</p></div>
          </div>)}
          {closed && <p className="leading-relaxed text-text/80">{caption}</p>}
          <div ref={transcriptEnd} />
        </div>
        <div className="space-y-3 border-t border-secondary/50 bg-secondary/30 p-4">
          <p role="status" className="flex items-center gap-2 text-sm text-text/70"><span className={`h-2 w-2 rounded-full ${listening ? "bg-green-600 animate-pulse" : busy ? "bg-blue-500 animate-pulse" : "bg-gray-400"}`} />{status}</p>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {closed ? <button onClick={onClose} className="w-full rounded-xl bg-primary px-4 py-3 text-white">Return to the Mori Room</button> : <>
            <div className="flex gap-3 text-sm">
              <button onClick={togglePause} className="rounded-lg border border-primary/30 px-3 py-2">{paused ? "Continue" : "Pause"}</button>
            </div>
            <form onSubmit={(event) => { event.preventDefault(); if (input.trim()) { send(input); setInput(""); } }} className="flex gap-2">
              <label htmlFor="mori-message" className="sr-only">Your message</label>
              <input id="mori-message" value={input} onChange={(event) => setInput(event.target.value)} disabled={busy || paused} placeholder="Or type here…" className="min-w-0 flex-1 rounded-xl border border-primary/30 bg-white p-3" />
              <button disabled={busy || paused || !input.trim()} className="rounded-xl bg-primary px-4 text-white disabled:opacity-50">Send</button>
            </form>
          </>}
        </div>
      </aside>
    </main>
  );
}
