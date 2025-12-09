import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { addCartItem } from '../redux/cartSlice';
import { removeFromWishlist } from '../redux/wishlistSlice';

function formatPrice(value, moneda = "USD") {
  if (value == null || value === "") return "";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      moneda,
    }).format(num);
  } catch (_) {
    return `$${num.toFixed?.(2) ?? num}`;
  }
}

export default function ColeccionableCard({
  id,
  nombre,
  descripcion,
  precio,
  precioAnterior,
  listPrice,
  moneda = "USD",
  imagen,
  imagenUrl,
  src,
  stock,
  onAddToCart,
  addToCartText="Agregar al carrito",
  showAddToCartButton = true,
  onAddToWishlist,
  onClick,
  className = "",
  addToCartClassName,
  inWishlist = false,
  showWishlistButton = true,
  cantidadCarrito,
  onQuantityChange,
  secondaryText,
  secondaryClassName,
  onSecondaryClick,
  showDeleteButton = false
}) {
  const displayNombre = nombre;
  const displayDesc = descripcion;
  const currentPrice = precio;
  const oldPrice = listPrice ?? precioAnterior;
  const imgSrc = imagen ?? imagenUrl ?? src;
  const priceStr =
    currentPrice != null ? formatPrice(currentPrice, moneda ?? moneda) : null;
  const outOfStock = Number(stock) <= 0;
  const baseAddClass =
    "flex-1 rounded-md px-4 py-2 text-center text-xs font-bold transition-colors focus:outline-none ";
  const enabledAddClass =
    addToCartClassName ||
    "bg-primary text-black hover:bg-primary/90 focus:ring-2 focus:ring-primary/50";
  const disabledAddClass = "bg-white/10 text-white/60 cursor-not-allowed";
  const heartIcon = inWishlist ? "favorite" : "favorite_border";
  const isAdmin = useSelector((state) => state.login.role === "ADMIN")
  const dispatch = useDispatch();
  const { items: wishlistItems = [] } = useSelector((state) => state.wishlist);

  return (
    <article
      className={
        "group overflow-hidden rounded-xl border border-white/10 bg-black/80 shadow-sm ring-1 ring-white/5 backdrop-blur-sm " +
        "transition hover:border-primary/40 " +
        className
      }
    >
      <button
        type="button"
        onClick={onClick}
        className="relative block w-full focus:outline-none"
        aria-label={`Ver ${displayNombre}`}
      >
        <div className="relative aspect-[4/3] w-full bg-zinc-900">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={displayNombre}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/40">
              No imagen
            </div>
          )}
          {Number(stock) <= 0 && (
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-[-25%] top-1/2 h-14 md:h-16 w-[150%] -translate-y-1/2 -rotate-12 bg-red-600/80 text-center font-extrabold uppercase tracking-widest text-white shadow-lg">
                <div className="grid h-full place-items-center">Sin stock</div>
              </div>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
        </div>
      </button>

      <div className="p-5">
        <h3 className="text-lg font-extrabold text-white">{displayNombre}</h3>
        {displayDesc ? (
          <p className="mt-1 line-clamp-2 text-sm text-white/60">
            {displayDesc}
          </p>
        ) : null}

        <div className="mt-4 flex items-baseline gap-3">
          {currentPrice != null && (
            <span className="text-xl font-extrabold leading-none text-emerald-400">
              {priceStr}
            </span>
          )}
          {oldPrice != null && (
            <span className="text-sm text-white/50 line-through">
              {formatPrice(oldPrice, moneda ?? moneda)}
            </span>
          )}
        </div>

        {typeof cantidadCarrito === "number" && onQuantityChange && (
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-sm font-bold text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-primary/40"
              onClick={() => onQuantityChange((cantidadCarrito - 1))}
            >
              -
            </button>
            <span className="min-w-[2.5rem] rounded-md bg-white/5 px-3 py-1 text-center text-sm text-white">
              {cantidadCarrito}
            </span>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-sm font-bold text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-primary/40"
              onClick={() => onQuantityChange(cantidadCarrito + 1)}
            >
              +
            </button>
          </div>
        )}

        <div className="mt-4 flex gap-3">
          {secondaryText ? (
            <button
              type="button"
              onClick={onSecondaryClick}
              className={
                "flex-1 rounded-md px-4 py-2 text-center text-xs font-semibold transition-colors focus:outline-none " +
                (secondaryClassName ||
                  "border border-white/20 bg-transparent text-white hover:bg-white/10")
              }
            >
              {secondaryText}
            </button>
          ) : (
            showWishlistButton && (
              <button
                disabled={isAdmin}
                type="button"
                onClick={() =>
                  onAddToWishlist?.({
                    id,
                    nombre: displayNombre,
                    precio: currentPrice,
                  })
                }
                className={`${!isAdmin
                  ? "flex-1 rounded-md border border-primary/40 bg-transparent px-4 py-2 text-center text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  : "bg-grey-500 hover:bg-grey-600"
                  }
              `}
                title="Agregar a la wishlist"
              >
                <span className={`${!isAdmin
                  ? "inline-flex items-center justify-center gap-2"
                  : "inline-flex items-center justify-center gap-2 bg-grey-500 text-black"
                  }`}>
                  <span className="material-symbols-outlined text-sm">
                    {heartIcon}
                  </span>
                  Wishlist
                </span>
              </button>
            )
          )}
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => {
              if (!outOfStock && onAddToCart) {
                onAddToCart({ id, nombre: displayNombre, precio: currentPrice }); //en algunos lados se le asigna otra funcion a onAddToCart, asi permite sobreescribirlo
              }
              else if (!outOfStock && !onAddToCart) {
                const row = wishlistItems.find(
                  (w) => String(w.coleccionableId) === String(id)
                );
                dispatch(addCartItem({ coleccionableId: id, cantidad: 1 }))
                  .unwrap()
                  .then(() => {
                    toast.success("Producto agregado al carrito");
                  })
                  .catch((e) => {
                    toast.error(e?.message || "No se pudo agregar al carrito");
                    return;
                  });

                if (row) {
                  dispatch(removeFromWishlist(row.id))
                    .unwrap()
                    .catch((e) => {
                      toast.error(e?.message || "No se pudo actualizar la wishlist");
                      return;
                    });
                }
              }
            }}
            className={
              baseAddClass +
              (outOfStock ? disabledAddClass : enabledAddClass) +
              (showWishlistButton ? "" : " w-full")
            }
          >
            {outOfStock ? "Sin stock" : addToCartText}
          </button>
        </div>
      </div>
    </article >
  );
}
