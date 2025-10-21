import React, { useState, useEffect } from "react";

const Carrito = () => {
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchCarrito = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:4002/carrito", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        console.log(data)
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
    const total = items.reduce(
      (acc, item) => acc + (item.coleccionable?.precio || 0) * item.cantidad,
      0
    );
    setTotal(total);
  };

  const eliminarDelCarrito = async (idProducto) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:4002/carrito/${idProducto}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const nuevoCarrito = carrito.filter((item) => item.id !== idProducto);
      setCarrito(nuevoCarrito);
      calcularTotal(nuevoCarrito);
    } catch (error) {
      console.error("Error al eliminar producto:", error);
    }
  };

  if (loading) return <p>Cargando carrito...</p>;

  if (carrito.length === 0)
    return <p style={{ textAlign: "center" }}>Tu carrito está vacío</p>;

  return (
    <div className="carrito-container">
      <h2>Mi Carrito</h2>
      <div className="carrito-lista">
        {carrito.map((item) => (
          <div key={item.id} className="carrito-item">
            <img
              src={
                item.coleccionable?.imagenes?.[0]?.url ||
                "https://via.placeholder.com/100"
              }
              alt={item.coleccionable?.nombre || "Producto"}
              width="100"
            />
            <div className="carrito-info">
              <h3>{item.coleccionable?.nombre}</h3>
              <p>Precio: ${item.coleccionable?.precio}</p>
              <p>Cantidad: {item.cantidad}</p>
              <button onClick={() => eliminarDelCarrito(item.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
      <h3>Total: ${total}</h3>
      <button className="confirmar-btn">Confirmar Compra</button>
    </div>
  );
};

export default Carrito;
