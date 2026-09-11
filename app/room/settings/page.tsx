"use client";
import { useState, useEffect } from "react";
import LifeShell, { buttonClass, fieldClass } from "@/components/LifeShell";
import { useAuth } from "@/contexts/AuthContext";
export default function Settings() {
  const { authorizedFetch, userId, selectPatient } = useAuth();
  const [family, setFamily] = useState<any>({ workspaces: [], members: [] });
  const [role, setRole] = useState("contributor");
  const [invite, setInvite] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const load = async () => {
    try {
      const r = await authorizedFetch("/api/family");
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setFamily(d);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    load();
  }, [userId]);
  const action = async (body: unknown) => {
    setBusy(true);
    setError("");
    try {
      const r = await authorizedFetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      if (d.code) setInvite(d.code);
      if (d.ownerId) {
        selectPatient(d.ownerId);
        setCode("");
      }
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const [requestType, setRequestType] = useState("delete");
  const submitRequest = async () => {
    setBusy(true);
    setError("");
    try {
      const owner = family.workspaces.find((w: any) => w.role === "owner");
      const r = await authorizedFetch(
        `/api/user/${owner?.id ?? userId}/data-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestType }),
        },
      );
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setNotice(
        `Your ${requestType} request has been recorded for review. Request ${d.request.id}.`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const exportData = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await authorizedFetch("/api/archive");
      if (!r.ok) {
        const d = await r.json();
        throw Error(d.error);
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mori-life-archive.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(
        "Archive downloaded. Media links are temporary; original media remains in private storage.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <LifeShell
      title="Family access and settings"
      description="Choose the life you’re helping with, invite trusted people, and keep a copy of your family archive."
    >
      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="text-2xl">Your workspaces</h2>
          <p className="my-3 text-text/70">
            Each person’s memories, notes, and sessions stay in their own
            workspace.
          </p>
          <select
            aria-label="Active family workspace"
            className={fieldClass}
            value={userId ?? ""}
            onChange={(e) => selectPatient(e.target.value)}
          >
            {family.workspaces.map((w: any) => (
              <option key={w.id} value={w.id}>
                {w.name} · {w.role}
              </option>
            ))}
          </select>
          <h2 className="mt-8 text-2xl">Join a family</h2>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              action({ action: "accept", code });
            }}
          >
            <label>
              Invitation code
              <input
                className={`${fieldClass} mt-2`}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            <button disabled={busy} className={buttonClass}>
              Join workspace
            </button>
          </form>
        </section>
        <section>
          <h2 className="text-2xl">Invite to your own workspace</h2>
          <p className="my-3 text-text/70">
            Viewers can read. Contributors can add memories for review, notes,
            and stories. Caregivers can edit the profile, approve memories, and
            run sessions.
          </p>
          <select
            className={fieldClass}
            aria-label="Invitation role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {["viewer", "contributor", "caregiver"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <button
            disabled={busy}
            className={`${buttonClass} mt-3`}
            onClick={() => action({ action: "invite", role })}
          >
            Create invitation code
          </button>
          {invite && (
            <div className="mt-4 rounded-xl border p-4">
              <p>
                Share this single-use code with your family member. It expires
                in 7 days.
              </p>
              <code className="my-3 block break-all select-all">{invite}</code>
              <button
                className="underline"
                onClick={() =>
                  navigator.clipboard
                    .writeText(invite)
                    .then(() => setNotice("Invitation copied."))
                    .catch(() => setError("Please select and copy the code."))
                }
              >
                Copy code
              </button>
            </div>
          )}
          {family.members.map((m: any) => (
            <div
              className="mt-4 flex flex-wrap justify-between gap-3 border-b py-3"
              key={m.id}
            >
              <span className="break-all text-sm">
                {m.id} · {m.role}
              </span>
              <button
                disabled={busy}
                className="text-red-700 underline"
                onClick={() => {
                  if (confirm("Remove this person’s workspace access?"))
                    action({ action: "revoke", memberId: m.id });
                }}
              >
                Remove access
              </button>
            </div>
          ))}
        </section>
      </div>
      <section className="mt-10 border-t border-primary/20 pt-6">
        <h2 className="text-2xl">Your life archive</h2>
        <p className="my-3 text-text/70">
          Download profile information, people, albums, stories, memory context,
          and session records from your own account.
        </p>
        <button disabled={busy} className={buttonClass} onClick={exportData}>
          Download archive
        </button>
        <p className="mt-4 text-text/70">
          For full data deletion or restrictions, submit a request below.
          Individual memories and life records can be deleted where you manage
          them.
        </p>
      </section>
      <section className="mt-8 border-t border-primary/20 pt-6">
        <h2 className="text-2xl">Data requests for your account</h2>
        <p className="my-3 text-text/70">
          Requests are recorded for review. Submitting a deletion request does
          not immediately erase your archive.
        </p>
        <div className="flex flex-wrap gap-3">
          <select
            aria-label="Data request type"
            className={`${fieldClass} max-w-xs`}
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
          >
            <option value="delete">Request full deletion</option>
            <option value="restrict">Request restricted processing</option>
            <option value="correct">Request correction</option>
          </select>
          <button
            disabled={busy}
            className={buttonClass}
            onClick={submitRequest}
          >
            Submit request
          </button>
        </div>
      </section>
      {notice && (
        <p role="status" className="mt-4">
          {notice}
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
