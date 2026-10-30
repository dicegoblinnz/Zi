// Sharing a copy of a character (31 Oct 2026): what a copy holds, the same
// for the Worker, which keeps it (src/worker/share.js), and the phone, which
// takes it (share.js). A copy is the character as they were when they were
// shared: their sheet and where they're at (the trackers, conditions, Scars,
// threads, what's crossed out, what they've grown in downtime, their notes and
// what each line of their sheet said, for the gold marks). It leaves behind
// the moment and the campaign (the last roll, the live table's answers) and
// everything that's the account's (the character's id, whose it is, when it
// was made and saved), so whoever takes it gets a new character of their own.
//
// The Worker cuts it down to plain data on the way in, and the phone reads
// the rest the way it reads any character (adopt() in app.js), so nothing in
// a copy can be anything but text and numbers on the phone that takes it.

export const SHARE_CODE = /^[A-Za-z0-9_-]{16,64}$/;
// How long a link works, from when it was made or last brought up to date,
// and how long a copy given to someone waits for them.
export const LINK_DAYS = 7;
export const GIFT_DAYS = 30;
export const DAY = 86400000;

// The parts of a character a copy carries.
const KEEP = ["crew", "name", "build", "from", "hash", "state"];
// What's in a character's state that's the moment or the campaign.
const MOMENT = ["last", "tele"];
// Keys that could reach an object's prototype on the phone that reads it.
const BAD = new Set(["__proto__", "constructor", "prototype"]);

// Plain data only: text, numbers, true and false, in lists and objects that
// don't go too deep or grow too long. Notes are the longest thing on a sheet.
export function plainOf(v, depth = 0) {
  if (typeof v === "string") return v.slice(0, 20000);
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "boolean" || v === null) return v;
  if (depth >= 10) return null;
  if (Array.isArray(v)) return v.slice(0, 300).map((x) => plainOf(x, depth + 1));
  if (typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v).slice(0, 600)) if (!BAD.has(k) && k.length <= 400) out[k] = plainOf(v[k], depth + 1);
    return out;
  }
  return null;
}

const isObject = (v) => Boolean(v) && typeof v === "object" && !Array.isArray(v);

// A copy of a character, from what an account holds of them, or null if it
// isn't one.
export function snapshotOf(data) {
  if (!isObject(data) || typeof data.crew !== "string" || !/^[a-z0-9-]{1,40}$/.test(data.crew)) return null;
  const out = {};
  for (const k of KEEP) if (data[k] !== undefined) out[k] = plainOf(data[k]);
  out.name = typeof out.name === "string" ? out.name.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40) : "";
  if (!isObject(out.state)) out.state = {};
  for (const k of MOMENT) delete out.state[k];
  if (out.build !== undefined && !isObject(out.build)) delete out.build;
  if (out.crew === "own" && !out.build) return null;
  if (out.from !== undefined && (typeof out.from !== "string" || !/^[a-z0-9-]{1,40}$/.test(out.from))) delete out.from;
  out.hash = typeof out.hash === "string" ? out.hash.slice(0, 80) : "";
  return out;
}
