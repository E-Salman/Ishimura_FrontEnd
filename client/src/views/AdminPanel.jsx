import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { uploadColeccionableImages, isAdminFromToken } from "../lib/api";
import { useAuth } from "../context/AuthContext.jsx";

const BASE = "http://localhost:4002";

// Parser alineado con CatalogoListItemDTO { coleccionableId, nombre, precio, stock, firstImageId }
function parseCatalogItem(raw) {
  const c = raw ?? {};
  const id = c?.coleccionableId ?? c?.coleccionableID ?? c?.id ?? null;
  const stock = c?.stock ?? 0;
  const nombre = c?.nombre ?? null;
  const precio = c?.precio ?? null;
  const firstImageId = c?.firstImageId ?? c?.firstImageID ?? c?.firstimageid ?? null;
  return { id, stock, nombre, precio, firstImageId };
}

export default function AdminPanel() {
  const navigate = useNavigate();
  
  const { token, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]); // [{ id, stock }]
  const [details, setDetails] = useState(new Map()); // id -> { nombre, marcaNombre, lineaNombre, imagenUrl }
  const [marcas, setMarcas] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [marcaId, setMarcaId] = useState("");
  const [lineaId, setLineaId] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [busyIds, setBusyIds] = useState(new Set()); // ids con acción en curso
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null); // { msg, type }

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2500);
  }
  const [edit, setEdit] = useState({ open: false });

  const lowThreshold = 10;

  // Cargar catálogo (id + stock)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const res = await fetch(`${BASE}/catalogo`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const arr = Array.isArray(json) ? json : [];
        const mapped = arr.map(parseCatalogItem).filter((x) => x.id != null);
        if (!cancelled) setRows(mapped);
      } catch (e) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  // Cargar detalles por cada id (nombre, marca, linea, imagen)
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;
    const loadFor = async (id) => {
      try {
        // Detalle
        const res1 = await fetch(`${BASE}/coleccionable/${id}`, { signal: controller.signal, headers: authHeaders });
        if (!res1.ok) throw new Error(`Detalle HTTP ${res1.status}`);
        const det = await res1.json();
        // Imagen
        let imgUrl = null;
        try {
          // Si /catalogo nos dio firstImageId, úsalo. Si no, caer a /coleccionable/{id}/imagenes/0
          const row = rows.find((r) => String(r.id) === String(id));
          if (row?.firstImageId != null) {
            const resImg = await fetch(`${BASE}/imagenes?id=${encodeURIComponent(row.firstImageId)}`, { signal: controller.signal, headers: authHeaders });
            if (resImg.ok) { const blob = await resImg.blob(); imgUrl = URL.createObjectURL(blob); }
          } else {
            const res2 = await fetch(`${BASE}/coleccionable/${id}/imagenes/0`, { signal: controller.signal, headers: authHeaders });
            if (res2.ok) { const blob = await res2.blob(); imgUrl = URL.createObjectURL(blob); }
          }
        } catch (_) {}
        if (!cancelled) {
          setDetails((prev) => {
            const next = new Map(prev);
            next.set(String(id), {
              id,
              nombre: det?.nombre ?? rows.find((r) => String(r.id) === String(id))?.nombre ?? "Coleccionable",
              descripcion: det?.descripcion ?? null,
              lineaNombre: det?.lineaNombre ?? det?.linea ?? null,
              marcaNombre: det?.marcaNombre ?? det?.marca ?? null,
              lineaId: det?.lineaId ?? det?.linea?.id ?? null,
              marcaId: det?.marcaId ?? det?.marca?.id ?? null,
              visible: det?.visible ?? null,
              imagenUrl: imgUrl,
              precio: det?.precio ?? rows.find((r) => String(r.id) === String(id))?.precio ?? null,
              imagenes: Array.isArray(det?.imagenes) ? det.imagenes : [],
            });
            return next;
          });
        }
      } catch (_) {
        // ignorar; mostrará celdas mínimas
      }
    };
    // cargar en lote (limitamos concurrencia básica)
    const ids = rows.map((r) => r.id).filter((id) => !details.has(String(id)));
    const queue = [...ids];
    const concurrency = 4;
    const workers = new Array(concurrency).fill(0).map(async () => {
      while (queue.length && !cancelled) {
        const id = queue.shift();
        await loadFor(id);
      }
    });
    Promise.all(workers);
    return () => { cancelled = true; controller.abort(); };
  }, [rows]);

  // Cargar marcas para filtros y gestión
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${BASE}/marcas`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((arr) => setMarcas(Array.isArray(arr) ? arr : []))
      .catch(() => {})
      .finally(() => {});
    return () => controller.abort();
  }, []);

  // Cargar líneas al elegir marca
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

  const filtered = useMemo(() => {
    const term = String(q || "").toLowerCase().trim();
    return rows
      .map((r) => {
        const d = details.get(String(r.id));
        return { ...r, det: d };
      })
      .filter((r) => (marcaId ? String(r?.det?.marcaId ?? "") === String(marcaId) : true))
      .filter((r) => (lineaId ? String(r?.det?.lineaId ?? "") === String(lineaId) : true))
      .filter((r) => {
        if (!term) return true;
        const hay = [r?.det?.nombre, r?.nombre, r?.det?.marcaNombre, r?.det?.lineaNombre, r?.id]
          .filter(Boolean)
          .map((x) => String(x).toLowerCase());
        return hay.some((s) => s.includes(term));
      });
  }, [rows, details, marcaId, lineaId, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const pageItems = useMemo(() => {
    const start = (page - 1) * size;
    return filtered.slice(start, start + size);
  }, [filtered, page, size]);

  function setBusy(id, on) {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(String(id)); else next.delete(String(id));
      return next;
    });
  }

  async function adjustStock(id, mode, value) {
    try {
      setBusy(id, true);
      let url = null; let method = "POST";
      if (mode === "inc") url = `${BASE}/catalogo/${id}/incrementarstock?cantidad=${encodeURIComponent(value)}`;
      else if (mode === "dec") url = `${BASE}/catalogo/${id}/decrementarstock?cantidad=${encodeURIComponent(value)}`;
      else if (mode === "set") { url = `${BASE}/catalogo/${id}/cambiarstock?nuevoStock=${encodeURIComponent(value)}`; method = "PUT"; }
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch(url, { method, headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // refrescar stock del item desde /catalogo/{id}
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const one = await fetch(`${BASE}/catalogo/${id}`, { headers });
        if (one.ok) {
          const dto = await one.json();
          const newStock = dto?.stock ?? dto?.cantidad ?? null;
          setRows((prev) => prev.map((r) => (String(r.id) === String(id) ? { ...r, stock: newStock ?? r.stock } : r)));
        } else {
          // fallback: optimista
          setRows((prev) => prev.map((r) => {
            if (String(r.id) !== String(id)) return r;
            if (mode === "inc") return { ...r, stock: Number(r.stock || 0) + Number(value || 0) };
            if (mode === "dec") return { ...r, stock: Math.max(0, Number(r.stock || 0) - Number(value || 0)) };
            if (mode === "set") return { ...r, stock: Number(value || 0) };
            return r;
          }));
        }
      } catch (_) {}
    } catch (e) {
      alert(`No se pudo actualizar el stock: ${e?.message || e}`);
    } finally {
      setBusy(id, false);
    }
  }

  async function deleteColeccionable(id) {
    const sure = confirm(`¿Borrar coleccionable ${id}? Esta acción es permanente.`);
    if (!sure) return;
    try {
      setBusy(id, true);
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch(`${BASE}/coleccionable/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRows((prev) => prev.filter((r) => String(r.id) !== String(id)));
      setDetails((prev) => { const next = new Map(prev); next.delete(String(id)); return next; });
    } catch (e) {
      alert(`No se pudo borrar: ${e?.message || e}`);
    } finally { setBusy(id, false); }
  }

  async function deleteLinea(id) {
    const sure = confirm(`¿Borrar línea ${id}? Esto elimina sus coleccionables e imágenes.`);
    if (!sure) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch(`${BASE}/lineas/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // refrescar filtros
      setMarcas((m) => [...m]);
      if (String(marcaId)) {
        const arr = await fetch(`${BASE}/listarColeLineas/lineas/marca/${encodeURIComponent(marcaId)}`).then((r) => r.ok ? r.json() : []);
        setLineas(Array.isArray(arr) ? arr : []);
      }
    } catch (e) {
      alert(`No se pudo borrar la línea: ${e?.message || e}`);
    }
  }

  async function deleteMarca(id) {
    const sure = confirm(`¿Borrar marca ${id}? Esto elimina sus líneas y coleccionables.`);
    if (!sure) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch(`${BASE}/marcas/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // refrescar marcas
      const arr = await fetch(`${BASE}/marcas`).then((r) => r.ok ? r.json() : []);
      setMarcas(Array.isArray(arr) ? arr : []);
      if (String(marcaId) === String(id)) { setMarcaId(""); setLineas([]); setLineaId(""); }
    } catch (e) {
      alert(`No se pudo borrar la marca: ${e?.message || e}`);
    }
  }

  // TODO: Editar y Visibilidad: requerimos el shape exacto del ColeccionableDTO para PUT
  function requestEdit(id) {
    const d = details.get(String(id));
    if (!d) return;
    setEdit({
      open: true,
      id,
      nombre: d?.nombre || "",
      descripcion: d?.descripcion || "",
      precio: d?.precio ?? "",
      marcaId: d?.marcaId || "",
      lineaId: d?.lineaId || "",
      imagenes: Array.isArray(d?.imagenes) ? d.imagenes : [],
      saving: false,
      error: null,
    });
    // El modal se encarga de cargar líneas según la marca seleccionada
  }
  // Visibilidad anulada por solicitud: no se implementa ocultar/mostrar

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-black text-primary">No autorizado</h1>
        <p className="mt-2 text-white/70">Necesitás permisos de administrador para ver el panel.</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-black text-primary">Stock Management</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => { setMarcaId(''); setLineaId(''); setQ(''); setPage(1); setRefreshKey((k) => k + 1); showToast('Cambios descartados', 'info'); }} className="rounded-md bg-gray-600 px-4 py-2 text-sm font-bold text-white hover:bg-gray-500">
            Cancelar
          </button>
          <button onClick={() => { setRefreshKey((k) => k + 1); showToast('Cambios guardados'); }} className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-black hover:bg-primary/90">
            Guardar cambios
          </button>
          <NavLink to="/admin/crear-coleccionable" className="rounded-md bg-primary/20 px-4 py-2 text-sm font-bold text-white hover:bg-primary/30">
            Agregar Producto
          </NavLink>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <input
            placeholder="Buscar por nombre, id, marca, línea"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none"
          />
        </div>
        <div>
          <select value={marcaId} onChange={(e) => { setMarcaId(e.target.value); setPage(1); }} className="w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none">
            <option value="">Todas las marcas</option>
            {marcas.map((m) => (
              <option key={m.id ?? m.marcaId} value={m.id ?? m.marcaId}>{m.nombre ?? m.name ?? m.title}</option>
            ))}
          </select>
        </div>
        <div>
          <select value={lineaId} onChange={(e) => { setLineaId(e.target.value); setPage(1); }} disabled={!marcaId} className="w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white disabled:opacity-50 focus:border-primary/50 focus:outline-none">
            <option value="">Todas las líneas</option>
            {lineas.map((l) => (
              <option key={l.id ?? l.lineaId} value={l.id ?? l.lineaId}>{l.nombre ?? l.name ?? l.titulo}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <div className="overflow-hidden rounded-lg border border-white/10 bg-black/50">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-white/60">
            <tr>
              <th className="px-3 py-3">Imagen</th>
              <th className="px-3 py-3">Nombre</th>
              <th className="px-3 py-3">ID</th>
              <th className="px-3 py-3">Marca</th>
              <th className="px-3 py-3">Línea</th>
              <th className="px-3 py-3">Stock</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-white/70">Cargando…</td>
              </tr>
            )}
            {!loading && pageItems.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-white/60">Sin resultados</td>
              </tr>
            )}
            {pageItems.map((r) => {
              const d = r.det || details.get(String(r.id));
              const st = Number(r.stock || 0);
              const status = st <= 0 ? { label: "Sin stock", class: "bg-red-500/20 text-red-300" }
                : st <= lowThreshold ? { label: "Bajo stock", class: "bg-yellow-500/20 text-yellow-300" }
                : { label: "En stock", class: "bg-emerald-500/20 text-emerald-300" };
              const busy = busyIds.has(String(r.id));
              return (
                <tr key={r.id} className="hover:bg-white/5">
                  <td className="px-3 py-2">
                    {d?.imagenUrl ? (
                      <img src={d.imagenUrl} alt="" className="h-12 w-12 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded bg-white/10" />
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium">{d?.nombre ?? r?.nombre ?? "—"}</td>
                  <td className="px-3 py-2 text-white/70">{r.id}</td>
                  <td className="px-3 py-2">{d?.marcaNombre ?? "—"}</td>
                  <td className="px-3 py-2">{d?.lineaNombre ?? "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button disabled={busy || st <= 0} onClick={() => adjustStock(r.id, "dec", 1)} className="rounded bg-white/10 px-2 py-1 text-white/80 hover:bg-white/20 disabled:opacity-50">-</button>
                      <span className="min-w-[2ch] text-center">{st <= 0 ? 'Sin stock' : st}</span>
                      <button disabled={busy} onClick={() => adjustStock(r.id, "inc", 1)} className="rounded bg-white/10 px-2 py-1 text-white/80 hover:bg-white/20 disabled:opacity-50">+</button>
                      <input
                        type="number"
                        min={0}
                        defaultValue={st}
                        onKeyDown={(e) => { if (e.key === 'Enter') { const v = Number(e.currentTarget.value || 0); adjustStock(r.id, "set", v); } }}
                        className="w-20 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-white focus:border-primary/50 focus:outline-none"
                        title="Enter para setear"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${status.class}`}>{status.label}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-3">
                      <button title="Editar" onClick={() => requestEdit(r.id)} className="rounded bg-white/10 px-2 py-1 text-white/80 hover:bg-white/20">✏️</button>
                      <button title="Borrar" disabled={busy} onClick={() => deleteColeccionable(r.id)} className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-500 disabled:opacity-50">Borrar</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-white/60">Mostrando {pageItems.length} de {filtered.length}</div>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded bg-white/10 px-3 py-1 text-white/80 hover:bg-white/20 disabled:opacity-50">Prev</button>
          <span className="text-white/70">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded bg-white/10 px-3 py-1 text-white/80 hover:bg-white/20 disabled:opacity-50">Next</button>
          <select value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }} className="rounded-md border border-white/10 bg-black/60 px-2 py-1 text-white focus:border-primary/50 focus:outline-none">
            {[10, 20, 50].map((n) => <option key={n} value={n}>{n}/página</option>)}
          </select>
        </div>
      </div>

      {/* Gestión rápida de marcas/líneas (borrado en cascada) */}
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xl font-bold text-primary">Marcas</h2>
          <div className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10">
            {marcas.map((m) => (
              <div key={m.id ?? m.marcaId} className="flex items-center justify-between bg-black/40 px-3 py-2">
                <div className="text-sm">{m.nombre ?? m.name ?? m.title} <span className="text-white/40">(id: {m.id ?? m.marcaId})</span></div>
                <button onClick={() => deleteMarca(m.id ?? m.marcaId)} className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-500">Borrar</button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-xl font-bold text-primary">Líneas {marcaId ? `(marca ${marcaId})` : ""}</h2>
          {marcaId ? (
            <div className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10">
              {lineas.map((l) => (
                <div key={l.id ?? l.lineaId} className="flex items-center justify-between bg-black/40 px-3 py-2">
                  <div className="text-sm">{l.nombre ?? l.name ?? l.titulo} <span className="text-white/40">(id: {l.id ?? l.lineaId})</span></div>
                  <button onClick={() => deleteLinea(l.id ?? l.lineaId)} className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-500">Borrar</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/60">Elegí una marca arriba para ver sus líneas.</p>
          )}
        </div>
      </div>

      {edit.open && (
        <EditModal
          edit={edit}
          setEdit={setEdit}
          base={BASE}
          token={token}
          onToast={showToast}
          onUpdated={(updated) => {
            // refrescar detalle en memoria
            setDetails((prev) => {
              const next = new Map(prev);
              const cur = next.get(String(updated.id)) || {};
              next.set(String(updated.id), { ...cur, ...updated });
              return next;
            });
            // también reflejar en filas (nombre/precio si vinieron en /catalogo)
            setRows((prev) => prev.map((r) => (String(r.id) === String(updated.id) ? { ...r, nombre: updated.nombre ?? r.nombre, precio: updated.precio ?? r.precio } : r)));
          }}
        />
      )}

      {toast && (
        <div className={`fixed right-4 top-4 z-[99999] rounded-md px-4 py-2 text-sm shadow-lg ${toast.type === 'error' ? 'bg-red-600 text-white' : toast.type === 'info' ? 'bg-gray-700 text-white' : 'bg-emerald-500 text-black'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function EditModal({ edit, setEdit, base, token, onUpdated, onToast }) {
  const [local, setLocal] = useState(edit);
  const [marcas, setMarcas] = useState([]);
  const [lines, setLines] = useState([]);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [replaceMain, setReplaceMain] = useState(false);

  useEffect(() => { setLocal(edit); }, [edit]);

  useEffect(() => {
    // revoke previews on unmount or when files change
    return () => {
      try { previews.forEach((u) => URL.revokeObjectURL(u)); } catch {}
    };
  }, [previews]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${base}/marcas`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((arr) => setMarcas(Array.isArray(arr) ? arr : []));
    return () => controller.abort();
  }, [base]);

  // cargar líneas al seleccionar marca
  useEffect(() => {
    if (!local.marcaId) { setLines([]); return; }
    const controller = new AbortController();
    fetch(`${base}/listarColeLineas/lineas/marca/${encodeURIComponent(local.marcaId)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((arr) => setLines(Array.isArray(arr) ? arr : []))
      .catch(() => setLines([]));
    return () => controller.abort();
  }, [base, local.marcaId]);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setLocal((s) => ({ ...s, saving: true, error: null }));
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const payload = {
        nombre: local.nombre?.trim(),
        descripcion: local.descripcion?.trim() || '',
        precio: local.precio === '' ? null : Number(local.precio),
        linea: local.lineaId ? Number(local.lineaId) : null,
        imagenes: Array.isArray(local.imagenes) ? local.imagenes : [],
      };
      const res = await fetch(`${base}/coleccionable/${encodeURIComponent(local.id)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json().catch(() => null);
      // Si hay archivos seleccionados, subirlos (y opcionalmente reemplazar la principal)
      let newImgUrl = null;
      if (files.length > 0) {
        const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;
        if (replaceMain) {
          try {
            await fetch(`${base}/imagenes/coleccionable/${encodeURIComponent(local.id)}?mode=first`, { method: 'DELETE', headers: authHeader });
          } catch (_) {}
        }
        const up = await uploadColeccionableImages(local.id, files, { token });
        if (!up?.ok) throw new Error('Cambios guardados, pero error subiendo imágenes');
        try {
          const resImg = await fetch(`${base}/coleccionable/${encodeURIComponent(local.id)}/imagenes/0`, { headers: authHeader });
          if (resImg.ok) { const blob = await resImg.blob(); newImgUrl = URL.createObjectURL(blob); }
        } catch (_) {}
      }

      const updated = {
        id: local.id,
        nombre: payload.nombre,
        precio: payload.precio,
        lineaId: payload.linea,
        marcaId: local.marcaId,
        lineaNombre: lines.find((l) => String(l.id ?? l.lineaId) === String(local.lineaId))?.nombre ?? undefined,
        marcaNombre: marcas.find((m) => String(m.id ?? m.marcaId) === String(local.marcaId))?.nombre ?? undefined,
        descripcion: payload.descripcion,
        ...(newImgUrl ? { imagenUrl: newImgUrl } : {}),
      };
      onUpdated?.(updated);
      onToast?.('Cambios guardados');
      setEdit({ open: false });
    } catch (e) {
      setLocal((s) => ({ ...s, error: e?.message || String(e) }));
      onToast?.(e?.message || 'Error guardando cambios', 'error');
    } finally {
      setLocal((s) => ({ ...s, saving: false }));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-lg border border-white/10 bg-black/80 p-5">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-primary">Editar coleccionable</h3>
        </div>

        {local.error && <p className="mb-3 text-sm text-red-400">{local.error}</p>}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-white/70">Nombre</label>
            <input value={local.nombre} onChange={(e) => setLocal({ ...local, nombre: e.target.value })} required className="mt-1 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-white/70">Descripción</label>
            <textarea value={local.descripcion} onChange={(e) => setLocal({ ...local, descripcion: e.target.value })} rows={3} className="mt-1 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-white/70">Precio</label>
            <input type="number" step="0.01" value={local.precio} onChange={(e) => setLocal({ ...local, precio: e.target.value })} className="mt-1 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none" />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs text-white/70">Marca</label>
              <select value={local.marcaId || ''} onChange={(e) => setLocal({ ...local, marcaId: e.target.value, lineaId: '' })} className="mt-1 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none">
                <option value="">Seleccionar</option>
                {marcas.map((m) => (
                  <option key={m.id ?? m.marcaId} value={m.id ?? m.marcaId}>{m.nombre ?? m.name ?? m.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/70">Línea</label>
              <select value={local.lineaId || ''} onChange={(e) => setLocal({ ...local, lineaId: e.target.value })} disabled={!local.marcaId} className="mt-1 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white disabled:opacity-50 focus:border-primary/50 focus:outline-none">
                <option value="">Seleccionar</option>
                {lines.map((l) => (
                  <option key={l.id ?? l.lineaId} value={l.id ?? l.lineaId}>{l.nombre ?? l.name ?? l.titulo}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Imágenes */}
          <div className="pt-2">
            <label className="mb-1 block text-xs text-white/70">Imagen principal</label>
            <div className="flex items-start gap-4">
              <div className="h-24 w-24 overflow-hidden rounded bg-white/10">
                {edit?.imagenUrl ? (
                  <img src={edit.imagenUrl} alt="actual" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs text-white/50">Sin imagen</div>
                )}
              </div>
              <div className="grow">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={(e) => {
                    const list = Array.from(e.target.files || []);
                    const allowed = ["image/jpeg","image/png","image/jpg"];
                    const selected = list.filter((f) => allowed.includes(f.type) || /\.(jpe?g|png)$/i.test(f.name));
                    try { previews.forEach((u) => URL.revokeObjectURL(u)); } catch {}
                    setFiles(selected);
                    setPreviews(selected.map((f) => URL.createObjectURL(f)));
                  }}
                  className="block w-full text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-primary/20 file:px-3 file:py-2 file:text-white hover:file:bg-primary/30"
                />
                {previews.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {previews.map((u, idx) => (
                      <img key={idx} src={u} alt="preview" className="h-16 w-16 rounded object-cover" />
                    ))}
                  </div>
                )}
                <label className="mt-2 flex items-center gap-2 text-xs text-white/70">
                  <input type="checkbox" checked={replaceMain} onChange={(e) => setReplaceMain(e.target.checked)} />
                  Reemplazar imagen principal (borra la actual)
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEdit({ open: false })} className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-500">Cancelar</button>
            <button disabled={local.saving} className="rounded-md bg-primary px-4 py-2 font-bold text-black hover:bg-primary/90 disabled:opacity-50">Confirmar cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}
