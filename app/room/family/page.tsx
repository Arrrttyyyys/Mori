"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import LifeShell, { buttonClass, fieldClass } from "@/components/LifeShell";
import { useLife } from "@/lib/life/use-life";
export default function Family() {
  const {
    life,
    memories,
    userId,
    authorizedFetch,
    mutate,
    error,
    setError,
    saving,
    reload,
  } = useLife();
  const [text, setText] = useState("");
  const [expiry, setExpiry] = useState("");
  const [summaries, setSummaries] = useState<any[]>([]);
  const [saved, setSaved] = useState("");
  useEffect(() => {
    if (userId)
      authorizedFetch(`/api/user/${userId}/family-space`)
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw Error(d.error);
          setSummaries(d.family_space.session_summaries ?? []);
        })
        .catch((e) => setError(e.message));
  }, [userId]);
  const feedback = async (memoryId: string | number, assessment: string) => {
    setSaved("");
    try {
      const r = await authorizedFetch(`/api/user/${userId}/family-space`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memoryId, assessment }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setSaved("Feedback saved for future sessions.");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <LifeShell
      title="A place for family"
      description="Share what matters today, review recent conversations, and help Mori choose comfortable memories."
    >
      <div className="mb-8 flex flex-wrap gap-3">
        <Link href="/room/library" className={buttonClass}>
          Contribute a memory
        </Link>
        <Link href="/room/stories" className="rounded-xl border px-5 py-3">
          Review discovered stories
        </Link>
        <Link href="/room/settings" className="rounded-xl border px-5 py-3">
          Invite family
        </Link>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="text-2xl">Before the next session</h2>
          <form
            className="my-4 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await mutate({
                  action: "record",
                  record: {
                    kind: "note",
                    data: {
                      text,
                      expiresAt: expiry
                        ? new Date(`${expiry}T23:59:59`).toISOString()
                        : "",
                    },
                  },
                })
              ) {
                setText("");
                setExpiry("");
              }
            }}
          >
            <label className="block">
              A note for Mori
              <textarea
                required
                className={`${fieldClass} mt-1`}
                rows={3}
                placeholder="She is tired today. Keep things calm and familiar."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            <label className="block">
              Relevant until (optional)
              <input
                type="date"
                className={`${fieldClass} mt-1`}
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
            </label>
            <button className={buttonClass} disabled={saving}>
              Save note
            </button>
          </form>
          <p className="text-sm text-text/60">
            For a restriction Mori must enforce, use Topics to avoid in Profile
            or the memory’s safety setting.
          </p>
          {life.records
            .filter((x) => x.kind === "note")
            .map((n) => (
              <article key={n.id} className="border-b border-primary/20 py-4">
                <p>{n.data.text}</p>
                {n.data.expiresAt && (
                  <p className="text-sm text-text/60">
                    Until {n.data.expiresAt}
                  </p>
                )}
                <button
                  className="mt-2 text-primary underline"
                  onClick={() => mutate({ action: "delete", id: n.id })}
                >
                  Remove note
                </button>
              </article>
            ))}
        </section>
        <section>
          <h2 className="text-2xl">Recent conversations</h2>
          {summaries.length ? (
            summaries.map((s) => (
              <article key={s.id} className="border-b border-primary/20 py-4">
                <p className="text-sm text-text/60">{s.date}</p>
                <h3 className="text-xl">{s.topic}</h3>
                <p className="mt-2">{s.summary}</p>
              </article>
            ))
          ) : (
            <p className="mt-4 text-text/60">
              Saved summaries will appear after your first conversation.
            </p>
          )}
          <Link
            className="mt-5 inline-block text-primary underline"
            href="/room/insights"
          >
            Explore observations and session history
          </Link>
        </section>
      </div>
      <section className="mt-8">
        <h2 className="text-2xl">Guide future memories</h2>
        <p className="mt-2 text-text/60">
          Feedback changes the memory’s saved safety preference. Use the memory
          editor for temporary or sensitive settings.
        </p>
        {memories.map((m) => (
          <div
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 py-4"
          >
            <span>
              {m.title} <small className="text-text/60">· {m.safety}</small>
            </span>
            <div className="flex gap-3">
              {[
                ["helpful", "Use again"],
                ["neutral", "Neutral"],
                ["avoid", "Do not use"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className="rounded-xl border border-primary/30 px-3 py-2"
                  onClick={() => feedback(m.id, value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>
      {saved && (
        <p role="status" className="mt-4">
          {saved}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-red-700">
          {error}
        </p>
      )}
    </LifeShell>
  );
}
