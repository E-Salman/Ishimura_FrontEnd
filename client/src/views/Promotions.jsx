import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ColeccionablesGrid from "../components/ColeccionablesGrid";
import {
  addToWishlist,
  addToCart,
  getWishlist,
  removeFromWishlist,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  clearPromotions,
  fetchPromotions,
} from "../redux/promotionsSlice";

export default function Promotions() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useAuth();
  const { items, status, error } = useSelector((state) => state.promotions);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchPromotions());
    }
    return () => {
      dispatch(clearPromotions());
    };
  }, [status, dispatch]);

  const moveFromWishlistToCart = async (coleccionableId) => {
    try {
      await addToCart(token, coleccionableId, { cantidad: 1 });
    } catch (e) {
      console.warn("Cart error", e);
      const msg = String(e?.message || "");
      if (msg.includes("No auth token")) {
        return;
      }
    }
    try {
      const data = await getWishlist(token);
      const list = Array.isArray(data) ? data : [];
      const row = list.find(
        (w) => String(w.coleccionableId) === String(coleccionableId)
      );
      if (row) {
        await removeFromWishlist(token, row.id);
      }
    } catch (_) {}
  };

  const isLoading = status === "loading";

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
      {isLoading && (
        <p className="mt-8 text-center text-sm text-white/60">Cargando...</p>
      )}

      {!isLoading && (
        <div className="mt-12">
          <ColeccionablesGrid
            items={items}
            onAddToWishlist={async ({ id }) => {
              try {
                await addToWishlist(token, id);
              } catch (_) {}
            }}
            onAddToCart={({ id }) => moveFromWishlistToCart(id)}
            addToCartText="Agregar al carrito"
            onItemClick={(it) => navigate(`/coleccionable/${it.id ?? it._id}`)}
          />
        </div>
      )}
    </div>
  );
}
