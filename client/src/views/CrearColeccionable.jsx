import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authcontext.jsx";

const BASE = "http://localhost:4002";

function getToken() {
  return (
    localStorage.getItem("ishimura_token") ||
    localStorage.getItem("token") ||
    null
  );
}

function isAdminFromToken(token) {
  if (!token) return false;
  try {
    const [, payloadB64] = token.split(".");
    const json = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
    const candidates = [
      json?.roles,
      json?.authorities,
      json?.authority,
      json?.scope,
      json?.scopes,
      json?.rol,
      json?.perms,
    ]
      .flat()
      .filter(Boolean)
      .map((x) => (typeof x === "string" ? x : x?.authority || x?.name || ""))
      .filter(Boolean);
    return candidates.some((s) => /ADMIN/i.test(String(s)));
  } catch (_) {
    return false;
  }
}

export default function CrearColeccionable() {
  const navigate = useNavigate();
  const { user } = useAuth?.() || { user: null };
  const token = useMemo(() => getToken(), [user]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  const [marcas, setMarcas] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [marcaId, setMarcaId] = useState("");
  const [lineaId, setLineaId] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [okMsg, setOkMsg] = useState(null);

  // Resolver si es ADMIN: primero por backend (si soporta), fallback a JWT
  useEffect(() => {
    let active = true;
    async function check() {
      try {
        setChecking(true);
        const email = user?.email || localStorage.getItem("ishimura_email") || localStorage.getItem("email");
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        if (email && token) {
          const res = await fetch(`${BASE}/usuarios/filtrarPorEmail?email=${encodeURIComponent(email)}`, { headers });
          if (res.ok) {
            const json = await res.json();
            const rol = json?.rol || json?.role || json?.authority || json?.authorities || json?.roles;
            const ok = Array.isArray(rol)
              ? rol.some((r) => /ADMIN/i.test(String(r?.authority || r)))
              : /ADMIN/i.test(String(rol || ""));
            if (active) { setIsAdmin(ok); setChecking(false); return; }
          }
        }
        // fallback: JWT
        const okJwt = isAdminFromToken(token);
        if (active) { setIsAdmin(okJwt); setChecking(false); }
      } catch (_) {
        const okJwt = isAdminFromToken(token);
        if (active) { setIsAdmin(okJwt); setChecking(false); }
      }
    }
    check();
    return () => { active = false; };
  }, [token, user]);

  // Cargar marcas
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${BASE}/marcas`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((arr) => setMarcas(Array.isArray(arr) ? arr : []))
      .catch(() => {})
      .finally(() => {});
    return () => controller.abort();
  }, []);

  // Cargar líneas por marca
  useEffect(() => {
    setLineas([]);
    setLineaId("");
    if (!marcaId) return;
    const controller = new AbortController();
    fetch(`${BASE}/listarColeLineas/lineas/marca/${encodeURIComponent(marcaId)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((arr) => setLineas(Array.isArray(arr) ? arr : []))
      .catch(() => setLineas([]));
    return () => controller.abort();
  }, [marcaId]);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    setSubmitting(true);
    try {
      const payload = {
        nombre: nombre?.trim(),
        descripcion: descripcion?.trim(),
        precio: precio === "" ? null : Number(precio),
        linea: lineaId ? Number(lineaId) : null,
        imagenes: [],
      };
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`${BASE}/coleccionable`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      const json = await res.json().catch(() => null);
      setOkMsg(`Creado con éxito${json?.id ? ` (ID: ${json.id})` : ""}`);
      // limpiar
      setNombre("");
      setDescripcion("");
      setPrecio("");
      setMarcaId("");
      setLineaId("");
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-black text-primary">No autorizado</h1>
        <p className="mt-2 text-white/70">Necesitás permisos de administrador para crear coleccionables.</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black text-primary">Crear Coleccionable</h1>
      <p className="mt-2 text-white/70">Completa los datos mínimos. Podrás subir imágenes luego.</p>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {okMsg && <p className="mt-4 text-sm text-emerald-400">{okMsg}</p>}

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-white/80">Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required className="mt-1 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80">Descripción</label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80">Precio</label>
          <input type="number" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} required className="mt-1 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Marca</label>
            <select value={marcaId} onChange={(e) => setMarcaId(e.target.value)} className="w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none">
              <option value="">Seleccionar marca</option>
              {marcas.map((m) => (
                <option key={m.id ?? m.marcaId} value={m.id ?? m.marcaId}>{m.nombre ?? m.name ?? m.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Línea</label>
            <select value={lineaId} onChange={(e) => setLineaId(e.target.value)} disabled={!marcaId} className="w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white disabled:opacity-50 focus:border-primary/50 focus:outline-none">
              <option value="">Seleccionar</option>
              {lineas.map((l) => (
                <option key={l.id ?? l.lineaId} value={l.id ?? l.lineaId}>{l.nombre ?? l.name ?? l.titulo}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-black hover:bg-primary/90 disabled:opacity-50">
            {submitting ? 'Creando…' : 'Crear'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="rounded-md border border-white/10 px-5 py-2 text-sm font-semibold text-white/80 hover:bg-white/5">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
