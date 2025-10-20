import { useEffect, useState } from "react";
import MarcasGrid from "./MarcasGridFixed";
import { getBaseUrl, getMarcas, getMarcaFirstImageUrl } from "../lib/api";

export default function MarcasPage() {
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-primary">Marcas</h1>
        {error && (
          <p className="mb-4 text-sm text-red-400">Error al cargar marcas: {error}</p>
        )}
        {loading && <p className="mb-4 text-sm text-gray-400">Cargando marcas...</p>}
        <MarcasGrid marcas={marcas} onSelect={({ marca, linea }) => console.log('selección', { marca, linea })} />
      </div>
    </main>
  );
}
