import React, { useState, useEffect } from "react";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:4002/wishlist", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
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
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:4002/wishlist/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist(wishlist.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error al eliminar producto:", error);
    }
  };

  if (loading) return <p>Cargando wishlist...</p>;
  if (wishlist.length === 0)
    return <p style={{ textAlign: "center" }}>Tu lista de deseos está vacía</p>;

  return (
    <div className="wishlist-container">
      <h2>Mi Wishlist</h2>
      <div className="wishlist-lista">
        {wishlist.map((item) => (
          <div key={item.id} className="wishlist-item">
            <img
              src={item.coleccionable?.imagenes?.[0]?.url || ""}
              alt={item.coleccionable?.nombre}
              width="100"
            />
            <div className="wishlist-info">
              <h3>{item.coleccionable?.nombre}</h3>
              <p>Precio: ${item.coleccionable?.precio}</p>
              <button onClick={() => eliminarDeWishlist(item.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
