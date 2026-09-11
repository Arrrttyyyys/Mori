"use client";
import { useState } from "react";
import Link from "next/link";
import LifeShell from "@/components/LifeShell";
import { useLife } from "@/lib/life/use-life";
export default function LifeMap() {
  const { life, memories, loading, error } = useLife();
  const [person, setPerson] = useState("");
  const periods = new Map<string, typeof memories>();
  for (const memory of memories.filter(
    (m) => !person || m.context.personIds.includes(person),
  )) {
    const year = Number(memory.context.year);
    const period =
      year > 1800 && year < 2200
        ? `${Math.floor(year / 10) * 10}s`
        : "Undated memories";
    periods.set(period, [...(periods.get(period) ?? []), memory]);
  }
  return (
    <LifeShell
      title={`${life.profile.preferredName ? `${life.profile.preferredName}’s` : "Your"} Life Map`}
      description="A growing picture of the people, places, and moments that belong together. Dates can be approximate; every connection starts with family context."
    >
      {error && <p role="alert">{error}</p>}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          className={`rounded-full border px-4 py-2 ${!person ? "bg-primary text-white" : ""}`}
          onClick={() => setPerson("")}
        >
          Everyone
        </button>
        {life.records
          .filter((x) => x.kind === "person")
          .map((p) => (
            <button
              className={`rounded-full border px-4 py-2 ${person === p.id ? "bg-primary text-white" : ""}`}
              key={p.id}
              onClick={() => setPerson(p.id)}
            >
              {p.data.name} · {p.data.relationship}
            </button>
          ))}
      </div>
      {loading ? (
        <p>Loading the Life Map…</p>
      ) : (
        Array.from(periods)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([period, items]) => (
            <section
              key={period}
              className="mb-8 grid gap-4 md:grid-cols-[120px_1fr]"
            >
              <h2 className="text-xl text-primary">{period}</h2>
              <div className="border-l-2 border-primary/25 pl-6 space-y-6">
                {items
                  .sort((a, b) => a.context.year.localeCompare(b.context.year))
                  .map((m) => (
                    <article key={m.id} className="flex gap-4">
                      {m.mediaKind === "photo" && m.image && (
                        <img
                          src={m.image}
                          alt=""
                          className="h-24 w-28 rounded-xl object-cover"
                        />
                      )}
                      <div>
                        <h3 className="text-xl">{m.title}</h3>
                        <p className="text-sm text-text/60">
                          {[m.date, m.place, m.context.certainty]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <p className="mt-2 max-w-2xl">{m.memoryHint}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {life.records
                            .filter((p) => m.context.personIds.includes(p.id))
                            .map((p) => (
                              <button
                                key={p.id}
                                onClick={() => setPerson(p.id)}
                                className="text-primary underline"
                              >
                                {p.data.name}
                              </button>
                            ))}
                          {m.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-secondary/40 px-2 text-sm"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            </section>
          ))
      )}
      {!loading && !memories.length && (
        <p>
          Your Life Map grows as you{" "}
          <Link className="text-primary underline" href="/room/library">
            add memories and their context
          </Link>
          .
        </p>
      )}
    </LifeShell>
  );
}
