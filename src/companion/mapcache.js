// The maps' pictures kept on the phone (mapsui.js), in the cache zi-maps, by
// the address each came from: /api/campaigns/<campaign>/maps/<map>?k=<key>.
// It's its own small file so the pages that only need to clear it (signing
// out, sync.js) don't load the whole map screen. The service worker leaves
// this cache alone (scripts/sw.js).
export const CACHE = "zi-maps";

const prefix = (id) => new URL(`/api/campaigns/${encodeURIComponent(id)}/maps/`, location.origin).href;

// Signing out: every map's picture comes off the phone.
export function forgetMaps() {
  try {
    caches.delete(CACHE).catch(() => {});
  } catch {}
}

// The campaigns this phone keeps: pictures from any other campaign (one
// that's ended, or one they're not in any more) come off it.
export async function keepMapsOf(ids) {
  try {
    const c = await caches.open(CACHE);
    const keep = ids.map(prefix);
    for (const req of await c.keys()) if (!keep.some((p) => req.url.startsWith(p))) await c.delete(req);
  } catch {}
}

// One campaign's pictures off the phone.
export async function forgetMapsOf(id) {
  try {
    const c = await caches.open(CACHE);
    for (const req of await c.keys()) if (req.url.startsWith(prefix(id))) await c.delete(req);
  } catch {}
}
