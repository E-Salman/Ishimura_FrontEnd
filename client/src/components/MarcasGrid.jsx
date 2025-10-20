import { useEffect, useState } from "react";
import MarcasCard from "./MarcasCard";
import { getLineasByMarca } from "../lib/api";

export default function MarcasGrid({ marcas = [], onSelect }) {
  const [openId, setOpenId] = useState(null);
  const [lineasByMarca, setLineasByMarca] = useState({});

  useEffect(() => {
    if (!openId) return;
    if (lineasByMarca[openId]?.status === "loaded") return;
    const controller = new AbortController();
    setLineasByMarca((s) => ({ ...s, [openId]: { status: "loading", items: [] } }));
    getLineasByMarca(openId, controller.signal)
      .then((items) => setLineasByMarca((s) => ({ ...s, [openId]: { status: "loaded", items } })))
      .catch((e) => setLineasByMarca((s) => ({ ...s, [openId]: { status: "error", error: e?.message || String(e), items: [] } })));
    return () => controller.abort();
  }, [openId]);

  if (!marcas.length) {
    return <p className="text-zinc-400">No hay marcas.</p>;
  }

  const handleToggle = (marca) => {
    setOpenId((prev) => (prev === marca.id ? null : marca.id));
  };

  const handleSelectLinea = (marca, linea) => {
    onSelect?.({ marca, linea });
    console.log("Seleccionaste", { marca, linea });
  };

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {marcas.map((m) => {
        const state = lineasByMarca[m.id] || { status: "idle", items: [] };
        return (
          <div key={m.id} className="space-y-2">
            <MarcasCard
              title={m.title}
              description={m.description}
              image={m.image}
              onClick={() => handleToggle(m)}
            />
            {openId === m.id && (
              <div className="mt-2 text-sm">
                {state.status === "loading" && <p className="text-white/60">Cargando opciones...</p>}
                {state.status === "error" && (
                  <p className="text-red-400">Error al cargar líneas: {state.error}</p>
                )}
                {state.status !== "loading" && (
                  <div className="flex flex-col items-start gap-2">
                    <button
                      type="button"
                      className="px-3 py-1 bg-transparent text-primary hover:bg-transparent focus:outline-none"
                      onClick={() => handleSelectLinea(m, { id: null, nombre: "Todas" })}
                    >
                      Todas
                    </button>
                    {state.items.map((l) => (
                      <button
                        type="button"
                        key={l.id ?? l.lineaId}
                        className="px-3 py-1 bg-transparent text-primary hover:bg-transparent focus:outline-none"
                        onClick={() => handleSelectLinea(m, l)}
                      >
                        {l.nombre ?? l.name ?? l.titulo ?? `Línea ${l.id}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
