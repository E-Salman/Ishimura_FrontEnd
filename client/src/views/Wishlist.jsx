import React, { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ColeccionablesGrid from "../components/ColeccionablesGrid";
import { fetchWishlist, removeFromWishlist } from "../redux/wishlistSlice";
import { fetchDetalle, fetchFirstImage } from "../redux/coleccionablesSlice";

const Wishlist = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { token } = useSelector((state) => state.login);
  const { items, loading, error } = useSelector((state) => state.wishlist);
  const detallesById = useSelector(
    (state) => state.coleccionables.detallesById || {}
  );
  const requestedRef = useRef(new Set());

  useEffect(() => {
    if (token) {
      dispatch(fetchWishlist());
    }
  }, [token, dispatch]);

  const eliminarDeWishlist = (id) => {
    if (!token) return;
    dispatch(removeFromWishlist(id))
      .unwrap()
      .catch((e) => console.error("Error al eliminar producto:", e));
  };

  // Cargar detalles mínimos para mostrar nombre/imagen/precio usando thunks (sin axios en la vista)
  useEffect(() => {
    if (!token) return;
    const pending = items
      .map((raw) => {
        const it = raw.coleccionable ?? {};
        const coleccionableId = it.id ?? raw.coleccionableId;
        return coleccionableId;
      })
      .filter(
        (id) =>
          id != null &&
          !detallesById[id] &&
          !requestedRef.current.has(id)
      );

    if (!pending.length) return;

    pending.forEach((cid) => {
      requestedRef.current.add(cid);
      dispatch(fetchDetalle({ id: cid, token }));
      dispatch(fetchFirstImage({ id: cid, token }));
    });
  }, [items, token, detallesById, dispatch]);

  // Normalizar la data para el grid
  const itemsForGrid = useMemo(() => {
    return items
      .map((raw) => {
        const rowId = raw.id;
        const it = raw.coleccionable ?? {};
        const coleccionableId = it.id ?? raw.coleccionableId;
        if (coleccionableId == null) return null;
        const det = detallesById[coleccionableId] || {};
        return {
          id: coleccionableId, // id del coleccionable (para carrito y navegación)
          nombre: det.nombre ?? it.nombre ?? "Coleccionable",
          descripcion: det.descripcion ?? it.descripcion ?? "",
          precio: det.precio ?? it.precio ?? null,
          imagen:
            det.imagenUrl ??
            det.imagen ??
            it.imagen ??
            it.imageUrl ??
            null,
          _rowId: rowId, // id de la fila en wishlist (solo para eliminar)
        };
      })
      .filter(Boolean);
  }, [items, detallesById]);

  // Usuario no logueado
  if (!token) {
    return (
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-16">
          <h1 className="mb-6 text-3xl font-black text-primary">
            Mi Wishlist
          </h1>
          <p className="text-center text-sm text-white/70">
            Tenés que iniciar sesión para ver tu wishlist.
          </p>
        </div>
      </main>
    );
  }

  // Loading
  if (loading) {
    return (
      <p className="px-4 py-8 text-sm text-white/70">Cargando wishlist...</p>
    );
  }

  // Lista vacía
  if (!error && itemsForGrid.length === 0) {
    return (
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-16">
          <h1 className="mb-6 text-3xl font-black text-primary">
            Mi Wishlist
          </h1>
          <p className="text-center text-sm text-white/70">
            Tu lista de deseos está vacía
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-primary">Mi Wishlist</h1>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-400">
          Error al cargar wishlist: {typeof error === "string" ? error : error?.message || "Error"}
        </p>
      )}

      <ColeccionablesGrid
        items={itemsForGrid}
        secondaryText="Eliminar"
        secondaryClassName="bg-red-600 text-white hover:bg-red-500 focus:ring-2 focus:ring-red-500/50"
        onSecondaryClick={(it) => eliminarDeWishlist(it._rowId)}
        onItemClick={(it) => navigate(`/coleccionable/${it.id}`)}
        className="mb-8"
        showWishlistButton={false}
      />
    </div>
  );
};

export default Wishlist;
