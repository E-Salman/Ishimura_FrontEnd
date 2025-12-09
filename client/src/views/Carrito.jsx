import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchCart,
  removeCartItemThunk,
  updateCartQuantity,
} from "../redux/cartSlice";
import ColeccionablesGrid from "../components/ColeccionablesGrid";
import { useDispatch, useSelector } from "react-redux";
import { selectCartItems, selectCartStatus } from "../redux/cartSlice";

const Carrito = () => {
  const [total, setTotal] = useState(0);
  const dispatch = useDispatch();
  const carrito = useSelector(selectCartItems);
  const status = useSelector(selectCartStatus);
  const token = useSelector((state) => state.login.token);
  const error = useSelector((state) => state.cart.error)
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCarrito = () => {
      if (!token) {
        navigate("/login");
        return;
      }
      dispatch(fetchCart()).unwrap()
        .catch(() => {
          alert(error.message)
        })
    };
    fetchCarrito();
  }, [token, navigate]);

  const calcularTotal = (items) => {
    const totalCalculado = items.reduce(
      (acc, item) => acc + (item.precio || 0) * (item.cantidad || 0),
      0
    );
    setTotal(totalCalculado);
  };

  const eliminarDelCarrito = (idProducto) => {
    dispatch(removeCartItemThunk({ itemId: idProducto })).unwrap()
      .catch(() => {
        alert(error.message)
      })
  };

  const cambiarCantidad = (rowId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(rowId);
      return;
    }
    dispatch(updateCartQuantity({ itemId: rowId, cantidad: nuevaCantidad })).unwrap()
      .catch(() => {
        alert(error.message)
      })
  };

  const confirmarCompra = () => {
    navigate("/confirmar-compra", { state: { carrito } });
  };

  useEffect(() => {
    calcularTotal(carrito);
  }, [carrito]);

  if (status === "loading") return <p>Cargando carrito...</p>;
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
    key: item.id,
    id: item.coleccionableId,
    nombre: item.nombre,
    descripcion: `Cantidad: ${item.cantidad}`,
    precio: item.precio,
    imagen: item.imagenUrl,
    cantidadCarrito: item.cantidad,
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
          const row = carrito.find((it) => String(it.coleccionableId) === String(id));
          if (row) eliminarDelCarrito(row.id);
        }}
        addToCartText="Eliminar"
        addToCartClassName="bg-red-600 text-white hover:bg-red-500 focus:ring-2 focus:ring-red-500/50"
        onQuantityChange={(it, cantidadCarrito) => cambiarCantidad(it.key, cantidadCarrito)}
        onItemClick={(it) => navigate(`/coleccionable/${it.id}`)}
        className="mb-8"
        showWishlistButton={false}
      />

      <div className="mt-4 flex justify-end">
        <button
          onClick={confirmarCompra}
          className="rounded-md bg-primary px-6 py-3 text-sm font-bold text-black hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50">
          Confirmar compra
        </button>
      </div>
    </div>
  );
};

export default Carrito;
