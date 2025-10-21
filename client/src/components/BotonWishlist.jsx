import React from "react";

const BotonWishlist = ({ coleccionableId }) => {
  const agregarAWishlist = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Tenés que iniciar sesión para usar la wishlist");
        return;
      }

      const response = await fetch(`http://localhost:4002/wishlist/${coleccionableId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("Agregado a tu wishlist");
      } else if (response.status === 409) {
        alert("Este coleccionable ya está en tu wishlist");
      } else {
        const err = await response.text();
        alert("No se pudo agregar: " + err);
      }
    } catch (error) {
      console.error("Error al agregar a wishlist:", error);
      alert("Error de conexión con el servidor");
    }
  };

  return (
    <button
      onClick={agregarAWishlist}
      className="rounded-full bg-primary/20 p-2 text-white hover:bg-primary/30 transition-colors"
      title="Agregar a wishlist"
    >
      <span className="material-symbols-outlined">favorite_border</span>
    </button>
  );
};

export default BotonWishlist;
