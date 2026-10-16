// Characters saved on this phone. One localStorage key, zi-characters, holds a
// versioned list, kept simple so it can move into an account later:
//   { v: 1, characters: [{ id, crew, name, made, hash, state }] }
// crew is the crew member's id, hash is their sheet's hash when this phone last
// saw it, and state is everything the player changes in play. The sheet itself
// is always read from the current rules, never saved here.

const KEY = "zi-characters";
export const VERSION = 1;

function readable(raw) {
  const data = JSON.parse(raw);
  if (!data || !Array.isArray(data.characters)) throw new Error("not a list of characters");
  // Later versions go here, oldest first, each one bringing a list up a version.
  return {
    v: VERSION,
    characters: data.characters.filter((c) => c && typeof c.id === "string" && typeof c.crew === "string"),
  };
}

export function openStore() {
  const store = { ok: true, broken: false, data: { v: VERSION, characters: [] } };
  try {
    localStorage.setItem(`${KEY}-check`, "1");
    localStorage.removeItem(`${KEY}-check`);
  } catch {
    store.ok = false;
  }
  if (store.ok) {
    let raw = null;
    try {
      raw = localStorage.getItem(KEY);
      if (raw) store.data = readable(raw);
    } catch {
      // Keep what couldn't be read, so nothing's lost, and start a fresh list.
      store.broken = true;
      try {
        if (raw) localStorage.setItem(`${KEY}-unreadable`, raw);
      } catch {}
    }
  }
  store.save = () => {
    if (!store.ok) return false;
    try {
      localStorage.setItem(KEY, JSON.stringify(store.data));
      return true;
    } catch {
      store.ok = false;
      return false;
    }
  };
  return store;
}
