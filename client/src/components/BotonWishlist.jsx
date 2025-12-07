import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToWishlist } from "../redux/wishlistSlice";

const BotonWishlist = ({ coleccionableId }) => {
  const dispatch = useDispatch();
  const { status } = useSelector((state) => state.wishlist);

  const agregar = () => {
    dispatch(addToWishlist(coleccionableId)) //addToWishlist es la funcion createasynthunk que exporta wishlistSlice
      .unwrap()
      .then(() => alert("Agregado a tu wishlist"))
      .catch((error) => {
        alert(error.message)
      })
  };

  return (
    <button
      onClick={agregar}
      disabled={status === "loading"}
      className="rounded-full bg-primary/20 p-2 text-white hover:bg-primary/30 transition-colors"
      title="Agregar a wishlist"
    >
      <span className="material-symbols-outlined">favorite_border</span>
    </button>
  );
};

export default BotonWishlist;
