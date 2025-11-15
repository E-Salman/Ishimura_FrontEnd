import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWishlist, removeFromWishlist, addToCart } from "../lib/api";
import ColeccionablesGrid from "../components/ColeccionablesGrid";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const data = await getWishlist();
        setWishlist(data);
      } catch (error) {
        console.error("Error al cargar wishlist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const eliminarDeWishlist = async (id) => {
    try {
      await removeFromWishlist(id);
      setWishlist((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error al eliminar producto:", error);
    }
  };

  if (loading) return <p>Cargando wishlist...</p>;
  if (wishlist.length === 0)
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

  const itemsForGrid = wishlist.map((item) => ({
    id: item.coleccionableId,
    nombre: item.nombre,
    descripcion: "En tu wishlist",
    precio: item.precio,
    imagen: item.imagenUrl || item.imagenurl || null,
    stock: 1,
    _rowId: item.id,
  }));

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-primary">Mi Wishlist</h1>
      </div>

      <ColeccionablesGrid
        items={itemsForGrid}
        onAddToCart={async ({ id }) => {
          const row = wishlist.find(
            (it) => String(it.coleccionableId) === String(id)
          );
          try {
            await addToCart(id, { cantidad: 1 });
          } catch (e) {
            console.warn("Error al agregar al carrito desde wishlist", e);
            const msg = String(e?.message || "");
            // Si no hay token, no borramos para no desincronizar la wishlist
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
