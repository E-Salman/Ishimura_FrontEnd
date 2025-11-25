import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ColeccionablesGrid from '../components/ColeccionablesGrid';
import { useDispatch, useSelector } from 'react-redux';
import { addCartItem } from '../redux/cartSlice';
import { addToWishlist, fetchWishlist, removeFromWishlist } from '../redux/wishlistSlice';
import {
  fetchMarcas as fetchMarcasCat,
  fetchLineasByMarca as fetchLineasCat,
  fetchColeccionables as fetchColeccionablesCat,
  fetchDetalle,
  fetchPricePreview,
  fetchFirstImage,
  selectColeccionables,
  selectColeccionablesError,
  selectColeccionablesStatus,
  selectLineasByMarcaCat,
  selectMarcasCat,
} from '../redux/coleccionablesSlice';

const SORTS = [
  { id: 'alpha-desc', label: 'Alfabetico Z-A' }, // default
  { id: 'alpha-asc', label: 'Alfabetico A-Z' },
  { id: 'price-desc', label: 'Precio: mayor a menor' },
  { id: 'price-asc', label: 'Precio: menor a mayor' },
];

export default function ColeccionablesView() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMarca = searchParams.get('marcaId');
  const initialLinea = searchParams.get('lineaId');
  const initialSort = searchParams.get('sort') || 'alpha-desc';
  const initialQ = searchParams.get('q') || '';

  const [marcaId, setMarcaId] = useState(initialMarca || '');
  const [lineaId, setLineaId] = useState(initialLinea || '');
  const marcas = useSelector(selectMarcasCat);
  const lineas = useSelector((state) => selectLineasByMarcaCat(state, marcaId || ""));
  const [sort, setSort] = useState(initialSort);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);
  const [marcaOpen, setMarcaOpen] = useState(false);
  const marcaRef = useRef(null);
  const [lineOpen, setLineOpen] = useState(false);
  const lineRef = useRef(null);

  const itemsStore = useSelector(selectColeccionables);
  const loadingStatus = useSelector(selectColeccionablesStatus);
  const error = useSelector(selectColeccionablesError);
  const [q, setQ] = useState(initialQ);
  const { items: wishlistItems = [] } = useSelector((state) => state.wishlist);
  const detallesById = useSelector((state) => state.coleccionables.detallesById || {});
  const previewsById = useSelector((state) => state.coleccionables.previewsById || {});
  const token = useSelector((state) => state.login.token)
  const requestedRef = useRef({ detail: new Set(), preview: new Set(), image: new Set() });
  useEffect(() => { setQ(searchParams.get('q') || ''); }, [searchParams]);

  // Load marcas at start
  useEffect(() => {
    dispatch(fetchMarcasCat());
  }, [dispatch]);

  // Load wishlist once
  useEffect(() => {
    async function loadWishlist() {
      if (!token) return;
      dispatch(fetchWishlist());
    }
    loadWishlist();
  }, [token, dispatch]);

  // Load lineas when marca changes
  useEffect(() => {
    if (!initialLinea) setLineaId('');
    if (!marcaId) return;
    dispatch(fetchLineasCat({ marcaId }));
  }, [dispatch, marcaId, initialLinea]);

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

  // Load items according to filters (servidor filtra por marca/línea)
  useEffect(() => {
    dispatch(fetchColeccionablesCat({ marcaId: marcaId || null, lineaId: lineaId || null, token }));
  }, [dispatch, marcaId, lineaId, token]);

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

  const enrichedItems = useMemo(() => {
    return (itemsStore || []).map((it) => {
      const det = detallesById[it.id] || {};
      const preview = previewsById[it.id] || null;
      const lista = Number(preview?.precioLista ?? preview?.lista ?? det?.precioAnterior ?? it?.precioAnterior ?? NaN);
      const efectivo = Number(preview?.precioEfectivo ?? preview?.efectivo ?? det?.precio ?? it?.precio ?? NaN);
      let precio = it.precio ?? det.precio ?? null;
      let precioAnterior = it.precioAnterior ?? det.precioAnterior ?? null;
      if (!Number.isNaN(efectivo) && efectivo != null) {
        precio = efectivo;
      }
      if (!Number.isNaN(lista) && lista && (precio == null || precio < lista)) {
        precioAnterior = lista;
      }
      return {
        ...it,
        descripcion: it.descripcion ?? det.descripcion ?? '',
        precio,
        precioAnterior,
        imagen: det.imagenUrl ?? it.imagen ?? null,
      };
    });
  }, [itemsStore, detallesById, previewsById]);

  const filteredItems = useMemo(() => {
    const term = q;
    return enrichedItems.filter((it) => {
      const det = detallesById[it.id];
      const marcaVal =
        det?.marcaId ??
        det?.marca_id ??
        det?.marcaID ??
        det?.marca?.id ??
        it?.marcaId ??
        it?.marca_id ??
        it?.marcaID ??
        it?.marca?.id ??
        null;
      const lineaVal =
        det?.lineaId ??
        det?.linea_id ??
        det?.lineaID ??
        det?.linea?.id ??
        it?.lineaId ??
        it?.linea_id ??
        it?.lineaID ??
        it?.linea?.id ??
        null;

      if (marcaId && marcaVal != null && String(marcaVal ?? '') !== String(marcaId)) return false;
      if (lineaId && lineaVal != null && String(lineaVal ?? '') !== String(lineaId)) return false;

      if (!term) return true;
      return similarity(it?.nombre || '', term) >= 0.75 || norm(it?.nombre).includes(norm(term));
    });
  }, [enrichedItems, detallesById, marcaId, lineaId, q]);

  // Enriquecer solo los ítems visibles con precios/detalle/imagen de forma acotada
  useEffect(() => {
    const MAX_BATCH = 6;
    const pendingDetalles = [];
    const pendingPreviews = [];
    const pendingImages = [];

    const sourceItems = (marcaId || lineaId) ? (itemsStore || []) : filteredItems;

    sourceItems.forEach((it) => {
      const det = detallesById[it.id];
      if (!det && !requestedRef.current.detail.has(it.id)) {
        pendingDetalles.push(it.id);
      }
      if (!previewsById[it.id] && !requestedRef.current.preview.has(it.id)) {
        pendingPreviews.push(it.id);
      }
      const hasImage = det?.imagenUrl;
      const triedImage = det?.firstImageTried;
      if (!hasImage && !triedImage && it.firstImageId != null && !requestedRef.current.image.has(it.id)) {
        pendingImages.push(it.id);
      }
    });

    pendingDetalles.slice(0, MAX_BATCH).forEach((id) => {
      requestedRef.current.detail.add(id);
      dispatch(fetchDetalle({ id, token }));
    });
    pendingPreviews.slice(0, MAX_BATCH).forEach((id) => {
      requestedRef.current.preview.add(id);
      dispatch(fetchPricePreview({ id, qty: 1 }));
    });
    pendingImages.slice(0, MAX_BATCH).forEach((id) => {
      requestedRef.current.image.add(id);
      dispatch(fetchFirstImage({ id, token }));
    });
  }, [dispatch, filteredItems, itemsStore, detallesById, previewsById, token, marcaId, lineaId]);

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
    () => new Set((wishlistItems || []).map((w) => String(w.coleccionableId))),
    [wishlistItems]
  );

  const handleAddToWishlist = async ({ id }) => {
    try {
      await dispatch(addToWishlist({ coleccionableId: id })).unwrap();
      await dispatch(fetchWishlist());
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
      {loadingStatus === 'loading' && (
        <p className="mb-4 text-sm text-white/60">Cargando…</p>
      )}

      {loadingStatus !== 'loading' && (
        <ColeccionablesGrid
          items={sortedItems.map((it) => ({
            ...it,
            inWishlist: wishlistIdSet.has(String(it.id)),
          }))}
          onAddToWishlist={handleAddToWishlist}
          onAddToCart={async ({ id }) => {            
            const row = wishlistItems.find(
              (w) => String(w.coleccionableId) === String(id)
            );
            try {
              await dispatch(addCartItem({ coleccionableId: id, cantidad: 1 })).unwrap();
            } catch (e) {
              console.warn('Cart error', e);
              return;
            }
            if (row) {
              try {
                await dispatch(removeFromWishlist({ itemId: row.id })).unwrap();
              } catch (_) {}
            }
          }}
          addToCartText="Agregar al carrito"
          onItemClick={(it) => navigate(`/coleccionable/${it.id ?? it._id}`)}
        />
      )}
    </div>
  );
}
