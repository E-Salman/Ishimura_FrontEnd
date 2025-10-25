// Quick local check: simulate tokens and run the same logic as Home.jsx

function makeToken(payload) {
  const enc = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${enc({ alg: "none", typ: "JWT" })}.${enc(payload)}.`;
}

function isAdminFromToken(token) {
  if (!token) return false;
  try {
    const [, raw] = String(token).split(".");
    if (!raw) return false;
    let b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const json = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    const buckets = [
      json?.roles,
      json?.role,
      json?.authorities,
      json?.authority,
      json?.scope,
      json?.scopes,
      json?.rol,
      json?.perms,
      json?.permissions,
    ]
      .flat()
      .filter(Boolean)
      .map((x) => (typeof x === "string" ? x : x?.authority || x?.name || x?.value || ""));
    return buckets.some((v) => /ADMIN/i.test(String(v)));
  } catch {
    return false;
  }
}

const cases = [
  { name: 'roles ["ADMIN"]', payload: { roles: ["ADMIN"] } },
  { name: 'authorities [{authority: "ROLE_ADMIN"}]', payload: { authorities: [{ authority: "ROLE_ADMIN" }] } },
  { name: 'role "ADMIN"', payload: { role: "ADMIN" } },
  { name: 'perms ["ADMIN_CREATE"]', payload: { perms: ["ADMIN_CREATE"] } },
  { name: 'negative roles ["USER"]', payload: { roles: ["USER"] } },
];

for (const c of cases) {
  const token = makeToken(c.payload);
  console.log(`${c.name} =>`, isAdminFromToken(token));
}

