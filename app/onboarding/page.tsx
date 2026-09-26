"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ACCOUNT_RELATIONSHIPS, type AccountRelationship } from "@/lib/auth/account-role";
import { useAuth } from "@/contexts/AuthContext";

export default function OnboardingPage() {
  const { isAuthenticated, loading, chooseRelationship } = useAuth();
  const router = useRouter();
  const [choice, setChoice] = useState<AccountRelationship | "">("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/auth");
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) return null;
  return (
    <main className="min-h-dvh bg-background px-6 py-12 md:py-20">
      <section className="mx-auto max-w-3xl">
        <p className="text-center font-serif text-4xl text-primary">Mori</p>
        <h1 className="mt-8 text-center text-4xl font-semibold text-text md:text-5xl">
          What brings you to Mori?
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-relaxed text-text/70">
          This helps Mori explain the next steps. It does not grant access to another person’s information or professional controls.
        </p>
        <div className="mt-10 grid gap-4">
          {ACCOUNT_RELATIONSHIPS.map((option) => (
            <label key={option.value} className={`cursor-pointer rounded-2xl border-2 bg-white p-6 shadow-sm transition ${choice === option.value ? "border-primary ring-4 ring-primary/10" : "border-secondary"}`}>
              <span className="flex items-start gap-4">
                <input type="radio" name="relationship" value={option.value} checked={choice === option.value} onChange={() => setChoice(option.value)} className="mt-1 h-5 w-5 accent-primary" />
                <span>
                  <span className="block text-xl font-semibold text-text">{option.title}</span>
                  <span className="mt-1 block text-text/65">{option.description}</span>
                </span>
              </span>
            </label>
          ))}
        </div>
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
        <button type="button" disabled={!choice || saving} onClick={async () => { if (!choice) return; setSaving(true); setError(""); const result = await chooseRelationship(choice); if (!result.ok) setError(result.error || "Could not save your choice."); setSaving(false); }} className="mt-7 min-h-14 w-full rounded-2xl bg-primary px-6 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Saving…" : "Continue to profile setup"}
        </button>
      </section>
    </main>
  );
}
