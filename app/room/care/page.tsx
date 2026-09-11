"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import LifeShell, { fieldClass, buttonClass } from "@/components/LifeShell";
import { useLife } from "@/lib/life/use-life";
import { useAuth } from "@/contexts/AuthContext";
export default function Care() {
  const { life, mutate, error, saving, userId, authorizedFetch } = useLife();
  const { selectPatient } = useAuth();
  const [workspaces, setWorkspaces] = useState<
    { id: string; name: string; role: string }[]
  >([]);
  const [when, setWhen] = useState("");
  const [mode, setMode] = useState("guided");
  const [text, setText] = useState("");
  useEffect(() => {
    authorizedFetch("/api/family")
      .then((r) => r.json())
      .then((d) => setWorkspaces(d.workspaces ?? []));
  }, [userId]);
  return (
    <LifeShell
      title="Plan a comfortable visit"
      description="Coordinate upcoming sessions across the family workspaces you support. Plans guide a visit; sessions always begin with the person’s willingness to participate."
    >
      <label className="mb-8 block max-w-md">
        Person
        <select
          className={`${fieldClass} mt-2`}
          value={userId ?? ""}
          onChange={(e) => selectPatient(e.target.value)}
        >
          {workspaces.map((w) => (
            <option value={w.id} key={w.id}>
              {w.name} · {w.role}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-8 md:grid-cols-2">
        <form
          className="space-y-4 rounded-2xl bg-secondary/30 p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await mutate({
                action: "record",
                record: {
                  kind: "plan",
                  data: {
                    text: text || "A familiar moment together",
                    scheduledFor: new Date(when).toISOString(),
                    sessionMode: mode,
                    completed: false,
                  },
                },
              })
            ) {
              setText("");
              setWhen("");
            }
          }}
        >
          <h2 className="text-2xl">Plan a session</h2>
          <label className="block">
            Date and time
            <input
              required
              type="datetime-local"
              className={`${fieldClass} mt-2`}
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </label>
          <label className="block">
            Starting theme
            <select
              className={`${fieldClass} mt-2`}
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              {[
                "guided",
                "calming",
                "family",
                "childhood",
                "career",
                "music",
                "places",
                "celebrations",
              ].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="block">
            Visit note
            <textarea
              className={`${fieldClass} mt-2`}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <button disabled={saving} className={buttonClass}>
            Save plan
          </button>
          <p className="text-sm text-text/60">
            Plans appear here for caregivers. Mori does not send reminders or
            start sessions automatically.
          </p>
        </form>
        <section>
          <h2 className="text-2xl">Upcoming and past plans</h2>
          {life.records
            .filter((r) => r.kind === "plan")
            .sort((a, b) =>
              (a.data.scheduledFor ?? "").localeCompare(
                b.data.scheduledFor ?? "",
              ),
            )
            .map((p) => (
              <article key={p.id} className="border-b border-primary/20 py-5">
                <h3 className="text-xl">
                  {new Date(p.data.scheduledFor!).toLocaleString()}
                </h3>
                <p className="mt-2">{p.data.text}</p>
                <p className="text-text/60">
                  {p.data.sessionMode} ·{" "}
                  {p.data.completed ? "Completed" : "Planned"}
                </p>
                <div className="mt-3 flex flex-wrap gap-4">
                  {!p.data.completed && (
                    <>
                      <Link
                        className="text-primary underline"
                        href={`/room/sessions?mode=${p.data.sessionMode}`}
                      >
                        Prepare session
                      </Link>
                      <button
                        className="underline"
                        disabled={saving}
                        onClick={() =>
                          mutate({
                            action: "record",
                            record: {
                              ...p,
                              data: { ...p.data, completed: true },
                            },
                          })
                        }
                      >
                        Mark completed
                      </button>
                    </>
                  )}
                  <button
                    className="text-red-700 underline"
                    disabled={saving}
                    onClick={() => mutate({ action: "delete", id: p.id })}
                  >
                    Remove plan
                  </button>
                </div>
              </article>
            ))}
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
