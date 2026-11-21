import { getStore } from "@netlify/blobs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default async (req) => {
  const code = (new URL(req.url).searchParams.get("code") || "").toLowerCase();
  if (!/^[a-z0-9]{7}$/.test(code)) return json({ error: "bad code" }, 400);
  const store = getStore("notes");

  if (req.method === "GET") {
    const note = await store.get(code, { type: "json" });
    return json(note || { text: "", rev: 0 });
  }

  if (req.method === "PUT") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
    if (typeof body.text !== "string" || body.text.length > 500000) {
      return json({ error: "bad text" }, 400);
    }
    const rev = Date.now();
    await store.setJSON(code, { text: body.text, rev });
    return json({ ok: true, rev });
  }

  return json({ error: "method not allowed" }, 405);
};
