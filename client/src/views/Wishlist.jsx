import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ColeccionablesGrid from "../components/ColeccionablesGrid";
import { useDispatch, useSelector } from "react-redux";
import { addToWishlist, fetchWishlist, removeFromWishlist } from '../redux/wishlistSlice';

const BASE = "http://localhost:4002";
const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

const Wishlist = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { token } = useSelector((state) => state.login);
  const { items, loading, error } = useSelector((state) => state.wishlist);
  const [detailsById, setDetailsById] = useState({});

  useEffect(() => {
    if (token) {
      dispatch(fetchWishlist());
    }
  }, [token, dispatch]);

  const eliminarDeWishlist = async (id) => {
    if (!token) return;
    try {
      await dispatch(removeFromWishlist(id)).unwrap();
    } catch (e) {
      console.error("Error al eliminar producto:", e);
    }
  };

  // Cargar detalles mínimos para mostrar nombre/imagen/precio
  useEffect(() => {
    if (!token) return;
    const pending = items
      .map((raw) => {
        const it = raw.coleccionable ?? {};
        const coleccionableId = it.id ?? raw.coleccionableId;
        return coleccionableId;
      })
      .filter((id) => id != null && !detailsById[id]);

    if (!pending.length) return;

    (async () => {
      const updates = {};
      for (const cid of pending) {
        try {
          const detRes = await axios.get(`${BASE}/coleccionable/${cid}`, {
            headers: authHeaders(token),
            validateStatus: () => true,
          });
          const det = detRes.status === 200 ? detRes.data : {};
          let imagenUrl = null;
          try {
            const imgRes = await axios.get(`${BASE}/coleccionable/${cid}/imagenes/0`, {
              responseType: "blob",
              headers: authHeaders(token),
              validateStatus: (s) => s === 200 || s === 404,
            });
            if (imgRes.status === 200) {
              imagenUrl = URL.createObjectURL(imgRes.data);
            }
          } catch (_) {}
          updates[cid] = {
            nombre: det?.nombre,
            descripcion: det?.descripcion,
            precio: det?.precio,
            imagen: imagenUrl,
          };
        } catch (_) {}
      }
      if (Object.keys(updates).length) {
        setDetailsById((prev) => ({ ...prev, ...updates }));
      }
    })();
  }, [items, token, detailsById]);

  // 🔥 ACOMODAMOS la wishlist para el grid (usando siempre id de coleccionable)
  const itemsForGrid = useMemo(() => {
    return items
      .map((raw) => {
        const rowId = raw.id;
        const it = raw.coleccionable ?? {};
        const coleccionableId = it.id ?? raw.coleccionableId;
        if (coleccionableId == null) return null;
        const det = detailsById[coleccionableId] || {};
        return {
          id: coleccionableId, // id del coleccionable (para carrito y navegación)
          nombre: det.nombre ?? it.nombre ?? "Coleccionable",
          descripcion: det.descripcion ?? it.descripcion ?? "",
          precio: det.precio ?? it.precio ?? null,
          imagen: det.imagen ?? it.imagen ?? it.imageUrl ?? null,
          _rowId: rowId, // id de la fila en wishlist (solo para eliminar)
        };
      })
      .filter(Boolean);
  }, [items, detailsById]);

  // 🔥 Usuario no logueado
  if (!token) {
    return (
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-16">
          <h1 className="mb-6 text-3xl font-black text-primary">Mi Wishlist</h1>
          <p className="text-center text-sm text-white/70">
            Tenés que iniciar sesión para ver tu wishlist.
          </p>
        </div>
      </main>
    );
  }

  // 🔥 Loading
  if (loading) {
    return <p className="px-4 py-8 text-sm text-white/70">Cargando wishlist...</p>;
  }

  // 🔥 Lista vacía
  if (!error && itemsForGrid.length === 0) {
    return (
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-16">
          <h1 className="mb-6 text-3xl font-black text-primary">Mi Wishlist</h1>
          <p className="text-center text-sm text-white/70">
            Tu lista de deseos está vacía
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-primary">Mi Wishlist</h1>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-400">
          Error al cargar wishlist: {error}
        </p>
      )}

      <ColeccionablesGrid
        items={itemsForGrid}
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
