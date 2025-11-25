import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import MarcasGrid from "./MarcasGrid";
import { fetchMarcas } from "../redux/marcasSlice";

export default function MarcasPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items: rawMarcas, status, error } = useSelector(
    (state) => state.marcas
  );

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchMarcas());
    }
  }, [status, dispatch]);

  const marcas = useMemo(() => {
    const mapMarca = (m) => {
      const id =
        m?.id ??
        m?._id ??
        m?.marcaId ??
        m?.marcaID ??
        crypto.randomUUID?.() ??
        String(Math.random());

      // El backend no está devolviendo la URL de imagen en /marcas.
      // Usamos el endpoint de primera imagen como fallback directo.
      const image =
        m?.imageUrl ??
        m?.imagenUrl ??
        m?.imagen ??
        m?.image ??
        (id ? `${import.meta.env.VITE_API_URL ?? '/api'}/marcasImages/${id}/imagenes/primera` : null);

      return {
        id,
        title: m?.name ?? m?.nombre ?? m?.title ?? "Marca",
        description: m?.description ?? m?.descripcion ?? "",
        image,
        slug:
          m?.slug ??
          (m?.name ?? m?.nombre ?? "marca")
            ?.toString()
            ?.toLowerCase()
            ?.replace(/\s+/g, "-") ??
          "marca",
      };
    };

    return Array.isArray(rawMarcas) ? rawMarcas.map(mapMarca) : [];
  }, [rawMarcas]);

  const handleSelect = ({ marca, linea }) => {
    const params = new URLSearchParams();
    const mId =
      marca?.id ?? marca?._id ?? marca?.marcaId ?? marca?.marcaID ?? null;
    const lId = linea?.id ?? linea?.lineaId ?? linea?.lineaID ?? null;

    if (mId) params.set("marcaId", String(mId));
    if (lId) params.set("lineaId", String(lId));

    const qs = params.toString();
    navigate(qs ? `/coleccionables?${qs}` : "/coleccionables");
  };

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-4xl font-bold text-primary">Marcas</h1>
          <button
            type="button"
            onClick={() => navigate("/coleccionables")}
            className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-black hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
            title="Ver todos los coleccionables"
          >
            Todos
          </button>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-400">
            Error al cargar marcas: {error}
          </p>
        )}

        {status === "loading" && (
          <p className="mb-4 text-sm text-gray-400">Cargando marcas...</p>
        )}

        <MarcasGrid marcas={marcas} onSelect={handleSelect} />
      </div>
    </main>
  );
}
