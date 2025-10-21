import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ColeccionablesGrid from '../components/ColeccionablesGrid';
import { getBaseUrl, getMarcas, getLineasByMarca, getColeccionables, getColeccionableFirstImageUrl, getColeccionableDetalle, addToWishlist } from '../lib/api';

const SORTS = [
  { id: 'alpha-desc', label: 'Alfabético Z→A' }, // default
  { id: 'alpha-asc', label: 'Alfabético A→Z' },
  { id: 'price-desc', label: 'Precio: mayor a menor' },
  { id: 'price-asc', label: 'Precio: menor a mayor' },
];

export default function ColeccionablesView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMarca = searchParams.get('marcaId');
  const initialLinea = searchParams.get('lineaId');
  const initialSort = searchParams.get('sort') || 'alpha-desc';

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

  // Load lineas when marca changes
  useEffect(() => {
    setLineas([]);
    setLineaId('');
    if (!marcaId) return;
    const controller = new AbortController();
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
    setSearchParams(next, { replace: true });
  }, [marcaId, lineaId, sort, setSearchParams]);

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
        const data = await getColeccionables({ marcaId: marcaId || null, lineaId: lineaId || null }, controller.signal);
        // Completar precio/imágenes si faltan
        const completed = await Promise.all(
          data.map(async (it) => {
            let enriched = it;
            if (enriched?.precio == null) {
              try {
                const det = await getColeccionableDetalle(it.id, controller.signal);
                enriched = {
                  ...enriched,
                  precio: det?.precio ?? enriched?.precio ?? null,
                  descripcion: enriched?.descripcion || det?.descripcion || '',
                };
              } catch (_) {}
            }
            if (!enriched.imagen) {
              try {
                const url = await getColeccionableFirstImageUrl(it.id, controller.signal);
                if (url.startsWith('blob:')) revoked.push(url);
                enriched = { ...enriched, imagen: url };
              } catch (_) {}
            }
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

  const sortedItems = useMemo(() => {
    const arr = [...items];
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
  }, [items, sort]);

  const handleAddToWishlist = async ({ id, nombre }) => {
    try {
      const ok = await addToWishlist(id);
      if (!ok) console.warn('No se pudo agregar a la wishlist');
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
          items={sortedItems}
          onAddToWishlist={handleAddToWishlist}
        />
      )}
    </div>
  );
}
