import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import ColeccionablesGrid from '../components/ColeccionablesGrid';

const BASE = 'http://localhost:4002';
const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

export default function Promotions() {
  const navigate = useNavigate();
  const token = useSelector((state) => state.login.token);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    let revoked = [];

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get(`${BASE}/catalogo`, { signal, validateStatus: () => true });
        let all = [];
        if (Array.isArray(res.data)) {
          all = res.data;
        } else if (res.data && typeof res.data === 'object') {
          const candidates = [res.data.content, res.data.items, res.data.data, res.data.catalogo];
          for (const c of candidates) {
            if (Array.isArray(c)) { all = c; break; }
          }
        }

        const mapped = (Array.isArray(all) ? all : []).map((raw) => {
          const it = raw?.coleccionable ?? raw;
          return {
            id: raw?.coleccionableId ?? raw?.coleccionableID ?? it?.id ?? it?._id ?? it?.coleccionableId ?? it?.coleccionableID,
            nombre: it?.nombre ?? it?.name ?? 'Coleccionable',
            descripcion: it?.descripcion ?? it?.description ?? '',
            precio: it?.precio ?? it?.price ?? null,
            precioAnterior: it?.precioAnterior ?? it?.listPrice ?? null,
            imagen: it?.imagen ?? it?.imageUrl ?? it?.image ?? raw?.imagen ?? null,
          };
        });

        const result = [];
        for (const it of mapped) {
          if (!it?.id) continue;
          try {
            const quoteRes = await axios.get(`${BASE}/precio/preview`, {
              params: { coleccionableId: it.id, qty: 1 },
              signal,
              validateStatus: () => true,
            });
            const quote = quoteRes.data;
            const lista = Number(quote?.precioLista ?? quote?.lista ?? it?.precio ?? 0);
            const efectivo = Number(quote?.precioEfectivo ?? quote?.efectivo ?? it?.precio ?? 0);
            const hasPromo =
              Number(quote?.discount ?? 0) > 0 ||
              (efectivo > 0 && lista > 0 && efectivo < lista) ||
              Boolean(quote?.promocionId);
            if (!hasPromo) continue;
            result.push({
              ...it,
              precio: efectivo || it.precio || null,
              precioAnterior: lista && efectivo && efectivo < lista ? lista : it.precioAnterior ?? null,
              _discount: Number(quote?.discount ?? (lista && efectivo ? (lista - efectivo) : 0)) || 0,
            });
          } catch (_) {
            // ignorar errores de precio
          }
        }

        const enriched = await Promise.all(
          result.map(async (it) => {
            let acc = it;
            if (acc?.precio == null) {
              try {
                const detRes = await axios.get(`${BASE}/coleccionable/${it.id}`, { signal, validateStatus: () => true });
                acc = { ...acc, precio: detRes.data?.precio ?? acc?.precio ?? null };
              } catch (_) {}
            }
            if (!acc.imagen) {
              try {
                const imgRes = await axios.get(`${BASE}/coleccionable/${it.id}/imagenes/0`, {
                  signal,
                  responseType: 'blob',
                  validateStatus: (s) => s === 200 || s === 404,
                });
                if (imgRes.status === 200) {
                  const url = URL.createObjectURL(imgRes.data);
                  if (url.startsWith('blob:')) revoked.push(url);
                  acc = { ...acc, imagen: url };
                }
              } catch (_) {}
            }
            return acc;
          })
        );

        enriched.sort((a, b) => (b._discount || 0) - (a._discount || 0));
        setItems(enriched);
      } catch (e) {
        if (e?.name === 'CanceledError' || e?.message === 'canceled') return;
        if (e?.name !== 'AbortError') setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => {
      controller.abort();
      revoked.forEach((u) => { try { URL.revokeObjectURL(u); } catch (_) {} });
    };
  }, [token]);

  const moveFromWishlistToCart = async (coleccionableId) => {
    try {
      await axios.post(
        `${BASE}/carrito/${encodeURIComponent(coleccionableId)}?cantidad=1`,
        null,
        { headers: authHeaders(token) }
      );
    } catch (e) {
      console.warn("Cart error", e);
      const msg = String(e?.message || "");
      if (msg.includes("No auth token")) {
        return;
      }
    }
    try {
      const res = await axios.get(`${BASE}/wishlist`, { headers: authHeaders(token) });
      const list = Array.isArray(res.data) ? res.data : [];
      const row = list.find(
        (w) => String(w.coleccionableId) === String(coleccionableId)
      );
      if (row) {
        await axios.delete(`${BASE}/wishlist/${encodeURIComponent(row.id)}`, {
          headers: authHeaders(token),
        });
      }
    } catch (_) {}
  };

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight text-primary sm:text-5xl md:text-6xl">
          Promociones
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
          Aprovechá los coleccionables con descuento y ofertas activas.
        </p>
      </div>

      {error && (
        <p className="mt-8 text-center text-sm text-red-400">
          Error al cargar promociones: {error}
        </p>
      )}
      {loading && (
        <p className="mt-8 text-center text-sm text-white/60">Cargando...</p>
      )}

      {!loading && (
        <div className="mt-12">
          <ColeccionablesGrid
            items={items}
            onItemClick={(it) => navigate(`/coleccionable/${it.id ?? it._id}`)}
          />
        </div>
      )}
    </div>
  );
}
