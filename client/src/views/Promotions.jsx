import { useEffect, useState } from 'react';
import ColeccionablesGrid from '../components/ColeccionablesGrid';
import { getColeccionables, getPricePreview, getColeccionableFirstImageUrl, getColeccionableDetalle, addToWishlist } from '../lib/api';

export default function Promotions() {
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

        // 1) Traer todos los coleccionables (sin filtros)
        const all = await getColeccionables({}, controller.signal);

        // 2) Para cada uno, obtener el pricing preview y filtrar los que tienen descuento/promoción
        const result = [];
        for (const it of all) {
          try {
            const quote = await getPricePreview(it.id, { qty: 1 }, controller.signal);
            const lista = Number(quote?.precioLista ?? quote?.lista ?? it?.precio ?? 0);
            const efectivo = Number(quote?.precioEfectivo ?? quote?.efectivo ?? it?.precio ?? 0);
            const hasPromo = (Number(quote?.discount ?? 0) > 0) || (efectivo > 0 && lista > 0 && efectivo < lista) || Boolean(quote?.promocionId);
            if (!hasPromo) continue;
            result.push({
              ...it,
              precio: efectivo || it.precio || null,
              precioAnterior: lista && efectivo && efectivo < lista ? lista : it.precioAnterior ?? null,
              _discount: Number(quote?.discount ?? (lista && efectivo ? (lista - efectivo) : 0)) || 0,
            });
          } catch (_) {
            // ignorar ítems sin acceso al precio
          }
        }

        // 3) Completar imagen/precio si faltan con detalle e imagen
        const enriched = await Promise.all(
          result.map(async (it) => {
            let acc = it;
            if (acc?.precio == null) {
              try {
                const det = await getColeccionableDetalle(it.id, controller.signal);
                acc = { ...acc, precio: det?.precio ?? acc?.precio ?? null };
              } catch (_) {}
            }
            if (!acc.imagen) {
              try {
                const url = await getColeccionableFirstImageUrl(it.id, controller.signal);
                if (url.startsWith('blob:')) revoked.push(url);
                acc = { ...acc, imagen: url };
              } catch (_) {}
            }
            return acc;
          })
        );

        // 4) Ordenar por descuento mayor a menor
        enriched.sort((a, b) => (b._discount || 0) - (a._discount || 0));

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
        <h1 className="text-4xl font-black tracking-tight text-primary sm:text-5xl md:text-6xl">Promociones</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">Aprovechá los coleccionables con descuento y ofertas activas.</p>
      </div>

      {error && <p className="mt-8 text-center text-sm text-red-400">Error al cargar promociones: {error}</p>}
      {loading && <p className="mt-8 text-center text-sm text-white/60">Cargando…</p>}

      {!loading && (
        <div className="mt-12">
          <ColeccionablesGrid
            items={items}
            onAddToWishlist={async ({ id }) => { try { await addToWishlist(id); } catch (_) {} }}
          />
        </div>
      )}
    </div>
  );
}

