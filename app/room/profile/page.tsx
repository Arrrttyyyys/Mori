"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import LifeShell, { fieldClass, buttonClass } from "@/components/LifeShell";
import { useLife } from "@/lib/life/use-life";
import { defaultProfile, LifeProfile } from "@/lib/life/types";
export default function ProfilePage() {
  const { life, memories, loading, error, saving, mutate } = useLife();
  const [form, setForm] = useState({ ...defaultProfile });
  const [saved, setSaved] = useState(false);
  useEffect(() => setForm(life.profile), [life.profile]);
  const fields: [keyof LifeProfile, string][] = [
    ["preferredName", "Preferred name"],
    ["birthYear", "Birth year (approximate is fine)"],
    ["languages", "Other languages spoken"],
    ["career", "Work and career"],
    ["places", "Important places"],
    ["interests", "Interests and hobbies"],
    ["music", "Favorite music"],
    ["communication", "What helps conversation feel comfortable?"],
    ["comfortingTopics", "Comforting topics (separate with commas)"],
    ["avoidTopics", "Topics to avoid (separate with commas)"],
  ];
  return (
    <LifeShell
      title="A life worth knowing"
      description="Start with what you know. You can leave details blank and add more together over time."
    >
      <div className="mb-8 rounded-2xl bg-secondary/40 p-5">
        <h2 className="text-xl">Your first session</h2>
        <p className="mt-2">
          {life.profile.preferredName
            ? "Profile started"
            : "Add a preferred name"}{" "}
          · {life.records.filter((x) => x.kind === "person").length} important
          people · {memories.length} memories
        </p>
        <p className="mt-2 text-text/70">
          A few familiar photos are enough to begin. Aim for 10–20 meaningful
          memories as your collection grows.
        </p>
        <Link
          href="/room/library"
          className="mt-3 inline-block text-primary underline"
        >
          Add memories
        </Link>
      </div>
      {loading ? (
        <p>Loading profile…</p>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaved(await mutate({ action: "profile", profile: form }));
          }}
          className="grid gap-5 md:grid-cols-2"
        >
          {fields.map(([key, label]) => (
            <label key={key} className="block">
              {label}
              <textarea
                aria-label={label}
                rows={key === "preferredName" || key === "birthYear" ? 1 : 2}
                className={`${fieldClass} mt-2`}
                value={String(form[key])}
                onChange={(e) => {
                  setSaved(false);
                  setForm({ ...form, [key]: e.target.value });
                }}
              />
            </label>
          ))}
          <label>
            Session language
            <select
              className={`${fieldClass} mt-2`}
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
            >
              {[
                ["en-US", "English"],
                ["es-ES", "Español"],
                ["hi-IN", "हिन्दी"],
                ["ar-OM", "العربية"],
                ["fr-FR", "Français"],
                ["pt-BR", "Português"],
                ["zh-CN", "中文"],
              ].map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Preferred session length (minutes)
            <input
              className={`${fieldClass} mt-2`}
              type="number"
              min="3"
              max="20"
              value={form.sessionMinutes}
              onChange={(e) =>
                setForm({ ...form, sessionMinutes: Number(e.target.value) })
              }
            />
          </label>
          <fieldset className="md:col-span-2 space-y-3 rounded-xl border border-primary/20 p-4">
            <legend>Permission and privacy</legend>
            {(
              [
                [
                  "sessionConsent",
                  "I have permission to use this person’s memories and information with Mori.",
                ],
                [
                  "photosAllowed",
                  "Approved photos and videos may be shown during sessions.",
                ],
                [
                  "audioAllowed",
                  "Voice input and familiar audio may be used. Browser speech services may process voice.",
                ],
                [
                  "transcriptAllowed",
                  "Session transcripts may be saved for family review and personalization.",
                ],
              ] as const
            ).map(([key, label]) => (
              <label className="flex gap-3" key={key}>
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) =>
                    setForm({ ...form, [key]: e.target.checked })
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
          <div className="md:col-span-2">
            <button disabled={saving} className={buttonClass}>
              Save profile
            </button>
            {saved && (
              <span role="status" className="ml-4">
                Profile saved
              </span>
            )}
          </div>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-4 text-red-700">
          {error}
        </p>
      )}
    </LifeShell>
  );
}
