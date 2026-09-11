const assert = require("node:assert/strict");
const base = process.env.MORI_TEST_URL || "http://127.0.0.1:3010";
const headers = {
  "X-Mori-Demo-Mode": "true",
  "Content-Type": "application/json",
};
async function api(path, method = "GET", body) {
  const r = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json();
  assert.equal(r.ok, true, `${method} ${path}: ${JSON.stringify(d)}`);
  return d;
}
(async () => {
  const unauthorized = await fetch(base + "/api/life");
  assert.equal(unauthorized.status, 401);
  const cross = await fetch(base + "/api/user/other-person/memories", {
    headers,
  });
  assert.equal(cross.status, 403);
  await api("/api/life", "POST", {
    action: "profile",
    profile: {
      preferredName: "Test Margaret",
      language: "en-US",
      sessionMinutes: 15,
    },
  });
  const life = await api("/api/life", "POST", {
    action: "record",
    record: {
      kind: "person",
      data: { name: "Test John", relationship: "Husband" },
    },
  });
  const person = life.records.find((r) => r.data.name === "Test John");
  const albumLife = await api("/api/life", "POST", {
    action: "record",
    record: { kind: "album", data: { name: "Test Garden" } },
  });
  const album = albumLife.records.find((r) => r.data.name === "Test Garden");
  const created = await api("/api/user/demo_patient/memories", "POST", {
    title: "Test rose garden",
    date: "1987",
    memoryHint: "The family grew roses together.",
    mediaKind: "story",
    safety: "preferred",
    context: {
      personIds: [person.id],
      albumIds: [album.id],
      tags: ["garden", "roses"],
      certainty: "confirmed",
      year: "1987",
    },
  });
  const id = created.memory.id;
  assert.equal(created.memory.people[0], "Test John — Husband");
  await api("/api/life", "POST", {
    action: "record",
    record: { ...person, data: { ...person.data, name: "Test John updated" } },
  });
  const corrected = await api("/api/user/demo_patient/memories");
  assert.equal(
    corrected.memories.find((m) => m.id === id).people[0],
    "Test John updated — Husband",
    "person edits must update linked memory context",
  );
  const persisted = await api("/api/user/demo_patient/memories");
  assert(
    persisted.memories.some((m) => m.id === id),
    "new memory must be visible from a separate request",
  );
  const invalid = await fetch(base + "/api/user/demo_patient/memories/" + id, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ safety: "temporary", avoidUntil: "" }),
  });
  assert.equal(invalid.status, 400);
  // Isolate selection to our fixture.
  for (const m of persisted.memories.filter((m) => m.id !== id))
    await api("/api/user/demo_patient/memories/" + m.id, "PATCH", {
      safety: "avoid",
    });
  const session = (await api("/api/therapy/session?user_id=demo_patient"))
    .session;
  const turn = await api("/api/therapy/session", "POST", {
    session_id: session.session_id,
    user_message: "Let us look at a garden memory together.",
  });
  assert.equal(
    turn.selected_memory.id,
    id,
    "approved uploaded story must enter session selection",
  );
  await api("/api/therapy/session", "POST", {
    session_id: session.session_id,
    user_message:
      "I don't remember this garden, but I used to plant flowers with my family every spring.",
  });
  const insight = await api("/api/insights");
  assert(
    insight.memories.some((m) => m.id === id && m.observations > 0),
    "turn observations reach insights",
  );
  const stories = (await api("/api/life")).records.filter(
    (r) => r.kind === "story" && r.data.source?.startsWith("patient stated"),
  );
  assert(stories.length > 0, "session statements create unverified candidates");
  assert(stories.every((s) => s.data.status === "unverified"));
  const last = stories.at(-1);
  await api("/api/life", "POST", {
    action: "record",
    record: { ...last, data: { ...last.data, status: "confirmed" } },
  });
  await api("/api/user/demo_patient/family-space", "POST", {
    memoryId: id,
    assessment: "avoid",
  });
  const rejected = await api("/api/therapy/session", "POST", {
    session_id: session.session_id,
    user_message: "Can we continue with that memory?",
  });
  assert.equal(
    rejected.selected_memory,
    null,
    "new Avoid must block continuing memory",
  );
  assert.equal(rejected.response.show_photo, false);
  assert(
    !rejected.adaptive.context.memoryIds.includes(id),
    "blocked memory excluded from retrieval context",
  );
  await api("/api/therapy/session?session_id=" + session.session_id, "DELETE");
  const history = await api("/api/user/demo_patient/family-space");
  assert(
    history.family_space.session_summaries.some((s) =>
      s.summary.includes("conversation"),
    ),
    "session summary available",
  );
  // Delete fixtures and restore the fictional demonstration, keeping tests repeatable.
  await api("/api/user/demo_patient/memories/" + id, "DELETE");
  for (const m of persisted.memories.filter((m) => m.id !== id))
    await api("/api/user/demo_patient/memories/" + m.id, "PATCH", {
      safety: m.safety,
    });
  for (const record of [person, album, ...stories])
    await api("/api/life", "POST", { action: "delete", id: record.id });
  console.log(
    "Connected-life workflow passed: auth isolation, context/relationships, approval, session retrieval, observations, story confirmation, hard Avoid, summaries.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
