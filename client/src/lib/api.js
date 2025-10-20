// If VITE_API_URL is not set, use Vite dev proxy under /api
const BASE = import.meta.env.VITE_API_URL ?? '/api';

export function getBaseUrl() {
  return BASE;
}

export async function getMarcas(signal) {
  const res = await fetch(`${BASE}/marcas`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getMarcaFirstImageUrl(marcaId, signal) {
  try {
    const res = await fetch(`${BASE}/marcasImages/${marcaId}/imagenes/primera`, { signal });
    if (!res.ok) throw new Error('no-image');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (e) {
    return 'https://placehold.co/800x600/png?text=Marca';
  }
}

export async function getLineasByMarca(marcaId, signal) {
  // Endpoint principal visto en tu backend
  try {
    const res = await fetch(`${BASE}/listarColeLineas/lineas/marca/${marcaId}`, { signal });
    if (res.ok) {
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    }
  } catch (_) {
    // continuar con intento alternativo
  }
  // Alternativa por querystring si cambian rutas
  try {
    const res = await fetch(`${BASE}/lineas?marcaId=${encodeURIComponent(marcaId)}`, { signal });
    if (res.ok) {
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    }
  } catch (_) {}
  return [];
}

// Obtiene coleccionables con filtros opcionales de marca y línea.
// Prioriza los endpoints listados en tu backend (listarColeLineas + catálogo).
export async function getColeccionables({ marcaId = null, lineaId = null } = {}, signal) {
  const isAll = !marcaId && !lineaId;
  const paths = [];
  if (lineaId) {
    paths.push(`${BASE}/listarColeLineas/coleccionables/linea/${encodeURIComponent(lineaId)}`);
  } else if (marcaId) {
    paths.push(`${BASE}/listarColeLineas/coleccionables/marca/${encodeURIComponent(marcaId)}`);
  }
  // Sin filtros, o como fallback, usamos catálogo completo
  if (isAll) paths.push(`${BASE}/catalogo`);

  let lastStatus = 0;
  for (const p of paths) {
    try {
      const res = await fetch(p, { signal });
      lastStatus = res.status;
      if (res.ok) {
        const json = await res.json();
        let arr = Array.isArray(json) ? json : null;
        if (!arr && json && typeof json === 'object') {
          const candidates = [json.content, json.items, json.data, json.lista, json.catalogo, json.results, json.rows, json.values];
          for (const c of candidates) {
            if (Array.isArray(c)) { arr = c; break; }
          }
          if (!arr) {
            try { arr = Object.values(json); } catch (_) {}
          }
        }
        if (!Array.isArray(arr)) arr = [];
        return arr.map((raw) => {
          const it = raw?.coleccionable ?? raw; // si viene desde /catalogo podría venir envuelto
          return {
            id: it?.id ?? it?._id ?? it?.coleccionableId ?? it?.coleccionableID ?? crypto.randomUUID?.() ?? String(Math.random()),
            nombre: it?.nombre ?? it?.name ?? it?.title ?? 'Coleccionable',
            descripcion: it?.descripcion ?? it?.description ?? '',
            precio: it?.precio ?? it?.price ?? it?.precioActual ?? null,
            precioAnterior: it?.precioAnterior ?? it?.listPrice ?? it?.precioLista ?? null,
            imagen: it?.imagen ?? it?.imageUrl ?? it?.image ?? null,
            lineaId:
              it?.linea_id ?? it?.lineaId ?? it?.lineaID ??
              (typeof it?.linea === 'object' ? it?.linea?.id : it?.linea) ?? null,
            marcaId:
              it?.marca_id ?? it?.marcaId ?? it?.marcaID ??
              (typeof it?.marca === 'object' ? it?.marca?.id : it?.marca) ?? null,
          };
        });
      }
    } catch (_) {
      // continuar probando siguiente path
    }
  }

  // Fallback: sin permisos para /catalogo (403) o no existe.
  // Agregamos por marca para construir el total sin autenticación.
  if (isAll) {
    try {
      const marcas = await getMarcas?.(signal);
      const list = Array.isArray(marcas) ? marcas : [];
      const ids = list
        .map((m) => m?.id ?? m?._id ?? m?.marcaId ?? m?.marcaID)
        .filter(Boolean);
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(`${BASE}/listarColeLineas/coleccionables/marca/${encodeURIComponent(id)}`, { signal });
            if (!res.ok) return [];
            const json = await res.json();
            return Array.isArray(json) ? json : [];
          } catch (_) {
            return [];
          }
        })
      );
      const flat = results.flat();
      const map = new Map();
      for (const raw of flat) {
        const it = raw?.coleccionable ?? raw;
        const key = it?.id ?? it?._id ?? it?.coleccionableId ?? it?.coleccionableID;
        if (map.has(key)) continue;
        map.set(key, {
          id: key ?? crypto.randomUUID?.() ?? String(Math.random()),
          nombre: it?.nombre ?? it?.name ?? 'Coleccionable',
          descripcion: it?.descripcion ?? it?.description ?? '',
          precio: it?.precio ?? it?.price ?? null,
          precioAnterior: it?.precioAnterior ?? it?.listPrice ?? null,
          imagen: it?.imagen ?? it?.imageUrl ?? it?.image ?? null,
          lineaId: it?.linea_id ?? it?.lineaId ?? (typeof it?.linea === 'object' ? it?.linea?.id : it?.linea) ?? null,
          marcaId: it?.marca_id ?? it?.marcaId ?? (typeof it?.marca === 'object' ? it?.marca?.id : it?.marca) ?? null,
        });
      }
      return Array.from(map.values());
    } catch (_) {}
  }

  return [];
}

export async function getColeccionableFirstImageUrl(coleccionableId, signal) {
  try {
    const res = await fetch(`${BASE}/coleccionable/${coleccionableId}/imagenes/0`, { signal });
    if (!res.ok) throw new Error('no-image');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (_) {
    return 'https://placehold.co/800x600/png?text=Coleccionable';
  }
}
