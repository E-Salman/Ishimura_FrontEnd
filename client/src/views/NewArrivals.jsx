import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ColeccionablesGrid from '../components/ColeccionablesGrid';
import { getNewArrivals, getColeccionableFirstImageUrl, getColeccionableDetalle, addToWishlist, getPricePreview } from '../lib/api';


// cambiar tema de que agarramos el new arrival por id

export default function NewArrivals() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let revoked = [];
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const arr = await getNewArrivals({ limit: 12 }, controller.signal);
        const enriched = await Promise.all(
          arr.map(async (it) => {
            let acc = { ...it };
            // Intentar preview de precio para detectar promos
            try {
              const q = await getPricePreview(it.id, { qty: 1 }, controller.signal);
              const lista = Number(q?.precioLista ?? q?.lista ?? acc?.precio ?? 0);
              const efectivo = Number(q?.precioEfectivo ?? q?.efectivo ?? acc?.precio ?? 0);
              const hasPromo = (Number(q?.discount ?? 0) > 0) || (efectivo > 0 && lista > 0 && efectivo < lista) || Boolean(q?.promocionId);
              if (hasPromo) {
                acc.precio = efectivo || acc.precio || null;
                acc.precioAnterior = (lista && efectivo && efectivo < lista) ? lista : (acc.precioAnterior ?? null);
              }
            } catch (_) {}

            // Completar precio/descripcion si faltan
            if (acc?.precio == null) {
              try {
                const det = await getColeccionableDetalle(it.id, controller.signal);
                acc.precio = det?.precio ?? acc?.precio ?? null;
                if (!acc.descripcion) acc.descripcion = det?.descripcion || '';
              } catch (_) {}
            }
            // Completar imagen si falta
            if (!acc.imagen) {
              try {
                const url = await getColeccionableFirstImageUrl(it.id, controller.signal);
                if (url.startsWith('blob:')) revoked.push(url);
                acc.imagen = url;
              } catch (_) {}
            }
            return acc;
          })
        );
        setItems(enriched);
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
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight text-primary sm:text-5xl md:text-6xl">Nuevo</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">¡¡¡Explora los ultimos producctos que llegaron a Ishimura!!!</p>
      </div>

      {error && <p className="mt-8 text-center text-sm text-red-400">Error al cargar novedades: {error}</p>}
      {loading && <p className="mt-8 text-center text-sm text-white/60">Cargando…</p>}

      {!loading && (
        <div className="mt-12">
          <ColeccionablesGrid
            items={items}
            onAddToWishlist={async ({ id }) => {
              try { await addToWishlist(id); } catch (_) {}
            }}
            onItemClick={(it) => navigate(`/coleccionable/${it.id ?? it._id}`)}
          />
        </div>
      )}
    </div>
  );
}
