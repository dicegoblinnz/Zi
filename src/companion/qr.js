// A link as a code to scan, drawn on the phone, black on white so every camera
// reads it. uqr's only loaded when a code's drawn. The join link and the table
// screen (campaigns.js) and a character's link (share.js) all use it.
export async function qrSvg(text) {
  const { encode } = await import("uqr");
  const qr = encode(text, { ecc: "M", border: 0 });
  const n = qr.size;
  let path = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.data[y][x]) path += `M${x + 4} ${y + 4}h1v1h-1z`;
  return `<svg viewBox="0 0 ${n + 8} ${n + 8}" width="100%" height="100%" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><rect width="100%" height="100%" fill="#fff"/><path fill="#000" d="${path}"/></svg>`;
}
