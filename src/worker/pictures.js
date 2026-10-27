// Where a campaign's map pictures are kept: the R2 bucket bound as MAPS, each
// campaign in a folder of its own, c/<campaign>/, so nothing here can reach
// another campaign's. maps.js puts them up and hands them out, world.js takes
// a map's picture away when the map goes, and ending a campaign takes the
// whole folder.

export const pictureKey = (campId, file) => `c/${campId}/${file}`;

// These pictures, out of this campaign's folder. A picture that won't go is
// only space, so it never stops the change that took its map away.
export async function dropPictures(env, campId, files) {
  if (!env.MAPS || !files.length) return;
  try {
    await env.MAPS.delete(files.map((f) => pictureKey(campId, f)));
  } catch (err) {
    console.error(`maps: ${err?.message ?? err}`);
  }
}

// Every picture the campaign had, when it ends.
export async function picturesEnd(env, campId) {
  if (!env.MAPS) return;
  try {
    let cursor;
    do {
      const list = await env.MAPS.list({ prefix: `c/${campId}/`, cursor });
      const keys = list.objects.map((o) => o.key);
      if (keys.length) await env.MAPS.delete(keys);
      cursor = list.truncated ? list.cursor : undefined;
    } while (cursor);
  } catch (err) {
    console.error(`maps: ${err?.message ?? err}`);
  }
}
