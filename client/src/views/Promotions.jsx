import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ColeccionablesGrid from '../components/ColeccionablesGrid';
import { fetchPromotions, clearPromotions } from '../redux/promotionsSlice';
import { addToWishlist, fetchWishlist } from '../redux/wishlistSlice';
import { toast } from 'react-toastify';

export default function Promotions() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((state) => state.promotions);
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);

  useEffect(() => {
    dispatch(fetchPromotions());
    return () => {
      dispatch(clearPromotions());
    };
  }, [dispatch]);

  const loading = status === 'loading';
  const wishlistIdSet = new Set(wishlistItems.map((w) => String(w.coleccionableId)));

    const handleAddToWishlist =  ({ id }) => {

    dispatch(addToWishlist(id)).unwrap()
      .then(() => {
        dispatch(fetchWishlist());
        toast.success("Agregado a tu wishlist");
      })
      .catch((e) => {
        const msg = typeof e === "string" ? e : e?.message;
        toast.error(msg || "No se pudo agregar a la wishlist");
      });
  }


  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight text-primary sm:text-5xl md:text-6xl">
          Promociones
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
          Aprovechá los coleccionables con descuento y ofertas activas.
        </p>
      </div>

      {error && (
        <p className="mt-8 text-center text-sm text-red-400">
          Error al cargar promociones: {error}
        </p>
      )}
      {loading && (
        <p className="mt-8 text-center text-sm text-white/60">Cargando...</p>
      )}

      {!loading && (
        <div className="mt-12">
          <ColeccionablesGrid
            items={items.map((it) => ({
              ...it,
              inWishlist: wishlistIdSet.has(String(it.id)),
            }))}
            onAddToWishlist={handleAddToWishlist}
            onItemClick={(it) => navigate(`/coleccionable/${it.id ?? it._id}`)}
          />
        </div>
      )}
    </div>
  );
}
