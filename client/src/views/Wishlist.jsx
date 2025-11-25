import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ColeccionablesGrid from "../components/ColeccionablesGrid";
import { useDispatch, useSelector } from "react-redux";
import { fetchWishlist, removeFromWishlist } from "../redux/wishlistSlice";

const BASE = "http://localhost:4002";
const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

const Wishlist = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { token } = useSelector((state) => state.login);
  const { items, loading, error } = useSelector((state) => state.wishlist);

  useEffect(() => {
    if (token) {
      dispatch(fetchWishlist({ token }));
    }
  }, [token]);

  const eliminarDeWishlist = async (id) => {
    if (!token) return;
    try {
      await dispatch(removeFromWishlist({ token, itemId: id })).unwrap();
    } catch (e) {
      console.error("Error al eliminar producto:", e);
    }
  };

  const itemsForGrid = useMemo(() => {
    return items.map((raw) => {
      const it = raw.coleccionable ?? raw;
      return {
        id: it.id,
        colId: raw.coleccionableId,
        nombre: it.nombre,
        descripcion: it.descripcion ?? "",
        precio: it.precio ?? null,
        imagen: it.imagenUrl,
        _rowId: raw.id, // se usa para eliminar
      };
    });
  }, [items]);

  if (!token) {
    return (
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-16">
          <h1 className="mb-6 text-3xl font-black text-primary">Mi Wishlist</h1>
          <p className="text-center text-sm text-white/70">
            Tenés que iniciar sesión para ver tu wishlist.
          </p>
        </div>
      </main>
    );
  }

  if (loading) {
    return <p className="px-4 py-8 text-sm text-white/70">Cargando wishlist...</p>;
  }

  if (!error && itemsForGrid.length === 0) {
    return (
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-16">
          <h1 className="mb-6 text-3xl font-black text-primary">Mi Wishlist</h1>
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
          Error al cargar wishlist: {error}
        </p>
      )}

      <ColeccionablesGrid
        items={itemsForGrid}
        onAddToCart={async ({ id }) => {
          try {
            await axios.post(
              `${BASE}/carrito/${encodeURIComponent(id)}?cantidad=1`,
              null,
              { headers: authHeaders(token) }
            );
          } catch (e) {
            console.warn("Error al agregar al carrito desde wishlist", e);
          }

          const row = items.find((x) =>
            String(x.coleccionableId) === String(id)
          );

          if (row) {
            await eliminarDeWishlist(row.id);
          }
        }}
        addToCartText="Agregar al carrito"
        secondaryText="Eliminar"
        secondaryClassName="bg-red-600 text-white hover:bg-red-500 focus:ring-2 focus:ring-red-500/50"
        onSecondaryClick={(it) => eliminarDeWishlist(it._rowId)}
        onItemClick={(it) => navigate(`/coleccionable/${it.colId}`)}
        className="mb-8"
        showWishlistButton={false}
      />
    </div>
  );
};

export default Wishlist;