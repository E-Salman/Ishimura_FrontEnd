import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ColeccionablesGrid from '../components/ColeccionablesGrid';
import { getBaseUrl, getMarcas, getLineasByMarca, getColeccionables, getColeccionableFirstImageUrl, getColeccionableDetalle, addToWishlist, getPricePreview, addToCart, getWishlist, removeFromWishlist } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const SORTS = [
  { id: 'alpha-desc', label: 'Alfabético Z→A' }, // default
  { id: 'alpha-asc', label: 'Alfabético A→Z' },
  { id: 'price-desc', label: 'Precio: mayor a menor' },
  { id: 'price-asc', label: 'Precio: menor a mayor' },
];

export default function ColeccionablesView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMarca = searchParams.get('marcaId');
  const initialLinea = searchParams.get('lineaId');
  const initialSort = searchParams.get('sort') || 'alpha-desc';
  const initialQ = searchParams.get('q') || '';

  const [marcas, setMarcas] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [marcaId, setMarcaId] = useState(initialMarca || '');
  const [lineaId, setLineaId] = useState(initialLinea || '');
  const [sort, setSort] = useState(initialSort);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);
  const [marcaOpen, setMarcaOpen] = useState(false);
  const marcaRef = useRef(null);
  const [lineOpen, setLineOpen] = useState(false);
  const lineRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState(initialQ);
  const [wishlist, setWishlist] = useState([]);
  const { token } = useAuth();
  useEffect(() => { setQ(searchParams.get('q') || ''); }, [searchParams]);

  // Load marcas at start
  useEffect(() => {
    const controller = new AbortController();
    getMarcas(controller.signal)
      .then((json) => {
        const mapped = (Array.isArray(json) ? json : []).map((m) => ({
          id: m?.id ?? m?._id ?? m?.marcaId ?? m?.marcaID ?? String(Math.random()),
          nombre: m?.name ?? m?.nombre ?? m?.title ?? 'Marca',
        }));
        setMarcas(mapped);
      })
      .catch(() => {})
      .finally(() => {});
    return () => controller.abort();
  }, []);

  // Load wishlist once
  useEffect(() => {
    const controller = new AbortController();
    async function loadWishlist() {
      try {
        const data = await getWishlist(controller.signal);
        const list = Array.isArray(data) ? data : [];
        setWishlist(list);
      } catch (_) {
        // ignorar errores de wishlist para no romper la UX
      }
    }
    loadWishlist();
    return () => controller.abort();
  }, []);

  // Load lineas when marca changes
  useEffect(() => {
    setLineas([]);
    if (!initialLinea) setLineaId('');
    if (!marcaId) return;
    const controller = new AbortController();
    const BASE = getBaseUrl();
    getLineasByMarca(marcaId, controller.signal)
      .then((arr) => {
        const mapped = (Array.isArray(arr) ? arr : []).map((l) => ({
          id: l?.id ?? l?.lineaId ?? l?._id ?? String(Math.random()),
          nombre: l?.nombre ?? l?.name ?? l?.titulo ?? 'Línea',
        }));
        setLineas(mapped);
      })
      .catch(() => setLineas([]));
    return () => controller.abort();
  }, [marcaId]);

  // Update URL params when filters change
  useEffect(() => {
    const next = {};
    if (marcaId) next.marcaId = marcaId;
    if (lineaId) next.lineaId = lineaId;
    if (sort && sort !== 'alpha-desc') next.sort = sort;
    if (q) next.q = q;
    setSearchParams(next, { replace: true });
  }, [marcaId, lineaId, sort, q, setSearchParams]);

  // Close sort dropdown on outside click / Escape
  useEffect(() => {
    if (!sortOpen) return;
    function onPointerDown(e) {
      const el = sortRef.current;
      if (el && !el.contains(e.target)) setSortOpen(false);
    }
    function onKey(e) { if (e.key === 'Escape') setSortOpen(false); }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [sortOpen]);

  // Close marca dropdown on outside click / Escape
  useEffect(() => {
    if (!marcaOpen) return;
    function onPointerDown(e) {
      const el = marcaRef.current;
      if (el && !el.contains(e.target)) setMarcaOpen(false);
    }
    function onKey(e) { if (e.key === 'Escape') setMarcaOpen(false); }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [marcaOpen]);

  // Close linea dropdown on outside click / Escape
  useEffect(() => {
    if (!lineOpen) return;
    function onPointerDown(e) {
      const el = lineRef.current;
      if (el && !el.contains(e.target)) setLineOpen(false);
    }
    function onKey(e) { if (e.key === 'Escape') setLineOpen(false); }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [lineOpen]);

  // Load items according to filters
  useEffect(() => {
    const controller = new AbortController();
    let revoked = [];
    async function load() {
      try {
        setLoading(true);
        setError(null);
        let data = await getColeccionables({ marcaId: marcaId || null, lineaId: lineaId || null }, controller.signal);
        // Prefetch stocks map en un solo request si es posible
        const BASE = getBaseUrl();
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
          const resMap = await fetch(`${BASE}/catalogo`, { signal: controller.signal, headers });
          if (resMap.ok) {
            const arr = await resMap.json();
            const stockMap = new Map();
            (Array.isArray(arr) ? arr : []).forEach((row) => {
              const id = row?.coleccionableId ?? row?.id ?? row?.coleccionableID;
              if (id != null) stockMap.set(String(id), Number(row?.stock ?? 0));
            });
            data = data.map((it) => ({ ...it, stock: stockMap.get(String(it.id)) ?? it.stock }));
          }
        } catch (_) {}
        // Completar precio con preview (promos) + detalle/imágenes si faltan
        const completed = await Promise.all(
          data.map(async (it) => {
            let enriched = { ...it };
            // Intentar obtener preview de precio (detecta promo)
            try {
              const q = await getPricePreview(it.id, { qty: 1 }, controller.signal);
              const lista = Number(q?.precioLista ?? q?.lista ?? enriched?.precio ?? 0);
              const efectivo = Number(q?.precioEfectivo ?? q?.efectivo ?? enriched?.precio ?? 0);
              const hasPromo = (Number(q?.discount ?? 0) > 0) || (efectivo > 0 && lista > 0 && efectivo < lista) || Boolean(q?.promocionId);
              if (hasPromo) {
                enriched.precio = efectivo || enriched.precio || null;
                enriched.precioAnterior = (lista && efectivo && efectivo < lista) ? lista : (enriched.precioAnterior ?? null);
              }
            } catch (_) {}

            // Completar precio desde detalle si sigue faltando
            if (enriched?.precio == null) {
              try {
                const det = await getColeccionableDetalle(it.id, controller.signal);
                enriched.precio = det?.precio ?? enriched?.precio ?? null;
                if (!enriched.descripcion) enriched.descripcion = det?.descripcion || '';
              } catch (_) {}
            }

            // Completar imagen
            if (!enriched.imagen) {
              try {
                const url = await getColeccionableFirstImageUrl(it.id, controller.signal);
                if (url.startsWith('blob:')) revoked.push(url);
                enriched.imagen = url;
              } catch (_) {}
            }
            // Obtener stock por item (autoritativo)
            try {
              const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
              const resS = await fetch(`${BASE}/catalogo/${encodeURIComponent(it.id)}`, { signal: controller.signal, headers });
              if (resS.ok) {
                const dto = await resS.json();
                enriched.stock = Number(dto?.stock ?? dto?.cantidad ?? 0);
              }
            } catch (_) {}
            return enriched;
          })
        );
        setItems(completed);
      } catch (e) {
        if (e?.name !== 'AbortError') setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      controller.abort();
      for (const u of revoked) URL.revokeObjectURL(u);
    };
  }, [marcaId, lineaId]);

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''); }
  function levenshtein(a, b) {
    a = norm(a); b = norm(b);
    const m = a.length, n = b.length;
    if (m === 0) return n; if (n === 0) return m;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      const ca = a.charCodeAt(i - 1);
      for (let j = 1; j <= n; j++) {
        const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
        dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost);
      }
    }
    return dp[m][n];
  }
  function similarity(a, b) {
    const A = norm(a), B = norm(b);
    if (!A || !B) return 0;
    const dist = levenshtein(A, B);
    const maxLen = Math.max(A.length, B.length) || 1;
    return 1 - dist / maxLen;
  }

  const filteredItems = useMemo(() => {
    if (!q) return [...items];
    const term = q;
    return items.filter((it) => similarity(it?.nombre || '', term) >= 0.75 || norm(it?.nombre).includes(norm(term)));
  }, [items, q]);

  const sortedItems = useMemo(() => {
    const arr = [...filteredItems];
    const byName = (a, b) => (a?.nombre || '').localeCompare(b?.nombre || '', 'es', { sensitivity: 'base' });
    const price = (v) => (v == null || Number.isNaN(Number(v)) ? Number.POSITIVE_INFINITY : Number(v));
    switch (sort) {
      case 'alpha-asc':
        return arr.sort(byName);
      case 'price-asc':
        return arr.sort((a, b) => price(a.precio) - price(b.precio));
      case 'price-desc':
        return arr.sort((a, b) => price(b.precio) - price(a.precio));
      case 'alpha-desc':
      default:
        return arr.sort((a, b) => byName(b, a));
    }
  }, [filteredItems, sort]);

  const wishlistIdSet = useMemo(
    () => new Set(wishlist.map((w) => String(w.coleccionableId))),
    [wishlist]
  );

  const handleAddToWishlist = async ({ id }) => {
    try {
      const ok = await addToWishlist(token, id);
      if (ok) {
        try {
          const data = await getWishlist(token);
          const list = Array.isArray(data) ? data : [];
          setWishlist(list);
        } catch (_) {}
      } else {
        console.warn('No se pudo agregar a la wishlist');
      }
    } catch (e) {
      console.warn('Wishlist error', e);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-black text-primary">Coleccionables</h1>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="md:col-span-2" ref={marcaRef}>
          <label className="mb-2 block text-sm font-medium text-white/80">Marca</label>
          <button
            type="button"
            onClick={() => setMarcaOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none"
            aria-haspopup="listbox"
            aria-expanded={marcaOpen}
          >
            <span>
              {marcaId ? (marcas.find((m) => String(m.id) === String(marcaId))?.nombre ?? 'Marca') : 'Todas las marcas'}
            </span>
            <span className={`material-symbols-outlined transition-transform ${marcaOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </button>
          {marcaOpen && (
            <div className="relative">
              <div className="dropdown-enter absolute left-0 right-0 z-50 mt-2 rounded-lg bg-black/80 p-2 shadow-lg ring-1 ring-white/10 backdrop-blur-sm">
                <div role="listbox" aria-label="Marca" className="flex max-h-60 flex-col overflow-auto">
                  <button
                    type="button"
                    className="w-full bg-transparent px-3 py-2 text-left text-primary hover:bg-transparent"
                    onClick={() => { setMarcaId(''); setMarcaOpen(false); }}
                    role="option"
                    aria-selected={!marcaId}
                  >
                    Todas las marcas
                  </button>
                  {marcas.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      className={`w-full bg-transparent px-3 py-2 text-left text-primary hover:bg-transparent ${String(m.id) === String(marcaId) ? 'font-bold' : ''}`}
                      onClick={() => { setMarcaId(String(m.id)); setMarcaOpen(false); }}
                      role="option"
                      aria-selected={String(m.id) === String(marcaId)}
                    >
                      {m.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-1" ref={lineRef}>
          <label className="mb-2 block text-sm font-medium text-white/80">Línea</label>
          <button
            type="button"
            onClick={() => marcaId && setLineOpen((v) => !v)}
            disabled={!marcaId}
            className="flex w-full items-center justify-between rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white disabled:opacity-50 focus:border-primary/50 focus:outline-none"
            aria-haspopup="listbox"
            aria-expanded={lineOpen}
          >
            <span>
              {lineaId
                ? (lineas.find((l) => String(l.id) === String(lineaId))?.nombre ?? 'Línea')
                : 'Todas'}
            </span>
            <span className={`material-symbols-outlined transition-transform ${lineOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </button>
          {lineOpen && (
            <div className="relative">
              <div className="dropdown-enter absolute left-0 right-0 z-50 mt-2 rounded-lg bg-black/80 p-2 shadow-lg ring-1 ring-white/10 backdrop-blur-sm">
                <div role="listbox" aria-label="Línea" className="flex max-h-60 flex-col overflow-auto">
                  <button
                    type="button"
                    className="w-full bg-transparent px-3 py-2 text-left text-primary hover:bg-transparent"
                    onClick={() => { setLineaId(''); setLineOpen(false); }}
                    role="option"
                    aria-selected={!lineaId}
                  >
                    Todas
                  </button>
                  {lineas.map((l) => (
                    <button
                      type="button"
                      key={l.id}
                      className={`w-full bg-transparent px-3 py-2 text-left text-primary hover:bg-transparent ${String(l.id) === String(lineaId) ? 'font-bold' : ''}`}
                      onClick={() => { setLineaId(String(l.id)); setLineOpen(false); }}
                      role="option"
                      aria-selected={String(l.id) === String(lineaId)}
                    >
                      {l.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-1" ref={sortRef}>
          <label className="mb-2 block text-sm font-medium text-white/80">Ordenar por</label>
          <button
            type="button"
            onClick={() => setSortOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white focus:border-primary/50 focus:outline-none"
            aria-haspopup="listbox"
            aria-expanded={sortOpen}
          >
            <span>{SORTS.find((s) => s.id === sort)?.label ?? 'Alfabético Z→A'}</span>
            <span className={`material-symbols-outlined transition-transform ${sortOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </button>
          {sortOpen && (
            <div className="relative">
              <div className="dropdown-enter absolute left-0 right-0 z-50 mt-2 rounded-lg bg-black/80 p-2 shadow-lg ring-1 ring-white/10 backdrop-blur-sm">
                <div role="listbox" aria-label="Ordenar por" className="flex max-h-60 flex-col overflow-auto">
                  {SORTS.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      className={`w-full bg-transparent px-3 py-2 text-left text-primary hover:bg-transparent ${s.id === sort ? 'font-bold' : ''}`}
                      onClick={() => { setSort(s.id); setSortOpen(false); }}
                      role="option"
                      aria-selected={s.id === sort}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-400">Error al cargar coleccionables: {error}</p>
      )}
      {loading && (
        <p className="mb-4 text-sm text-white/60">Cargando…</p>
      )}

      {!loading && (
        <ColeccionablesGrid
          items={sortedItems.map((it) => ({
            ...it,
            inWishlist: wishlistIdSet.has(String(it.id)),
          }))}
          onAddToWishlist={handleAddToWishlist}
          onAddToCart={async ({ id }) => {            
            const row = wishlist.find(
              (w) => String(w.coleccionableId) === String(id)
            );
            try {
              await addToCart(token, id, { cantidad: 1 });
            } catch (e) {
              console.warn('Cart error', e);
              const msg = String(e?.message || '');
              // Si no hay token, no tocamos la wishlist
              if (msg.includes('No auth token')) {
                return;
              }
            }
            if (row) {
              try {
                await removeFromWishlist(token, row.id);
              } catch (_) {}
              setWishlist((prev) => prev.filter((w) => w.id !== row.id));
            }
          }}
          addToCartText="Agregar al carrito"
          onItemClick={(it) => navigate(`/coleccionable/${it.id ?? it._id}`)}
        />
      )}
    </div>
  );
}
