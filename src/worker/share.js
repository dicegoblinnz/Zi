// Sharing a copy of a character (31 Oct 2026). Whoever has a character in
// their account shares a copy of them two ways: given to someone they play
// with (their GM, a player in a campaign they run, or another player in one
// they're in), who finds it waiting on their Characters page and takes it or
// turns it down, or as a link anyone who has it can take a copy from, for a
// week. Either way the copy comes from the account's own copy of the
// character, so it's only ever theirs to share, cut down to what a copy holds
// (snapshotOf() in src/companion/share-rules.js). Whoever takes it gets a
// character of their own, and the one sharing keeps theirs.
//
//   GET  /api/shares        who you can give a copy to, the copies waiting
//                           for you, and the ones you've shared that are still
//                           waiting
//   POST /api/shares        { character, to }: a copy for someone you play
//                           with, or the one waiting for them brought up to
//                           date. Without to, the character's link, made or
//                           brought up to date (it keeps its code)
//   POST /api/shares/open   { code }: the copy, to take it. A link's for
//                           anyone, signed in or not, and a copy given to
//                           someone is only for them. Codes that don't work
//                           are counted against the address they came from,
//                           like join links' (index.js).
//   POST /api/shares/drop   { code }: the one sharing stops it, or the one it
//                           was given to has taken it or turned it down
//
// A code rides in the body, never the address, so it doesn't reach a log.
import { DAY, GIFT_DAYS, LINK_DAYS, SHARE_CODE, snapshotOf } from "../companion/share-rules.js";
import { hit, seen } from "./auth.js";

const CHAR_ID = /^[a-z0-9][a-z0-9-]{0,47}$/;
const USER_ID = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_TEXT = 200000;
const MAX_OUT = 100; // copies one person's shared that are still waiting
const MAX_IN = 30; // copies waiting for one person
const NOTHING = "There’s nothing here.";
const BAD_LINK = "That link didn’t work. They might’ve stopped sharing it, or it’s more than a week old, so ask them for a new one.";

export async function shareRoute(request, env, method, sub, session, h) {
  if (sub === "open" && method === "POST") return openShare(request, env, session, h);
  if (!session) return h.fail(401, "Sign in first.");
  const me = session.user;
  if (!sub && method === "GET") return listShares(env, me, h);
  if (method === "POST" && (await h.limited(env, `write:${me.id}`, 600, 600))) return h.fail(429, "That’s a lot of changes at once. Give it a few minutes.");
  if (!sub && method === "POST") return makeShare(request, env, me, h);
  if (sub === "drop" && method === "POST") return dropShare(request, env, me, h);
  return h.fail(404, NOTHING);
}

// Everyone you play with: the players in the campaigns you run, the GM of
// each one you play in, and the other players there. Nobody else can be given
// a copy, and players already see each other's names in a campaign.
const PEOPLE = `SELECT m.userId AS id, u.name, c.name AS camp, 'plays' AS how FROM campaign c JOIN member m ON m.campaignId = c.id JOIN "user" u ON u.id = m.userId WHERE c.gmId = ?1
  UNION ALL SELECT c.gmId, u.name, c.name, 'gm' FROM member m JOIN campaign c ON c.id = m.campaignId JOIN "user" u ON u.id = c.gmId WHERE m.userId = ?1
  UNION ALL SELECT o.userId, u.name, c.name, 'with' FROM member m JOIN member o ON o.campaignId = m.campaignId AND o.userId != m.userId JOIN campaign c ON c.id = m.campaignId JOIN "user" u ON u.id = o.userId WHERE m.userId = ?1`;
const playsWith = (env, me, them) => env.DB.prepare(`SELECT 1 AS ok WHERE EXISTS (SELECT 1 FROM campaign c JOIN member m ON m.campaignId = c.id WHERE (c.gmId = ?1 AND m.userId = ?2) OR (c.gmId = ?2 AND m.userId = ?1))
  OR EXISTS (SELECT 1 FROM member a JOIN member b ON b.campaignId = a.campaignId WHERE a.userId = ?1 AND b.userId = ?2)`).bind(me.id, them).first();

async function listShares(env, me, { json }) {
  const now = Date.now();
  const [people, given, sent] = await env.DB.batch([
    env.DB.prepare(PEOPLE).bind(me.id),
    env.DB.prepare('SELECT s.code, s.name, s.createdAt, u.name AS fromName FROM share s JOIN "user" u ON u.id = s.fromId WHERE s.toId = ?1 AND s.until > ?2 ORDER BY s.createdAt DESC LIMIT ?3').bind(me.id, now, MAX_IN),
    env.DB.prepare('SELECT s.code, s.characterId, s.name, s.toId, t.name AS toName, s.createdAt, s.until FROM share s LEFT JOIN "user" t ON t.id = s.toId WHERE s.fromId = ?1 AND s.until > ?2 ORDER BY s.createdAt DESC LIMIT ?3').bind(me.id, now, MAX_OUT),
  ]);
  const by = new Map();
  for (const r of people.results) {
    if (r.id === me.id) continue;
    if (!by.has(r.id)) by.set(r.id, { id: r.id, name: r.name, gm: [], plays: [], with: [] });
    const p = by.get(r.id);
    if (!p[r.how].includes(r.camp)) p[r.how].push(r.camp);
  }
  return json({
    people: [...by.values()].sort((a, b) => b.gm.length - a.gm.length || a.name.localeCompare(b.name, "en", { sensitivity: "base" }) || a.id.localeCompare(b.id)),
    given: given.results.map((r) => ({ code: r.code, name: r.name, from: r.fromName, at: r.createdAt })),
    sent: sent.results.map((r) => ({ code: r.code, character: r.characterId, name: r.name, to: r.toId ? { id: r.toId, name: r.toName } : null, at: r.createdAt, until: r.until })),
  });
}

// A copy given to someone, or a character's link. Sharing the same character
// with the same person, or making its link again, brings what's waiting up to
// date, so nobody ends up with two of the same copy waiting.
async function makeShare(request, env, me, { json, fail, body, limited, token }) {
  if (await limited(env, `share:${me.id}`, 60, 3600)) return fail(429, "That’s a lot of sharing at once. Give it a while.");
  const b = await body(request);
  const id = b?.character;
  const to = b?.to ?? null;
  if (typeof id !== "string" || !CHAR_ID.test(id)) return fail(400, "That isn’t a character.");
  if (to !== null && (typeof to !== "string" || !USER_ID.test(to))) return fail(400, "That isn’t anyone.");
  if (to === me.id) return fail(400, "They’re yours already.");
  if (to && !(await playsWith(env, me, to))) return fail(403, "You can only give a copy to someone you play with.");
  const row = await env.DB.prepare("SELECT data FROM character WHERE userId = ?1 AND id = ?2 AND data IS NOT NULL").bind(me.id, id).first();
  if (!row) return fail(409, "That character isn’t in your account yet.");
  let snap = null;
  try {
    snap = snapshotOf(JSON.parse(row.data));
  } catch {}
  if (!snap) return fail(400, "That character couldn’t be read, so there’s nothing to share.");
  const data = JSON.stringify(snap);
  if (data.length > MAX_TEXT) return fail(413, "That character’s too big to share.");
  const name = snap.name || "Someone";
  const now = Date.now();
  const until = now + (to ? GIFT_DAYS : LINK_DAYS) * DAY;
  const which = to ? "toId = ?3" : "toId IS NULL";
  const args = to ? [me.id, id, to] : [me.id, id];
  const update = () => env.DB.prepare(`UPDATE share SET data = ?${args.length + 1}, name = ?${args.length + 2}, createdAt = ?${args.length + 3}, until = ?${args.length + 4}
    WHERE fromId = ?1 AND characterId = ?2 AND ${which} AND until > ?${args.length + 3} RETURNING code, createdAt, until`).bind(...args, data, name, now, until).first();
  let got = await update();
  if (!got) {
    // One that's run out starts again with a new code, so an old link that
    // stopped working doesn't come back to life.
    await env.DB.prepare(`DELETE FROM share WHERE fromId = ?1 AND characterId = ?2 AND ${which} AND until <= ?${args.length + 1}`).bind(...args, now).run();
    const n = await env.DB.prepare("SELECT (SELECT COUNT(*) FROM share WHERE fromId = ?1 AND until > ?3) AS mine, (SELECT COUNT(*) FROM share WHERE toId = ?2 AND until > ?3) AS theirs").bind(me.id, to, now).first();
    if (n.mine >= MAX_OUT) return fail(400, `You’ve got ${MAX_OUT} copies shared already. Stop sharing some first.`);
    if (to && n.theirs >= MAX_IN) return fail(400, "They’ve got a lot of copies waiting for them already. Ask them to take some or turn them down first.");
    got = await env.DB.prepare("INSERT INTO share (code, fromId, toId, characterId, name, data, createdAt, until) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) ON CONFLICT DO NOTHING RETURNING code, createdAt, until")
      .bind(token(12), me.id, to, id, name, data, now, until).first();
    // Two taps at once, and the other one made it: this brings it up to date.
    got ??= await update();
  }
  if (Math.random() < 0.02) await env.DB.prepare("DELETE FROM share WHERE until < ?1").bind(now).run();
  if (!got) return fail(500, "That didn’t share them. Try again in a minute.");
  return json({ share: { code: got.code, character: id, name, to, at: got.createdAt, until: got.until } });
}

// The copy, to take. A miss is counted against the address it came from.
async function openShare(request, env, session, { json, fail, body, limited }) {
  const me = session?.user ?? null;
  const misses = `share-miss:${request.headers.get("cf-connecting-ip") || "here"}`;
  if ((await seen(env, misses, 900)) >= 20 || (me && (await limited(env, `open:${me.id}`, 120, 900)))) return fail(429, "That’s a lot of tries. Wait a few minutes and try again.");
  const code = (await body(request))?.code;
  const row = typeof code === "string" && SHARE_CODE.test(code)
    ? await env.DB.prepare('SELECT s.fromId, s.toId, s.name, s.data, s.createdAt, s.until, u.name AS fromName FROM share s JOIN "user" u ON u.id = s.fromId WHERE s.code = ?1 AND s.until > ?2 AND (s.toId IS NULL OR s.toId = ?3)')
      .bind(code, Date.now(), me?.id ?? "").first()
    : null;
  let data = null;
  try {
    data = row ? snapshotOf(JSON.parse(row.data)) : null;
  } catch {}
  if (!data) {
    await hit(env, misses, 900);
    return fail(404, BAD_LINK);
  }
  return json({ share: { name: row.name, from: row.fromName, at: row.createdAt, until: row.until, given: row.toId != null, mine: Boolean(me && row.fromId === me.id), data } });
}

async function dropShare(request, env, me, { json, fail, body }) {
  const code = (await body(request))?.code;
  if (typeof code !== "string" || !SHARE_CODE.test(code)) return fail(404, NOTHING);
  const res = await env.DB.prepare("DELETE FROM share WHERE code = ?1 AND (fromId = ?2 OR toId = ?2)").bind(code, me.id).run();
  return json({ ok: res.meta.changes > 0 });
}
