"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { defaultProfile, LifeData, LifeMemory } from "./types";
export function useLife() {
  const { authorizedFetch, userId } = useAuth();
  const [life, setLife] = useState<LifeData>({
    profile: { ...defaultProfile },
    records: [],
  });
  const [memories, setMemories] = useState<LifeMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const reload = useCallback(async () => {
    if (!userId) return;
    setError("");
    try {
      const responses = await Promise.all([
        authorizedFetch("/api/life"),
        authorizedFetch(`/api/user/${userId}/memories`),
      ]);
      const values = await Promise.all(responses.map((x) => x.json()));
      if (responses.some((x) => !x.ok))
        throw new Error(values.find((x) => x.error)?.error ?? "Could not load");
      setLife(values[0]);
      setMemories(values[1].memories);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);
  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);
  const mutate = async (body: unknown) => {
    setSaving(true);
    setError("");
    try {
      const res = await authorizedFetch("/api/life", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLife(data);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  };
  return {
    life,
    memories,
    loading,
    error,
    saving,
    mutate,
    reload,
    setError,
    userId,
    authorizedFetch,
  };
}
