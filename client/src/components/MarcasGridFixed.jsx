import { useEffect, useRef, useState } from "react";
import MarcasCard from "./MarcasCard";
import { getLineasByMarca } from "../lib/api";

export default function MarcasGridFixed({ marcas = [], onSelect }) {
  const [openId, setOpenId] = useState(null);
  const [lineasByMarca, setLineasByMarca] = useState({});
  const [openPlacement, setOpenPlacement] = useState("bottom");
  const cardRefs = useRef({});

  useEffect(() => {
    if (!openId) return;
    if (lineasByMarca[openId]?.status === "loaded") return;
    const controller = new AbortController();
    setLineasByMarca((s) => ({ ...s, [openId]: { status: "loading", items: [] } }));
    getLineasByMarca(openId, controller.signal)
      .then((items) =>
        setLineasByMarca((s) => ({
          ...s,
          [openId]: { status: "loaded", items: Array.isArray(items) ? items : [] },
        }))
      )
      .catch((e) =>
        setLineasByMarca((s) => ({
          ...s,
          [openId]: { status: "error", error: e?.message || String(e), items: [] },
        }))
      );
    return () => controller.abort();
  }, [openId]);

  // Cerrar al hacer click fuera o al presionar Escape
  useEffect(() => {
    if (!openId) return;
    function onPointerDown(e) {
      const wrapper = cardRefs.current[openId];
      if (wrapper && !wrapper.contains(e.target)) {
        setOpenId(null);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setOpenId(null);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [openId]);

  if (!marcas.length) {
    return <p className="text-zinc-400">No hay marcas.</p>;
  }

  const handleToggle = (marca) => {
    if (openId === marca.id) {
      setOpenId(null);
      return;
    }
    const el = cardRefs.current[marca.id];
    if (el && typeof window !== "undefined") {
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
      const estimatedMenuH = 220;
      const shouldOpenUp = rect.bottom + estimatedMenuH > viewportH && rect.top > estimatedMenuH;
      setOpenPlacement(shouldOpenUp ? "top" : "bottom");
    } else {
      setOpenPlacement("bottom");
    }
    setOpenId(marca.id);
  };

  const handleSelectLinea = (marca, linea) => {
    onSelect?.({ marca, linea });
  };

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {marcas.map((m) => {
        const state = lineasByMarca[m.id] || { status: "idle", items: [] };
        return (
          <div
            key={m.id}
            ref={(el) => {
              if (el) cardRefs.current[m.id] = el;
            }}
            className="relative"
          >
            <MarcasCard
              title={m.title}
              description={m.description}
              image={m.image}
              onClick={() => handleToggle(m)}
            />
            {openId === m.id && (
              <div
                className={`absolute left-0 right-0 z-50 text-sm ${
                  openPlacement === "top"
                    ? "bottom-full mb-2 dropdown-enter-up"
                    : "top-full mt-2 dropdown-enter"
                }`}
              >
                <div className="rounded-lg bg-black/80 backdrop-blur-sm shadow-lg ring-1 ring-white/10 p-2">
                  {state.status === "loading" && (
                    <p className="px-2 py-1 text-white/60">Cargando opciones...</p>
                  )}
                  {state.status === "error" && (
                    <p className="px-2 py-1 text-red-400">Error al cargar líneas: {state.error}</p>
                  )}
                  {state.status !== "loading" && (
                    <div className="flex max-h-60 flex-col items-stretch overflow-auto">
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left bg-transparent text-primary hover:bg-transparent focus:outline-none"
                        onClick={() => handleSelectLinea(m, { id: null, nombre: "Todas" })}
                      >
                        Todas
                      </button>
                      {state.items.map((l) => (
                        <button
                          type="button"
                          key={l.id ?? l.lineaId}
                          className="w-full px-3 py-2 text-left bg-transparent text-primary hover:bg-transparent focus:outline-none"
                          onClick={() => handleSelectLinea(m, l)}
                        >
                          {l.nombre ?? l.name ?? l.titulo ?? `Línea ${l.id}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}








