import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../lib/api";
import ColeccionablesGrid from "../components/ColeccionablesGrid";
import { useAuth } from "../context/AuthContext";
import {
  clearWishlistState,
  fetchWishlist,
  removeWishlistItem,
} from "../redux/wishlistSlice";

const Wishlist = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useAuth();
  const { items, status, error } = useSelector((state) => state.wishlist);

  useEffect(() => {
    if (status === "idle" && token) {
      dispatch(fetchWishlist({ token }));
    }
    return () => {
      dispatch(clearWishlistState());
    };
  }, [status, token, dispatch]);

  const itemsForGrid = useMemo(
    () =>
      Array.isArray(items)
        ? items.map((item) => ({
            id: item.coleccionableId,
            nombre: item.nombre,
            descripcion: "En tu wishlist",
            precio: item.precio,
            imagen: item.imagenUrl || item.imagenurl || null,
            stock: 1,
            _rowId: item.id,
          }))
        : [],
    [items]
  );

  const eliminarDeWishlist = async (id) => {
    if (!token) return;
    try {
      await dispatch(removeWishlistItem({ token, itemId: id })).unwrap();
    } catch (e) {
      console.error("Error al eliminar producto:", e);
    }
  };

  if (!token) {
    return (
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-3xl font-black text-primary">Mi Wishlist</h1>
          <p className="text-center text-sm text-white/70">
            Tenés que iniciar sesión para ver tu wishlist.
          </p>
        </div>
      </main>
    );
  }

  if (status === "loading") {
    return <p className="px-4 py-8 text-sm text-white/70">Cargando wishlist...</p>;
  }

  if (!error && itemsForGrid.length === 0) {
    return (
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-3xl font-black text-primary">Mi Wishlist</h1>
          <p className="text-center text-sm text-white/70">
            Tu lista de deseos está vacía
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-primary">Mi Wishlist</h1>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-400">
          Error al cargar wishlist: {error}
        </p>
      )}

      <ColeccionablesGrid
        items={itemsForGrid}
        onAddToCart={async ({ id }) => {
          const row = items.find(
            (it) => String(it.coleccionableId) === String(id)
          );
          try {
            await addToCart(token, id, { cantidad: 1 });
          } catch (e) {
            console.warn("Error al agregar al carrito desde wishlist", e);
            const msg = String(e?.message || "");
            if (msg.includes("No auth token")) {
              return;
            }
          }
          if (row) {
            await eliminarDeWishlist(row.id);
          }
        }}
        addToCartText="Agregar al carrito"
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
