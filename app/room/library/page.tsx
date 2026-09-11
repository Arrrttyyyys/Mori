"use client";
import { useState, useRef } from "react";
import LifeShell, { fieldClass, buttonClass } from "@/components/LifeShell";
import { useLife } from "@/lib/life/use-life";
import { emptyContext, LifeMemory, MemoryContext } from "@/lib/life/types";
import {
  uploadMemoryPhoto,
  deleteMemoryPhotoByPath,
} from "@/lib/supabase/storage";
const blank = () => ({
  title: "",
  date: "",
  place: "",
  memoryHint: "",
  context: { ...emptyContext },
  safety: "review" as LifeMemory["safety"],
  avoidUntil: "",
  mediaKind: "story" as LifeMemory["mediaKind"],
});
export default function Library() {
  const {
    life,
    memories,
    loading,
    error,
    setError,
    reload,
    userId,
    authorizedFetch,
  } = useLife();
  const [form, setForm] = useState<ReturnType<typeof blank>>(blank());
  const [editing, setEditing] = useState<LifeMemory | null>(null);
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const setContext = (patch: Partial<MemoryContext>) =>
    setForm({ ...form, context: { ...form.context, ...patch } });
  const toggle = (field: "personIds" | "albumIds", id: string) =>
    setContext({
      [field]: form.context[field].includes(id)
        ? form.context[field].filter((x) => x !== id)
        : [...form.context[field], id],
    });
  const save = async () => {
    if (!userId) return;
    setBusy(true);
    setError("");
    try {
      if (editing) {
        const res = await authorizedFetch(
          `/api/user/${userId}/memories/${editing.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...form,
              avoidUntil: form.avoidUntil
                ? new Date(form.avoidUntil).toISOString()
                : null,
            }),
          },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } else {
        const sources = files.length ? files : [null];
        for (const file of sources) {
          let uploaded: { url: string; path: string } | null = null;
          let image = "";
          if (file) {
            if (userId === "demo_patient") {
              image = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
            } else {
              uploaded = await uploadMemoryPhoto(userId, file);
              if (!uploaded)
                throw new Error("Upload failed. Please try again.");
              image = uploaded.url;
            }
          }
          const mediaKind = file
            ? file.type.startsWith("audio/")
              ? "audio"
              : file.type.startsWith("video/")
                ? "video"
                : "photo"
            : "story";
          const res = await authorizedFetch(`/api/user/${userId}/memories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...form,
              avoidUntil: form.avoidUntil
                ? new Date(form.avoidUntil).toISOString()
                : null,
              title:
                files.length > 1
                  ? file!.name.replace(/\.[^.]+$/, "")
                  : form.title || file?.name.replace(/\.[^.]+$/, ""),
              image,
              storage_path: uploaded?.path,
              mediaKind,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            if (uploaded) await deleteMemoryPhotoByPath(uploaded.path);
            throw new Error(data.error);
          }
        }
      }
      setOpen(false);
      setFiles([]);
      setEditing(null);
      setForm(blank());
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const suggest = async () => {
    if (!editing) return;
    setBusy(true);
    setError("");
    try {
      const r = await authorizedFetch("/api/memory-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memoryId: editing.id }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setForm((f) => ({
        ...f,
        memoryHint: d.suggestion.description || f.memoryHint,
        context: {
          ...f.context,
          tags: d.suggestion.tags,
          personIds: Array.from(
            new Set([...f.context.personIds, ...d.suggestion.personIds]),
          ),
          certainty: "unverified",
          source: d.suggestion.source,
        },
      }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (memory: LifeMemory) => {
    if (!confirm("Delete this memory and its media?")) return;
    setBusy(true);
    try {
      const res = await authorizedFetch(
        `/api/user/${userId}/memories/${memory.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Could not delete memory");
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <LifeShell
      title="Every memory has a story"
      description="Add photographs, familiar voices, videos, and stories. Tell Mori why they matter and when they are comfortable to use."
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          className={buttonClass}
          onClick={() => {
            setEditing(null);
            setForm(blank());
            setFiles([]);
            setOpen(true);
            fileRef.current?.click();
          }}
        >
          Add photos, audio or video
        </button>
        <button
          className="rounded-xl border border-primary/30 px-5 py-3"
          onClick={() => {
            setEditing(null);
            setForm(blank());
            setFiles([]);
            setOpen(true);
          }}
        >
          Write a memory
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,audio/mpeg,audio/wav,audio/mp4,video/mp4,video/webm"
          className="hidden"
          onChange={(e) => {
            const chosen = Array.from(e.target.files ?? []);
            if (chosen.some((f) => f.size > 50 * 1024 * 1024)) {
              setError("Please choose files smaller than 50 MB.");
              return;
            }
            setFiles(chosen);
            if (chosen.length === 1)
              setForm((f) => ({
                ...f,
                title: chosen[0].name.replace(/\.[^.]+$/, ""),
              }));
            e.target.value = "";
          }}
        />
      </div>
      <details className="mb-6 text-text/70">
        <summary className="cursor-pointer">
          Bringing paper photographs into Mori
        </summary>
        <p className="mt-2">
          Photograph each print in even light or scan it. Include the whole
          image, avoid glare, and keep the original. Add an approximate year and
          a few words about who is there. You can upload several files together,
          then refine each memory.
        </p>
      </details>
      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="mb-8 rounded-2xl border border-primary/20 bg-secondary/20 p-5"
        >
          <h2 className="mb-4 text-2xl">
            {editing
              ? "Edit memory"
              : files.length
                ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
                : "Write a memory"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              Title
              <input
                required={files.length === 0}
                className={`${fieldClass} mt-1`}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              Date or life period
              <input
                placeholder="Summer 1987, or childhood"
                className={`${fieldClass} mt-1`}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>
            <label>
              Year (optional)
              <input
                className={`${fieldClass} mt-1`}
                value={form.context.year}
                onChange={(e) => setContext({ year: e.target.value })}
              />
            </label>
            <label>
              Place
              <input
                className={`${fieldClass} mt-1`}
                value={form.place}
                onChange={(e) => setForm({ ...form, place: e.target.value })}
              />
            </label>
            <label className="md:col-span-2">
              What happened? Why does it matter?
              <textarea
                rows={4}
                className={`${fieldClass} mt-1`}
                value={form.memoryHint}
                onChange={(e) =>
                  setForm({ ...form, memoryHint: e.target.value })
                }
              />
            </label>
            <label>
              Topics (comma separated)
              <input
                className={`${fieldClass} mt-1`}
                value={form.context.tags.join(", ")}
                onChange={(e) =>
                  setContext({
                    tags: e.target.value.split(",").map((x) => x.trim()),
                  })
                }
              />
            </label>
            <label>
              How certain is this context?
              <select
                className={`${fieldClass} mt-1`}
                value={form.context.certainty}
                onChange={(e) =>
                  setContext({
                    certainty: e.target.value as MemoryContext["certainty"],
                  })
                }
              >
                <option value="unverified">Not yet verified</option>
                <option value="approximate">Approximate</option>
                <option value="confirmed">Family confirmed</option>
              </select>
            </label>
            <label>
              Source
              <input
                className={`${fieldClass} mt-1`}
                value={form.context.source}
                onChange={(e) => setContext({ source: e.target.value })}
              />
            </label>
            <label>
              Use in sessions
              <select
                className={`${fieldClass} mt-1`}
                value={form.safety}
                onChange={(e) =>
                  setForm({
                    ...form,
                    safety: e.target.value as LifeMemory["safety"],
                  })
                }
              >
                {[
                  ["review", "Needs review"],
                  ["preferred", "Preferred"],
                  ["safe", "Safe to use"],
                  ["neutral", "Neutral / approved"],
                  ["sensitive", "Sensitive — withhold"],
                  ["avoid", "Do not use"],
                  ["temporary", "Temporarily avoid"],
                ].map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {form.safety === "temporary" && (
              <label>
                Avoid until
                <input
                  required
                  type="datetime-local"
                  className={`${fieldClass} mt-1`}
                  value={form.avoidUntil?.slice(0, 16)}
                  onChange={(e) =>
                    setForm({ ...form, avoidUntil: e.target.value })
                  }
                />
              </label>
            )}
            {(["person", "album"] as const).map((kind) => (
              <fieldset key={kind}>
                <legend>
                  {kind === "person" ? "People in this memory" : "Albums"}
                </legend>
                <div className="mt-2 flex flex-wrap gap-3">
                  {life.records
                    .filter((x) => x.kind === kind)
                    .map((r) => (
                      <label
                        key={r.id}
                        className="rounded-xl border border-primary/20 p-2"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={form.context[
                            kind === "person" ? "personIds" : "albumIds"
                          ].includes(r.id)}
                          onChange={() =>
                            toggle(
                              kind === "person" ? "personIds" : "albumIds",
                              r.id,
                            )
                          }
                        />
                        {r.data.name}
                      </label>
                    ))}
                </div>
              </fieldset>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {editing && (
              <button
                type="button"
                disabled={busy}
                className="rounded-xl border border-primary/30 px-4 py-3"
                onClick={suggest}
              >
                Suggest context from family text
              </button>
            )}
            <button disabled={busy} className={buttonClass}>
              {busy ? "Saving…" : "Save memory"}
            </button>
            <button
              type="button"
              className="px-4"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {error && (
        <p role="alert" className="my-4 text-red-700">
          {error}
        </p>
      )}
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          aria-label="Search memories"
          placeholder="Search memories, places or topics"
          className={`${fieldClass} md:max-w-md`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Filter album"
          className={`${fieldClass} md:max-w-xs`}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All albums</option>
          {life.records
            .filter((x) => x.kind === "album")
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.data.name}
              </option>
            ))}
        </select>
      </div>
      {loading ? (
        <p>Loading memories…</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {memories
            .filter(
              (m) =>
                (!filter || m.context.albumIds.includes(filter)) &&
                [m.title, m.place, m.memoryHint, ...m.tags]
                  .join(" ")
                  .toLowerCase()
                  .includes(search.toLowerCase()),
            )
            .map((m) => (
              <article
                className="overflow-hidden rounded-2xl border border-primary/20 bg-white"
                key={m.id}
              >
                {m.mediaKind === "photo" && m.image && (
                  <img
                    src={m.image}
                    alt={m.title}
                    className="aspect-[4/3] w-full object-cover"
                  />
                )}
                {m.mediaKind === "audio" && (
                  <audio controls src={m.image} className="w-full" />
                )}
                {m.mediaKind === "video" && (
                  <video
                    controls
                    src={m.image}
                    className="aspect-video w-full"
                  />
                )}
                <div className="p-5">
                  <p className="text-sm uppercase tracking-wide text-primary">
                    {m.safety} · {m.context.certainty}
                  </p>
                  <h2 className="mt-2 text-xl">{m.title}</h2>
                  <p className="text-sm text-text/60">
                    {[m.date, m.place].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-3 line-clamp-3 text-text/80">
                    {m.memoryHint}
                  </p>
                  <div className="mt-4 flex gap-4">
                    <button
                      className="text-primary underline"
                      onClick={() => {
                        setEditing(m);
                        setForm({
                          title: m.title,
                          date: m.date,
                          place: m.place ?? "",
                          memoryHint: m.memoryHint ?? "",
                          context: m.context,
                          safety: m.safety,
                          avoidUntil: m.avoidUntil
                            ? new Date(
                                Date.parse(m.avoidUntil) -
                                  new Date(m.avoidUntil).getTimezoneOffset() *
                                    60000,
                              )
                                .toISOString()
                                .slice(0, 16)
                            : "",
                          mediaKind: m.mediaKind,
                        });
                        setFiles([]);
                        setOpen(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Edit context
                    </button>
                    <button
                      disabled={busy}
                      className="text-red-700 underline"
                      onClick={() => remove(m)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
        </div>
      )}
      {!loading && !memories.length && (
        <p className="py-8 text-text/70">
          Start with a favorite photograph or a small story.
        </p>
      )}
    </LifeShell>
  );
}
