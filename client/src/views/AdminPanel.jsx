import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [newMarca, setNewMarca] = useState({ nombre: "" });
  const [creatingMarca, setCreatingMarca] = useState(false);
  const [newMarcaError, setNewMarcaError] = useState(null);
  const [newMarcaFile, setNewMarcaFile] = useState(null);
  const [newMarcaPreview, setNewMarcaPreview] = useState(null);
  const [newMarcaFileKey, setNewMarcaFileKey] = useState(0);
  const [newLinea, setNewLinea] = useState({ nombre: "", marcaId: "" });
  const [creatingLinea, setCreatingLinea] = useState(false);
  const [newLineaError, setNewLineaError] = useState(null);
  const newMarcaFileInputRef = useRef(null);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2500);
  }
  const [edit, setEdit] = useState({ open: false });

  const lowThreshold = 10;

  useEffect(() => {
    return () => {
      if (newMarcaPreview) {
        try { URL.revokeObjectURL(newMarcaPreview); } catch (_) { }
      }
    };
  }, [newMarcaPreview]);

  useEffect(() => {
    if (marcaId) {
      setNewLinea((prev) => (prev.marcaId ? prev : { ...prev, marcaId }));
    }
  }, [marcaId]);

  const refreshMarcas = useCallback(async (signal) => {
    try {
      const res = await fetch(`${BASE}/marcas`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setMarcas(Array.isArray(json) ? json : []);
      return json;
    } catch (e) {
      if (e?.name === "AbortError") return null;
      throw e;
    }
  }, []);

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
        // Descuento / promo activa
        let promoDiscount = det?.descuento
          ?? det?.discount
          ?? det?.porcentajeDescuento
          ?? det?.descuentoPorcentaje
          ?? det?.valor
          ?? null;
        try {
          const resPromo = await fetch(`${BASE}/promociones/activas?coleccionableId=${encodeURIComponent(id)}`, { signal: controller.signal, headers: authHeaders });
          if (resPromo.ok) {
            const arrPromo = await resPromo.json();
            if (Array.isArray(arrPromo)) {
              const found = arrPromo.find((p) => String(p?.scopeType).toUpperCase?.() === "ITEM" && String(p?.scopeId) === String(id));
              if (found?.valor != null && String(found?.tipo).toUpperCase?.() === "PERCENT") {
                promoDiscount = found.valor;
              }
            }
          }
        } catch (_) { }
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
        } catch (_) { }
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
              descuento: promoDiscount,
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
    refreshMarcas(controller.signal).catch(() => { });
    return () => controller.abort();
  }, [refreshMarcas]);

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
      } catch (_) { }
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
      await refreshMarcas();
      if (String(marcaId) === String(id)) { setMarcaId(""); setLineas([]); setLineaId(""); }
    } catch (e) {
      alert(`No se pudo borrar la marca: ${e?.message || e}`);
    }
  }

  async function handleCreateMarca(e) {
    e?.preventDefault?.();
    const nombre = newMarca.nombre?.trim();
    if (!nombre) {
      setNewMarcaError("Ingresá un nombre para la marca.");
      return;
    }
    try {
      setCreatingMarca(true);
      setNewMarcaError(null);
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const payload = {
        nombre,
      };
      const res = await fetch(`${BASE}/marcas/crear`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const created = await res.json().catch(() => null);
      const newId = created?.id ?? created?._id ?? created?.marcaId ?? created?.marcaID ?? null;

      let uploadNotice = null;
      if (newMarcaFile && newId != null) {
        try {
          const up = await uploadMarcaImages(newId, [newMarcaFile], { token });
          if (!up?.ok) {
            uploadNotice = "Marca creada, pero la imagen no se pudo subir.";
          }
        } catch (err) {
          uploadNotice = err?.message || "Marca creada, pero falló la carga de imagen.";
        }
      }

      await refreshMarcas();
      setNewMarca({ nombre: "" });
      if (newMarcaPreview) {
        try { URL.revokeObjectURL(newMarcaPreview); } catch (_) { }
      }
      setNewMarcaPreview(null);
      setNewMarcaFile(null);
      setNewMarcaFileKey((k) => k + 1);
      showToast(uploadNotice ?? "Marca creada", uploadNotice ? "info" : "success");
      setNewMarcaError(uploadNotice);
    } catch (e) {
      const msg = e?.message || "No se pudo crear la marca";
      setNewMarcaError(msg);
      showToast(msg, "error");
    } finally {
      setCreatingMarca(false);
    }
  }

  async function handleCreateLinea(e) {
    e?.preventDefault?.();
    const nombre = newLinea.nombre?.trim();
    const targetMarcaId = newLinea.marcaId || marcaId;
    const targetMarcaIdNum = Number(targetMarcaId);
    const marcaIdValue = Number.isFinite(targetMarcaIdNum) ? targetMarcaIdNum : targetMarcaId;
    if (!targetMarcaId) {
      setNewLineaError("Elegi una marca para la linea.");
      return;
    }
    if (!nombre) {
      setNewLineaError("Ingresa un nombre para la linea.");
      return;
    }
    try {
      setCreatingLinea(true);
      setNewLineaError(null);
      const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;
      const jsonHeaders = { "Content-Type": "application/json", ...authHeader };
      const attempts = [
        { url: `${BASE}/lineas/crear`, body: { nombre, marcaId: marcaIdValue }, headers: jsonHeaders },
        { url: `${BASE}/lineas/crear`, body: { nombre, marca: marcaIdValue }, headers: jsonHeaders },
        { url: `${BASE}/lineas/crear`, body: { nombre, marca: { id: marcaIdValue } }, headers: jsonHeaders },
        { url: `${BASE}/lineas/crear`, body: { nombre, marca: { marcaId: marcaIdValue } }, headers: jsonHeaders },
        { url: `${BASE}/lineas/crear`, body: { nombre, marca_id: marcaIdValue }, headers: jsonHeaders },
        { url: `${BASE}/lineas/crear`, body: { nombre, idMarca: marcaIdValue }, headers: jsonHeaders },
        { url: `${BASE}/lineas`, body: { nombre, marcaId: marcaIdValue }, headers: jsonHeaders },
        { url: `${BASE}/lineas`, body: { nombre, marca: marcaIdValue }, headers: jsonHeaders },
        { url: `${BASE}/lineas`, body: { nombre, marca: { id: marcaIdValue } }, headers: jsonHeaders },
        { url: `${BASE}/lineas`, body: { nombre, marca_id: marcaIdValue }, headers: jsonHeaders },
        { url: `${BASE}/lineas/crear?nombre=${encodeURIComponent(nombre)}&marcaId=${encodeURIComponent(targetMarcaId)}`, body: null, headers: authHeader },
        { url: `${BASE}/marcas/${encodeURIComponent(targetMarcaId)}/lineas`, body: { nombre, marcaId: marcaIdValue }, headers: jsonHeaders },
        { url: `${BASE}/marcas/${encodeURIComponent(targetMarcaId)}/lineas`, body: { nombre, marca: marcaIdValue }, headers: jsonHeaders },
        { url: `${BASE}/marcas/${encodeURIComponent(targetMarcaId)}/lineas`, body: { nombre }, headers: jsonHeaders },
        (() => {
          const fd = new FormData();
          fd.append("nombre", nombre);
          fd.append("marcaId", String(targetMarcaId));
          return { url: `${BASE}/lineas/crear`, body: fd, headers: authHeader };
        })(),
        (() => {
          const fd = new FormData();
          fd.append("nombre", nombre);
          fd.append("marca", String(targetMarcaId));
          return { url: `${BASE}/lineas/crear`, body: fd, headers: authHeader };
        })(),
        (() => {
          const fd = new FormData();
          fd.append("nombre", nombre);
          fd.append("marca_id", String(targetMarcaId));
          return { url: `${BASE}/lineas/crear`, body: fd, headers: authHeader };
        })(),
        (() => {
          const fd = new FormData();
          fd.append("nombre", nombre);
          fd.append("idMarca", String(targetMarcaId));
          return { url: `${BASE}/lineas/crear`, body: fd, headers: authHeader };
        })(),
        { url: `${BASE}/lineas/crear/${encodeURIComponent(targetMarcaId)}`, body: { nombre }, headers: jsonHeaders },
      ];

      let created = null;
      let lastError = null;
      for (const attempt of attempts) {
        try {
          const opts = {
            method: "POST",
            headers: attempt.body instanceof FormData
              ? attempt.headers
              : { "Content-Type": "application/json", ...(attempt.headers || {}) },
            body: attempt.body instanceof FormData
              ? attempt.body
              : attempt.body != null
                ? JSON.stringify(attempt.body)
                : undefined,
          };
          const res = await fetch(attempt.url, opts);
          if (res.ok) {
            created = await res.json().catch(() => null);
            break;
          }
          const txt = await res.text().catch(() => null);
          lastError = txt || `HTTP ${res.status}`;
        } catch (err) {
          lastError = err?.message || String(err);
        }
      }
      if (!created) {
        throw new Error(lastError || "No se pudo crear la linea.");
      }

      const arr = await fetch(`${BASE}/listarColeLineas/lineas/marca/${encodeURIComponent(targetMarcaId)}`).then((r) => (r.ok ? r.json() : []));
      setMarcaId(String(targetMarcaId));
      setLineas(Array.isArray(arr) ? arr : []);
      setNewLinea({ nombre: "", marcaId: String(targetMarcaId) });
      setNewLineaError(null);
      showToast("Linea creada");
    } catch (e) {
      setNewLineaError(e?.message || String(e));
    } finally {
      setCreatingLinea(false);
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
      descuento: d?.descuento ?? d?.discount ?? "",
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
              <th className="px-3 py-3">Oferta</th>
              <th className="px-3 py-3">Stock</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-white/70">Cargando…</td>
              </tr>
            )}
            {!loading && pageItems.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-white/60">Sin resultados</td>
              </tr>
            )}
            {pageItems.map((r) => {
              const d = r.det || details.get(String(r.id));
              const st = Number(r.stock || 0);
              const status = st <= 0 ? { label: "Sin stock", class: "bg-red-500/20 text-red-300" }
                : st <= lowThreshold ? { label: "Bajo stock", class: "bg-yellow-500/20 text-yellow-300" }
                  : { label: "En stock", class: "bg-emerald-500/20 text-emerald-300" };
              const discount = d?.descuento ?? d?.discount ?? null;
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
                  <td className="px-3 py-2">{d?.marcaNombre ?? "-"}</td>
                  <td className="px-3 py-2">{d?.lineaNombre ?? "-"}</td>
                  <td className="px-3 py-2">
                    {discount != null && discount !== ''
                      ? <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-200">-{Number(discount)}%</span>
                      : <span className="text-white/50">—</span>}
                  </td>
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
                      <button title="Editar"
                        onClick={() => {
                          requestEdit(r.id);
                        }}
                        className="rounded bg-white/10 px-2 py-1 text-white hover:bg-white/20">✏️</button>
                      <button title="Borrar" disabled={busy} onClick={() => deleteColeccionable(r.id)}
                        className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-500 disabled:opacity-50">Borrar</button>
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
          <form onSubmit={handleCreateMarca} className="mb-4 space-y-3 rounded-lg border border-white/10 bg-black/40 p-3">
            <div>
              <label className="block text-xs uppercase tracking-wide text-white/60">Nombre de la marca *</label>
              <input
                type="text"
                value={newMarca.nombre}
                onChange={(e) => setNewMarca((s) => ({ ...s, nombre: e.target.value }))}
                required
                className="mt-1 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none"
                placeholder="Ej: Kaiju Series"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-white/60">Imágenes</label>
              <input
                key={newMarcaFileKey}
                ref={newMarcaFileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                multiple={false}
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                  setNewMarcaFile(file);
                  setNewMarcaPreview((prev) => {
                    if (prev) {
                      try { URL.revokeObjectURL(prev); } catch (_) { }
                    }
                    return file ? URL.createObjectURL(file) : null;
                  });
                }}
                className="sr-only"
              />
              <div className="mt-1 flex items-center gap-3 rounded-md border border-white/10 bg-black/60 p-2">
                <button
                  type="button"
                  onClick={() => newMarcaFileInputRef.current?.click()}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-black hover:bg-primary/90"
                >
                  Elegir archivo
                </button>
                <span className="text-sm text-white/80">
                  {newMarcaFile ? newMarcaFile.name : "Ningún archivo seleccionado"}
                </span>
              </div>
              <p className="mt-1 text-xs text-white/50">Formatos admitidos: JPG o PNG.</p>
              {newMarcaPreview && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-20 w-20 overflow-hidden rounded border border-white/10 bg-black/40">
                    <img src={newMarcaPreview} alt="preview marca" className="h-full w-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewMarcaFile(null);
                      setNewMarcaPreview((prev) => {
                        if (prev) {
                          try { URL.revokeObjectURL(prev); } catch (_) { }
                        }
                        return null;
                      });
                      setNewMarcaFileKey((k) => k + 1);
                      if (newMarcaFileInputRef.current) {
                        newMarcaFileInputRef.current.value = "";
                      }
                    }}
                    className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-500"
                  >
                    Quitar imagen
                  </button>
                </div>
              )}
            </div>
            {newMarcaError && <p className="text-sm text-red-400">{newMarcaError}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={creatingMarca} className="rounded bg-primary px-4 py-2 text-sm font-bold text-black hover:bg-primary/90 disabled:opacity-50">
                {creatingMarca ? "Creando..." : "Crear marca"}
              </button>
            </div>
          </form>
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
          <form onSubmit={handleCreateLinea} className="mb-4 space-y-3 rounded-lg border border-white/10 bg-black/40 p-3">
            <div>
              <label className="block text-xs uppercase tracking-wide text-white/60">Marca *</label>
              <select value={newLinea.marcaId || marcaId || ""} onChange={(e) => setNewLinea((s) => ({ ...s, marcaId: e.target.value }))} className="w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none">
                <option value="">Elegi una marca</option>
                {marcas.map((m) => (
                  <option key={m.id ?? m.marcaId} value={m.id ?? m.marcaId}>{m.nombre ?? m.name ?? m.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-white/60">Nombre de la linea *</label>
              <input value={newLinea.nombre} onChange={(e) => setNewLinea((s) => ({ ...s, nombre: e.target.value }))} className="mt-1 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none" />
            </div>
            {newLineaError && <p className="text-sm text-red-400">{newLineaError}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={creatingLinea} className="rounded bg-primary px-4 py-2 text-sm font-bold text-black hover:bg-primary/90 disabled:opacity-50">
                {creatingLinea ? "Creando..." : "Crear linea"}
              </button>
            </div>
          </form>
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
  const [promo, setPromo] = useState(null);
  const [promoLocal, setPromoLocal] = useState({
    tipo: "PERCENT",
    valor: "",
    inicio: "",
    fin: "",
    activa: true,
    prioridad: 0,
    stackable: false,
    scopeId: edit?.id ?? null,
  });
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoError, setPromoError] = useState(null);

  useEffect(() => {
    setLocal(edit);
    if (edit?.id) {
      setPromoLocal((prev) => ({ ...prev, scopeId: edit.id }));
    }
  }, [edit]);

  useEffect(() => {
    // revoke previews on unmount or when files change
    return () => {
      try { previews.forEach((u) => URL.revokeObjectURL(u)); } catch { }
    };
  }, [previews]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${base}/marcas`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((arr) => setMarcas(Array.isArray(arr) ? arr : []))
      .catch((e) => {
        // si el efecto se limpió (abort), ignoramos; solo log si es otro error
        if (e?.name !== 'AbortError') {
          console.warn('Error cargando marcas', e);
        }
      });
    return () => controller.abort();
  }, [base]);

  // cargar promo activa para este coleccionable
  useEffect(() => {
    if (!local?.id) return;
    setPromoLocal((prev) => ({ ...prev, scopeId: local.id }));
    const controller = new AbortController();
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    fetch(`${base}/promociones/activas?coleccionableId=${encodeURIComponent(local.id)}`, { signal: controller.signal, headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((arr) => {
        const list = Array.isArray(arr) ? arr : [];
        const found = list.find((p) => String(p?.scopeType).toUpperCase?.() === "ITEM" && String(p?.scopeId) === String(local.id));
        setPromo(found || null);
        if (found?.valor != null && String(found?.tipo).toUpperCase() === "PERCENT") {
          setLocal((s) => ({ ...s, descuento: found.valor }));
          setPromoLocal((prev) => ({
            ...prev,
            tipo: found?.tipo ?? "PERCENT",
            valor: found?.valor ?? "",
            activa: found?.activa ?? true,
            prioridad: found?.prioridad ?? 0,
            stackable: found?.stackable ?? false,
            inicio: found?.inicio ? String(found.inicio).replace(" ", "T").slice(0, 16) : "",
            fin: found?.fin ? String(found.fin).replace(" ", "T").slice(0, 16) : "",
          }));
        }
      })
      .catch(() => { });
    return () => controller.abort();
  }, [base, local.id, token]);

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
      console.log('Submitting edit for coleccionable:', promo?.id ?? local?.id ?? '(sin id)');
      const discountValue = local.descuento === '' ? null : Number(local.descuento);
      const scopeId = promoLocal.scopeId ?? local.id;
      const valorNum = promoLocal.valor === '' ? null : Number(promoLocal.valor);
      if (!scopeId) throw new Error('Falta scopeId para la promo');
      if (valorNum !== null && Number.isNaN(valorNum)) throw new Error('Valor de promo inválido');
      const payloadPOST = {
        tipo: promoLocal.tipo,
        valor: valorNum,
        scopeType: "ITEM",
        scopeId,
        inicio: promoLocal.inicio ? (new Date(promoLocal.inicio)).toISOString() : null,
        fin: promoLocal.fin ? (new Date(promoLocal.fin)).toISOString() : null,
        prioridad: promoLocal.prioridad,
        activa: promoLocal.activa,
        stackable: promoLocal.stackable,
      };
      /* Promocion nPromocion = new Promocion();
          nPromocion.setTipo(p.getTipo());
          nPromocion.setValor(p.getValor());
          nPromocion.setScopeType(p.getScopeType());
          nPromocion.setScopeId(p.getScopeId());
          nPromocion.setInicio(p.getInicio());
          nPromocion.setFin(p.getFin());
          nPromocion.setPrioridad(p.getPrioridad());
          nPromocion.setActiva(p.isActiva());
          nPromocion.setStackable(p.isStackable());
          repo.save(nPromocion); */
      const resPOST = await fetch(`${base}/promociones`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payloadPOST),
      });
      if (!resPOST.ok) {
        const txtPOST = await resPOST.text().catch(() => '');
        throw new Error(txtPOST || `HTTP ${resPOST.status}`);
      }
      const payload = {
        nombre: local.nombre?.trim(),
        descripcion: local.descripcion?.trim() || '',
        precio: local.precio === '' ? null : Number(local.precio),
        linea: local.lineaId ? Number(local.lineaId) : null,
        // no enviamos imagenes en el PUT; se manejan aparte
        imagenes: [],
      };


      const res = await fetch(`${base}/coleccionable/${encodeURIComponent(local.id)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      console.log('Edit res:', res);
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const json = await res.json().catch(() => null);
      let newImgUrl = null;


      const updated = {
        id: local.id,
        nombre: payload.nombre,
        precio: payload.precio,
        descuento: discountValue,
        discount: discountValue,
        lineaId: payload.linea,
        marcaId: local.marcaId,
        lineaNombre: lines.find((l) => String(l.id ?? l.lineaId) === String(local.lineaId))?.nombre ?? undefined,
        marcaNombre: marcas.find((m) => String(m.id ?? m.marcaId) === String(local.marcaId))?.nombre ?? undefined,
        descripcion: payload.descripcion,
        ...(newImgUrl ? { imagenUrl: newImgUrl } : {}),
      };
      console.log('Updated data:', updated);
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
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-xl rounded-lg border border-white/10 bg-black/80 p-5">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-primary">Editar coleccionable</h3>
          </div>

          {local.error && <p className="mb-3 text-sm text-red-400">{local.error}</p>}
          {promoError && <p className="mb-3 text-sm text-red-400">{promoError}</p>}

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
            <div>
              <label className="block text-xs text-white/70">Oferta</label>
              <div className="mt-1 flex items-center gap-3">
                <button type="button" onClick={() => { setPromoOpen(true); setPromoError(null); }} className="rounded bg-primary/20 px-3 py-2 text-xs font-semibold text-white hover:bg-primary/30">
                  Configurar oferta
                </button>
                {promoLocal.valor ? (
                  <div className="text-xs text-white/70">
                    <div>{promoLocal.tipo === 'PERCENT' ? `-${promoLocal.valor}%` : `$${promoLocal.valor}`}</div>
                    <div className="text-[11px] text-white/50">
                      {promoLocal.inicio ? `Inicio: ${promoLocal.inicio}` : 'Inicio: ahora'}{promoLocal.fin ? ` · Fin: ${promoLocal.fin}` : ' · Sin fin'}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-white/50">Sin oferta configurada</span>
                )}
              </div>
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
                      const allowed = ["image/jpeg", "image/png", "image/jpg"];
                      const selected = list.filter((f) => allowed.includes(f.type) || /\.(jpe?g|png)$/i.test(f.name));
                      try { previews.forEach((u) => URL.revokeObjectURL(u)); } catch { }
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

      {promoOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-lg border border-white/10 bg-black/90 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-lg font-bold text-primary">Oferta</h4>
              <button onClick={() => setPromoOpen(false)} className="text-white/70 hover:text-white text-sm">Cerrar</button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs text-white/70">Tipo</label>
                <select value={promoLocal.tipo} onChange={(e) => setPromoLocal({ ...promoLocal, tipo: e.target.value })} className="mt-1 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none">
                  <option value="PERCENT">% Descuento</option>
                  <option value="FIXED">Monto fijo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/70">Valor</label>
                <input type="number" step="0.01" value={promoLocal.valor} onChange={(e) => setPromoLocal({ ...promoLocal, valor: e.target.value })} className="mt-1 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-white/70">Inicio</label>
                <input type="datetime-local" value={promoLocal.inicio} onChange={(e) => setPromoLocal({ ...promoLocal, inicio: e.target.value })} className="mt-1 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-white/70">Fin</label>
                <input type="datetime-local" value={promoLocal.fin} onChange={(e) => setPromoLocal({ ...promoLocal, fin: e.target.value })} className="mt-1 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs text-white/70">
                  <input type="checkbox" checked={promoLocal.activa} onChange={(e) => setPromoLocal({ ...promoLocal, activa: e.target.checked })} />
                  Activa
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs text-white/70">
                  <input type="checkbox" checked={promoLocal.stackable} onChange={(e) => setPromoLocal({ ...promoLocal, stackable: e.target.checked })} />
                  Stackable
                </label>
              </div>
              <div>
                <label className="block text-xs text-white/70">Prioridad</label>
                <input type="number" value={promoLocal.prioridad} onChange={(e) => setPromoLocal({ ...promoLocal, prioridad: Number(e.target.value || 0) })} className="mt-1 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setPromoOpen(false)} className="rounded-md bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-500">Cerrar</button>
              <button
                onClick={() => {
                  if (!promoLocal.valor) { setPromoError('Completa el valor de la oferta'); return; }
                  setLocal((s) => ({ ...s, descuento: promoLocal.valor }));
                  setPromoError(null);
                  setPromoOpen(false);
                }}
                className="rounded-md bg-primary px-3 py-2 text-sm font-bold text-black hover:bg-primary/90"
              >
                Guardar oferta
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
