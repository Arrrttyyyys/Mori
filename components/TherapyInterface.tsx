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
  const [failedText, setFailedText] = useState("");
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const [turns, setTurns] = useState<{ who: string; text: string }[]>([]);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (closed || paused) return;
    const timer = setInterval(() => setSeconds((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [closed, paused]);
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
  const cancelEndButton = useRef<HTMLButtonElement | null>(null);
  const finishButton = useRef<HTMLButtonElement | null>(null);
  const endDialog = useRef<HTMLElement | null>(null);
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
    setFailedText("");
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
        const closeResponse = await authorizedFetch(
          `/api/therapy/session?session_id=${sessionId}`,
          { method: "DELETE" },
        );
        if (!closeResponse.ok)
          throw new Error("Mori could not save the ending. Please try again.");
        active.current = false;
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
        setFailedText(text);
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
    setEnding(true);
    setError("");
    try {
      const r = await authorizedFetch(
        `/api/therapy/session?session_id=${sessionId}`,
        { method: "DELETE" },
      );
      if (!r.ok) throw Error("Could not save the ending. Please try again.");
      active.current = false;
      setClosed(true);
      setConfirmingEnd(false);
      setMemory(null);
      setCaption(
        "Thank you for spending this time together. We can talk again whenever you like.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnding(false);
    }
  };
  const cancelFinish = useCallback(() => {
    setConfirmingEnd(false);
    setError("");
    pausedRef.current = false;
    setPaused(false);
    startListening();
    window.requestAnimationFrame(() => finishButton.current?.focus());
  }, [startListening]);
  useEffect(() => {
    if (!confirmingEnd) return;
    cancelEndButton.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !ending) cancelFinish();
      if (event.key === "Tab") {
        const buttons = Array.from(
          endDialog.current?.querySelectorAll<HTMLButtonElement>(
            "button:not([disabled])",
          ) ?? [],
        );
        if (!buttons.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cancelFinish, confirmingEnd, ending]);
  const status = closed
    ? "Session ended"
    : paused
      ? "Taking a pause"
      : busy
        ? "Mori is thinking"
        : listening
          ? "Mori is listening"
          : voice
            ? "Voice is ready"
            : "At your pace";
  const elapsed = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  const sessionButton =
    "min-h-12 rounded-2xl border border-white/20 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="min-h-dvh bg-[#18221d] text-text min-[960px]:grid min-[960px]:h-dvh min-[960px]:grid-cols-[minmax(0,1fr)_400px] min-[960px]:overflow-hidden">
      <section
        aria-label="Mori session"
        className="flex min-h-[62dvh] min-w-0 flex-col bg-[#1f2b25] text-white min-[960px]:h-dvh"
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <span className="font-serif text-3xl text-[#c8d5c8]">Mori</span>
            <span className="hidden rounded-full bg-white/10 px-3 py-1 text-sm text-white/70 sm:inline">
              A quiet conversation
            </span>
          </div>
          <div className="text-right">
            <p role="status" aria-live="polite" className="text-base text-white/90">
              {status}
            </p>
            <p className="text-sm tabular-nums text-white/60">{elapsed}</p>
          </div>
        </header>

        <div className="relative flex min-h-[420px] flex-1 items-center justify-center overflow-hidden px-5 py-8 md:min-h-[520px] md:px-10 min-[960px]:min-h-0">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(134,158,137,0.18),transparent_62%)]" />
          {memory ? (
            <figure className="relative z-10 flex h-full w-full max-w-4xl flex-col items-center justify-center">
              <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden rounded-3xl bg-black/25 shadow-2xl ring-1 ring-white/10">
                {memory.image ? (
                  memory.mediaKind === "video" ? (
                    <video
                      key={memory.image}
                      controls
                      src={memory.image}
                      className="max-h-[62dvh] w-full object-contain"
                      onPlay={() => {
                        pausedRef.current = true;
                        setPaused(true);
                        stopAudio();
                      }}
                    />
                  ) : memory.mediaKind === "audio" ? (
                    <div className="w-full max-w-xl p-8 text-center">
                      <div aria-hidden="true" className="mb-6 text-6xl">♪</div>
                      <audio
                        key={memory.image}
                        controls
                        src={memory.image}
                        className="w-full"
                        onPlay={() => {
                          pausedRef.current = true;
                          setPaused(true);
                          stopAudio();
                        }}
                      />
                    </div>
                  ) : (
                    <img
                      src={memory.image}
                      alt={memory.title}
                      className="max-h-[62dvh] w-full object-contain"
                    />
                  )
                ) : (
                  <p className="p-10 text-center font-serif text-3xl">{memory.title}</p>
                )}
              </div>
              <figcaption className="mt-4 text-center text-lg text-white/80">
                {memory.title}
              </figcaption>
            </figure>
          ) : (
            <div className="relative z-10 text-center">
              <div className="mx-auto mb-7 w-fit rounded-full bg-[#dbe3d9]/10 p-3 ring-1 ring-white/15 shadow-2xl">
                <img
                  src="/images/mori-companion.png"
                  alt="Mori, your AI companion"
                  className="h-48 w-48 rounded-full object-cover sm:h-60 sm:w-60 md:h-72 md:w-72"
                />
              </div>
              <h1 className="font-serif text-3xl text-[#eef3eb] md:text-4xl">
                A little time together
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/70">
                {caption}
              </p>
            </div>
          )}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 rounded-2xl bg-black/35 px-4 py-3 backdrop-blur-sm md:bottom-6 md:left-6">
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d9e2d7] font-semibold text-[#25352c]">You</span>
            <div className="hidden sm:block">
              <p className="text-sm font-medium">You are here</p>
              <p className="text-xs text-white/60">Camera is not used</p>
            </div>
          </div>
        </div>

        {!closed && (
          <nav aria-label="Session controls" className="border-t border-white/10 bg-black/15 px-4 py-4 md:px-8">
            <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-3">
              <button
                type="button"
                aria-pressed={voice}
                onClick={toggleVoice}
                className={`${sessionButton} ${voice ? "bg-[#5a6d5a]" : "bg-white/5"}`}
              >
                {voice ? "Voice on" : "Turn voice on"}
              </button>
              <button type="button" aria-pressed={paused} onClick={togglePause} className={`${sessionButton} bg-white/5`}>
                {paused ? "Continue" : "Pause"}
              </button>
              <button
                type="button"
                disabled={busy || paused}
                onClick={() => send("A different memory, please.")}
                className={`${sessionButton} bg-white/5`}
              >
                Different memory
              </button>
              <button
                ref={finishButton}
                type="button"
                disabled={busy || ending}
                onClick={() => {
                  pausedRef.current = true;
                  setPaused(true);
                  stopAudio();
                  setConfirmingEnd(true);
                }}
                className={`${sessionButton} border-[#e1aaa0]/50 bg-[#8e443b] hover:bg-[#a34d43]`}
              >
                Finish for today
              </button>
            </div>
          </nav>
        )}
      </section>

      <aside
        aria-label="Live conversation"
        className="flex min-h-[38dvh] flex-col bg-[#fbfaf6] min-[960px]:h-dvh min-[960px]:min-h-0"
      >
        <header className="border-b border-[#dfe3db] px-5 py-5 md:px-6">
          <h2 className="font-serif text-2xl text-[#2e3b33]">Live conversation</h2>
          <p className="mt-1 text-sm text-text/60">You can speak or type. There is no test.</p>
        </header>
        <div role="log" aria-live="polite" aria-relevant="additions" className="min-h-[260px] flex-1 space-y-6 overflow-y-auto px-5 py-6 md:px-6">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">M</span>
            <div>
              <p className="mb-1 font-semibold text-primary">Mori</p>
              <p className="leading-relaxed text-text/80">Take your time. We can begin whenever you feel ready.</p>
            </div>
          </div>
          {turns.map((turn, index) => (
            <div key={index} className="flex items-start gap-3">
              <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold ${turn.who === "Mori" ? "bg-primary/15 text-primary" : "bg-[#e5e9ed] text-[#45515d]"}`}>
                {turn.who === "Mori" ? "M" : "Y"}
              </span>
              <div>
                <p className="mb-1 font-semibold">{turn.who}</p>
                <p className="leading-relaxed text-text/80">{turn.text}</p>
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-3 text-text/60">
              <span aria-hidden="true" className="h-3 w-3 rounded-full bg-primary motion-safe:animate-pulse" />
              <p>Mori is taking a moment to respond…</p>
            </div>
          )}
          {closed && (
            <div className="rounded-2xl bg-primary/10 p-4">
              <p className="font-semibold text-primary">A moment shared</p>
              <p className="mt-1 leading-relaxed text-text/80">{caption}</p>
            </div>
          )}
          <div ref={transcriptEnd} />
        </div>

        <div className="space-y-3 border-t border-[#dfe3db] bg-[#f2f0e9] p-4 md:p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-text/70">
            <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${listening ? "bg-green-600 motion-safe:animate-pulse" : busy ? "bg-blue-500 motion-safe:animate-pulse" : paused ? "bg-amber-600" : "bg-gray-400"}`} />
            {status}
          </p>
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p>{error}</p>
              {failedText && !busy && !paused && (
                <button type="button" onClick={() => send(failedText)} className="mt-2 min-h-11 rounded-lg border border-red-300 px-3 font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200">
                  Try that message again
                </button>
              )}
            </div>
          )}
          {closed ? (
            <button onClick={onClose} className="min-h-14 w-full rounded-2xl bg-primary px-5 py-3 text-lg font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30">
              Return to the Mori Room
            </button>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (input.trim()) {
                  const message = input;
                  setInput("");
                  send(message);
                }
              }}
              className="flex flex-col gap-2 min-[420px]:flex-row"
            >
              <label htmlFor="mori-message" className="sr-only">Your message</label>
              <input
                id="mori-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={busy || paused || ending}
                placeholder={paused ? "Continue when you are ready" : "Or type here…"}
                className="min-h-14 min-w-0 flex-1 rounded-2xl border border-primary/25 bg-white px-4 text-lg shadow-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:bg-black/5"
              />
              <button disabled={busy || paused || ending || !input.trim()} className="min-h-14 rounded-2xl bg-primary px-5 text-lg font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-45">
                Send
              </button>
            </form>
          )}
        </div>
      </aside>

      {confirmingEnd && !closed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5">
          <section ref={endDialog} role="alertdialog" aria-modal="true" aria-labelledby="finish-title" aria-describedby="finish-description" className="w-full max-w-md rounded-3xl bg-[#fbfaf6] p-7 shadow-2xl">
            <h2 id="finish-title" className="font-serif text-3xl text-[#2e3b33]">Finish for today?</h2>
            <p id="finish-description" className="mt-3 text-lg leading-relaxed text-text/70">Mori will save this conversation and return you to a quiet ending.</p>
            {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                ref={cancelEndButton}
                type="button"
                disabled={ending}
                onClick={cancelFinish}
                className="min-h-14 rounded-2xl border border-primary/25 px-5 text-lg font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                Keep talking
              </button>
              <button type="button" disabled={ending} onClick={finish} className="min-h-14 rounded-2xl bg-[#8e443b] px-5 text-lg font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8e443b]/30 disabled:opacity-50">
                {ending ? "Saving…" : "End session"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
