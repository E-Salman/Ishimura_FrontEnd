import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MarcasGrid from "./MarcasGridFixed";
import { getBaseUrl, getMarcas, getMarcaFirstImageUrl } from "../lib/api";

export default function MarcasPage() {
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    const BASE = getBaseUrl();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const json = await getMarcas(controller.signal);
        const mapMarca = (m) => ({
          id: m?.id ?? m?._id ?? m?.marcaId ?? m?.marcaID ?? crypto.randomUUID?.() ?? String(Math.random()),
          title: m?.name ?? m?.nombre ?? m?.title ?? "Marca",
          description: m?.description ?? m?.descripcion ?? "",
          image: m?.imageUrl ?? m?.imagenUrl ?? m?.imagen ?? m?.image ?? null,
          slug:
            m?.slug ?? (m?.name ?? m?.nombre ?? "marca")?.toString()?.toLowerCase()?.replace(/\s+/g, "-") ?? "marca",
        });
        let data = Array.isArray(json) ? json.map(mapMarca) : [];

        const urlsToRevoke = [];
        const withImages = await Promise.all(
          data.map(async (m) => {
            if (m.image) return m; // ya viene imagen
            const url = await getMarcaFirstImageUrl(m.id, controller.signal);
            if (url.startsWith('blob:')) urlsToRevoke.push(url);
            return { ...m, image: url };
          })
        );

        setMarcas(withImages);

        load._revoke = () => {
          for (const u of urlsToRevoke) URL.revokeObjectURL(u);
        };
      } catch (e) {
        if (e?.name !== "AbortError") setError(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => {
      controller.abort();
      if (typeof load._revoke === 'function') load._revoke();
    };
  }, []);

  const handleSelect = ({ marca, linea }) => {
    const params = new URLSearchParams();
    const mId = marca?.id ?? marca?._id ?? marca?.marcaId ?? marca?.marcaID ?? null;
    const lId = linea?.id ?? linea?.lineaId ?? linea?.lineaID ?? null;
    if (mId) params.set('marcaId', String(mId));
    if (lId) params.set('lineaId', String(lId));
    const qs = params.toString();
    navigate(qs ? `/coleccionables?${qs}` : '/coleccionables');
  };

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-4xl font-bold text-primary">Marcas</h1>
          <button
            type="button"
            onClick={() => navigate('/coleccionables')}
            className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-black hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
            title="Ver todos los coleccionables"
          >
            Todos
          </button>
        </div>
        {error && (
          <p className="mb-4 text-sm text-red-400">Error al cargar marcas: {error}</p>
        )}
        {loading && <p className="mb-4 text-sm text-gray-400">Cargando marcas...</p>}
        <MarcasGrid marcas={marcas} onSelect={handleSelect} />
      </div>
    </main>
  );
}
