"use client";
import { useState } from "react";
import LifeShell, { fieldClass, buttonClass } from "./LifeShell";
import { useLife } from "@/lib/life/use-life";
import { LifeRecord } from "@/lib/life/types";
export default function LifeRecords({
  kind,
  title,
  description,
}: {
  kind: LifeRecord["kind"];
  title: string;
  description: string;
}) {
  const { life, loading, error, saving, mutate } = useLife();
  const [editing, setEditing] = useState<LifeRecord | null>(null);
  const [data, setData] = useState<LifeRecord["data"]>({});
  const fields =
    kind === "person"
      ? ["name", "relationship", "aliases", "description"]
      : kind === "album"
        ? ["name", "description"]
        : kind === "note"
          ? ["text", "expiresAt"]
          : ["text"];
  const labels: Record<string, string> = {
    name: "Name",
    relationship: "Relationship",
    aliases: "Other names",
    description: "What makes this meaningful?",
    text: kind === "note" ? "Caregiver note" : "Story",
    expiresAt: "Use this note until (optional)",
  };
  const save = async () => {
    if (
      await mutate({
        action: "record",
        record: { id: editing?.id, kind, data },
      })
    ) {
      setEditing(null);
      setData({});
    }
  };
  return (
    <LifeShell title={title} description={description}>
      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-4 rounded-2xl bg-secondary/30 p-5 self-start"
        >
          <h2 className="text-xl">
            {editing ? "Edit" : "Add"} {kind}
          </h2>
          {fields.map((key) => (
            <label className="block" key={key}>
              {labels[key]}
              {key === "expiresAt" ? (
                <input
                  type="date"
                  className={`${fieldClass} mt-2`}
                  value={data.expiresAt ?? ""}
                  onChange={(e) =>
                    setData({ ...data, expiresAt: e.target.value })
                  }
                />
              ) : (
                <textarea
                    aria-label={labels[key]}
                  required={key === "name" || key === "text"}
                  rows={key === "text" ? 5 : 2}
                  className={`${fieldClass} mt-2`}
                  value={String(data[key as keyof typeof data] ?? "")}
                  onChange={(e) => setData({ ...data, [key]: e.target.value })}
                />
              )}
            </label>
          ))}
          <button disabled={saving} className={buttonClass}>
            Save {kind}
          </button>
          {editing && (
            <button
              type="button"
              className="ml-3 underline"
              onClick={() => {
                setEditing(null);
                setData({});
              }}
            >
              Cancel
            </button>
          )}
        </form>
        <section className="space-y-4">
          {loading ? (
            <p>Loading…</p>
          ) : (
            life.records
              .filter((r) => r.kind === kind)
              .map((r) => (
                <article className="border-b border-primary/20 pb-5" key={r.id}>
                  <h2 className="text-xl">{r.data.name ?? r.data.text}</h2>
                  {r.data.relationship && (
                    <p className="mt-1 text-primary">{r.data.relationship}</p>
                  )}
                  <p className="mt-2 text-text/70">{r.data.description}</p>
                  {r.data.aliases && <p>Also known as {r.data.aliases}</p>}
                  {r.data.expiresAt && (
                    <p className="text-sm">Until {r.data.expiresAt}</p>
                  )}
                  {kind === "story" && (
                    <p className="mt-2 text-sm">
                      {r.data.status ?? "unverified"} ·{" "}
                      {r.data.source ?? "family provided"}
                      {r.data.sessionId ? " · Discovered in a session" : ""}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-4">
                    <button
                      className="underline"
                      onClick={() => {
                        setEditing(r);
                        setData(r.data);
                      }}
                    >
                      Edit
                    </button>
                    {kind === "story" && r.data.status !== "confirmed" && (
                      <button
                        disabled={saving}
                        className="text-primary underline"
                        onClick={() =>
                          mutate({
                            action: "record",
                            record: {
                              ...r,
                              data: { ...r.data, status: "confirmed" },
                            },
                          })
                        }
                      >
                        Confirm story
                      </button>
                    )}
                    {kind === "story" && r.data.status !== "dismissed" && (
                      <button
                        disabled={saving}
                        className="underline"
                        onClick={() =>
                          mutate({
                            action: "record",
                            record: {
                              ...r,
                              data: { ...r.data, status: "dismissed" },
                            },
                          })
                        }
                      >
                        Dismiss
                      </button>
                    )}
                    <button
                      disabled={saving}
                      className="text-red-700 underline"
                      onClick={() => {
                        if (confirm(`Delete this ${kind}?`))
                          mutate({ action: "delete", id: r.id });
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
          )}
        </section>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-red-700">
          {error}
        </p>
      )}
    </LifeShell>
  );
}
