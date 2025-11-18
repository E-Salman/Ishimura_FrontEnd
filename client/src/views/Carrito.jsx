import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCart,
  removeCartItem,
  updateCartItemQuantity,
} from "../lib/api";
import ColeccionablesGrid from "../components/ColeccionablesGrid";
import { useAuth } from "../context/AuthContext";

const Carrito = () => {
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCarrito = async () => {
      try {
        const data = await getCart(token);
        setCarrito(data);
        calcularTotal(data);
      } catch (error) {
        console.error("Error al cargar el carrito:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCarrito();
  }, []);

  const calcularTotal = (items) => {
    const totalCalculado = items.reduce(
      (acc, item) => acc + (item.precio || 0) * (item.cantidad || 0),
      0
    );
    setTotal(totalCalculado);
  };

  const eliminarDelCarrito = async (idProducto) => {
    try {
      await removeCartItem(token, idProducto);
      const nuevoCarrito = carrito.filter((item) => item.id !== idProducto);
      setCarrito(nuevoCarrito);
      calcularTotal(nuevoCarrito);
    } catch (error) {
      console.error("Error al eliminar producto:", error);
    }
  };

  const cambiarCantidad = async (rowId, nuevaCantidad) => {
    try {
      if (nuevaCantidad <= 0) {
        await eliminarDelCarrito(rowId);
        return;
      }
      const updated = await updateCartItemQuantity(token, rowId, nuevaCantidad);
      setCarrito((prev) => {
        const next = prev.map((it) =>
          it.id === rowId ? { ...it, cantidad: updated?.cantidad ?? nuevaCantidad } : it
        );
        calcularTotal(next);
        return next;
      });
    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
    }
  };

  const confirmarCompra = () => {
    navigate("/confirmar-compra", { state: { carrito } });
  };

  if (loading) return <p>Cargando carrito...</p>;
  if (carrito.length === 0)
    return (
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-3xl font-black text-primary">Mi Carrito</h1>
          <p className="text-center text-sm text-white/70">
            Tu carrito está vacío
          </p>
        </div>
      </main>
    );

  const itemsForGrid = carrito.map((item) => ({
    id: item.coleccionableId,
    nombre: item.nombre,
    descripcion: `Cantidad: ${item.cantidad}`,
    precio: item.precio,
    imagen: item.imagenUrl || item.imagenurl || null,
    stock: 1,
    cantidad: item.cantidad,
    _rowId: item.id,
  }));

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-primary">Mi Carrito</h1>
        <div className="text-right text-white">
          <span className="text-sm uppercase text-white/60">Total</span>
          <div className="text-2xl font-extrabold">${total.toFixed(2)}</div>
        </div>
      </div>

      <ColeccionablesGrid
        items={itemsForGrid}
        onAddToCart={({ id }) => {
          const row = carrito.find(
            (it) => String(it.coleccionableId) === String(id)
          );
          if (row) eliminarDelCarrito(row.id);
        }}
        addToCartText="Eliminar"
        addToCartClassName="bg-red-600 text-white hover:bg-red-500 focus:ring-2 focus:ring-red-500/50"
        onQuantityChange={(it, cantidad) => cambiarCantidad(it._rowId, cantidad)}
        onItemClick={(it) => navigate(`/coleccionable/${it.id}`)}
        className="mb-8"
        showWishlistButton={false}
      />

      <div className="mt-4 flex justify-end">
        <button
          onClick={confirmarCompra}
          className="rounded-md bg-primary px-6 py-3 text-sm font-bold text-black hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          Confirmar compra
        </button>
      </div>
    </div>
  );
};

export default Carrito;
