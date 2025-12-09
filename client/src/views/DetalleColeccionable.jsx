import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { addCartItem } from "../redux/cartSlice";
import { addToWishlist, fetchWishlist, removeFromWishlist } from "../redux/wishlistSlice";
import { fetchDetalle, fetchFirstImage, selectDetalleCat } from "../redux/coleccionablesSlice";

const DetalleColeccionable = () => {
  const { id } = useParams();
  const { items: wishlistItems = [] } = useSelector((state) => state.wishlist);
  const { token } = useSelector((state) => state.login);
  const isAdmin = useSelector((state) => state.login.role === "ADMIN")
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const detalle = useSelector((state) => selectDetalleCat(state, id));
  const coleccionable = detalle;
  const imagen = detalle?.imagenUrl;

  useEffect(() => {
    if (!detalle) {
      dispatch(fetchDetalle({ id, token }));
    }
    if (detalle && !detalle.firstImageTried && !detalle.imagenUrl) {
      dispatch(fetchFirstImage({ id, token }));
    }
  }, [dispatch, id, token, detalle]);

  const agregarAlCarrito = () => {
    dispatch(addCartItem({ coleccionableId: id, cantidad: 1 })).unwrap()
      .then(() => {
        toast.success("Producto agregado al carrito");
      })
      .catch(error => {
        toast.error(error.message);
      })

    dispatch(fetchWishlist()).unwrap()
      .then(() => {
        const row = wishlistItems.find((w) => String(w.coleccionableId) === String(id));
        if (row) {
          dispatch(removeFromWishlist(row.id))
            .unwrap()
            .catch((e) => {
              toast.error(e?.message || "No se pudo actualizar la wishlist");
              return;
            });
        }
      })
  }

  const agregarAWishlist = () => {
    dispatch(addToWishlist(id)).unwrap()
      .then(() => {
        toast.success("Agregado a tu wishlist");
      })
      .catch(error => toast.error(error?.message || "No se pudo agregar a la wishlist"));
  };


  if (!coleccionable) return <p>No data available</p>;
  const { nombre, precio, descripcion } = coleccionable;

  return (
    <div className="flex flex-col min-h-screen bg-background-dark font-display text-gray-200">
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="relative w-full overflow-hidden rounded-xl">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 px-4 py-2 bg-[rgb(79_255_207_/var(--tw-bg-opacity,1))] bg-accent text-background-dark font-semibold rounded-lg hover:bg-accent/90 transition-colors z-20"
          >
            ⬅ Back
          </button>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 text-[rgb(79_255_207_/var(--tw-text-opacity,1))]">
            <div>
              <div className="w-full overflow-hidden rounded-xl bg-gray-900 shadow-lg shadow-accent/10">
                {imagen ? (
                  <img
                    src={imagen}
                    alt={nombre}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <p>No image available</p>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                {nombre}
              </h1>
              <p className="mt-4 text-3xl font-bold text-accent">${precio}</p>

              <div className="mt-6">
                <p className="mt-2 text-base text-gray-300">{descripcion}</p>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  disabled={isAdmin}
                  onClick={agregarAlCarrito}
//                  className="flex-1 flex items-center justify-center px-8 py-3 bg-[rgb(79_255_207_/var(--tw-bg-opacity,1))] border border-transparent text-base font-bold rounded-lg text-background-dark hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent dark:focus:ring-offset-background-dark transition-all duration-200"
                  className={`${!isAdmin
                    ? "flex-1 flex items-center justify-center px-8 py-3 bg-[rgb(79_255_207_/var(--tw-bg-opacity,1))] border border-transparent text-base font-bold rounded-lg text-background-dark hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent dark:focus:ring-offset-background-dark transition-all duration-200"
                    : "flex-1 flex items-center justify-center px-8 py-3 bg-grey-500 hover:bg-grey-600 border border-transparent text-base font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent dark:focus:ring-offset-background-dark transition-all duration-200"
                    }
              `}
                  
                >
                  Agregar al carrito
                </button>

                <button
                  disabled={isAdmin}
                  onClick={agregarAWishlist}

                  className={`${!isAdmin
                    ? "px-4 py-3 border border-gray-700 rounded-lg hover:bg-gray-800 hover:border-accent hover:text-accent transition-colors"
                    : "bg-grey-500 hover:bg-grey-600"
                    }
              `}
                >
                  <span className="material-symbols-outlined text-gray-300">
                    favorite_border
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DetalleColeccionable;
