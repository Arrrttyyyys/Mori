"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import LifeShell from "@/components/LifeShell";
import { useAuth } from "@/contexts/AuthContext";
export default function Insights() {
  const { authorizedFetch, userId } = useAuth();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    authorizedFetch("/api/insights")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, [userId]);
  return (
    <LifeShell
      title="Small moments, useful observations"
      description="Discover which memories invite conversation and what might make the next visit more comfortable."
    >
      {error && <p role="alert">{error}</p>}
      {data ? (
        <>
          <section className="rounded-2xl bg-secondary/40 p-6">
            <h2 className="text-2xl">For your next visit</h2>
            <p className="mt-3 text-lg">{data.recommendation}</p>
            <p className="mt-3 text-sm text-text/60">{data.scope}</p>
          </section>
          <div className="my-8 flex gap-8">
            <p>
              <strong>
                {data.sessions.filter((s: any) => s.status === "closed").length}
              </strong>{" "}
              completed sessions
            </p>
            <Link href="/room/stories" className="text-primary underline">
              {data.candidateStories} stories to review
            </Link>
          </div>
          <section>
            <h2 className="mb-4 text-2xl">Memories in recent conversations</h2>
            {data.memories.map((m: any) => (
              <article key={m.id} className="border-b border-primary/20 py-4">
                <h3 className="text-xl">{m.title}</h3>
                <p className="mt-1 text-text/70">
                  {m.observations} observed turns · {m.engagingTurns} longer
                  replies · {m.distressSignals} possible distress signals ·{" "}
                  {m.safety}
                </p>
              </article>
            ))}
          </section>
          <section className="mt-8">
            <h2 className="text-2xl">Session history</h2>
            {data.sessions.map((s: any) => (
              <p key={s.id} className="border-b border-primary/20 py-3">
                {new Date(s.started_at).toLocaleString()} · {s.status}
                {s.closed_at
                  ? ` · ${Math.max(1, Math.round((Date.parse(s.closed_at) - Date.parse(s.started_at)) / 60000))} minutes`
                  : ""}
              </p>
            ))}
          </section>
          <details className="mt-8">
            <summary className="cursor-pointer text-xl">
              Selection history for caregivers
            </summary>
            {data.decisions.slice(0, 20).map((d: any, i: number) => (
              <article key={i} className="border-b py-4">
                <p>
                  {new Date(d.created_at).toLocaleString()} ·{" "}
                  {d.selectedMemory?.title ?? "Present-focused support"}
                </p>
                <ul className="ml-5 list-disc">
                  {d.whySelected.map((r: string) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm">
                    Context and considered memories
                  </summary>
                  <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap text-xs">
                    {JSON.stringify(
                      { context: d.context, ranked: d.ranked },
                      null,
                      2,
                    )}
                  </pre>
                </details>
              </article>
            ))}
          </details>
        </>
      ) : (
        !error && <p>Loading observations…</p>
      )}
    </LifeShell>
  );
}
