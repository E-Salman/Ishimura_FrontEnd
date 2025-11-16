import React from "react";
import { addToWishlist } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const BotonWishlist = ({ coleccionableId }) => {
  const { token } = useAuth();
  const agregarAWishlist = async () => {
    try {
      const ok = await addToWishlist(token, coleccionableId);
      if (ok) {
        alert("Agregado a tu wishlist");
      } else {
        alert("No se pudo agregar a la wishlist");
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

