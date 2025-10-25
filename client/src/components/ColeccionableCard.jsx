// Componente presentacional reutilizable para un coleccionable en formato tarjeta
// No depende de configuración adicional: usa Tailwind por CDN ya cargado en index.html

function formatPrice(value, currency = 'USD') {
  if (value == null || value === '') return '';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
  } catch (_) {
    return `$${num.toFixed?.(2) ?? num}`;
  }
}

export default function ColeccionableCard({
  id,
  nombre,
  title,
  descripcion,
  description,
  precio,
  price,
  precioAnterior,
  listPrice,
  moneda = 'USD',
  currency = 'USD',
  imagen,
  image,
  imageUrl,
  src,
  stock,
  onAddToCart,
  onAddToWishlist,
  onClick,
  className = '',
  addToCartText = 'Add to Cart',
}) {
  const displayTitle = title ?? nombre ?? 'Coleccionable';
  const displayDesc = description ?? descripcion ?? '';
  const currentPrice = price ?? precio;
  const oldPrice = listPrice ?? precioAnterior;
  const imgSrc = image ?? imageUrl ?? imagen ?? src;
  const priceStr = currentPrice != null ? formatPrice(currentPrice, currency ?? moneda) : null;
  const outOfStock = Number(stock) <= 0;

  return (
    <article
      className={
        'group overflow-hidden rounded-xl border border-white/10 bg-black/80 shadow-sm ring-1 ring-white/5 backdrop-blur-sm ' +
        'transition hover:border-primary/40 ' +
        className
      }
    >
      <button
        type="button"
        onClick={onClick}
        className="relative block w-full focus:outline-none"
        aria-label={`Ver ${displayTitle}`}
      >
        <div className="relative aspect-[4/3] w-full bg-zinc-900">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={displayTitle}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/40">
              No image
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
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAddToWishlist?.({ id, nombre: displayTitle, precio: currentPrice }); }}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:text-primary hover:ring-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/60"
            aria-label="Agregar a la wishlist"
            title="Agregar a la wishlist"
          >
            <span className="material-symbols-outlined">favorite_border</span>
          </button>
        </div>
      </button>

      <div className="p-5">
        <h3 className="text-lg font-extrabold text-white">{displayTitle}</h3>
        {displayDesc ? (
          <p className="mt-1 line-clamp-2 text-sm text-white/60">{displayDesc}</p>
        ) : null}

        <div className="mt-4 flex items-baseline gap-3">
          {currentPrice != null && (
            <span className="text-xl font-extrabold leading-none text-emerald-400">
              {priceStr}
            </span>
          )}
          {oldPrice != null && (
            <span className="text-sm text-white/50 line-through">
              {formatPrice(oldPrice, currency ?? moneda)}
            </span>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => onAddToWishlist?.({ id, nombre: displayTitle, precio: currentPrice })}
            className="flex-1 rounded-md border border-primary/40 bg-transparent px-4 py-2 text-center text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/40"
            title="Agregar a la wishlist"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">favorite</span>
              Wishlist
            </span>
          </button>
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => !outOfStock && onAddToCart?.({ id, nombre: displayTitle, precio: currentPrice })}
            className={
              "flex-1 rounded-md px-4 py-2 text-center text-xs font-bold transition-colors focus:outline-none " +
              (outOfStock
                ? "bg-white/10 text-white/60 cursor-not-allowed"
                : "bg-primary text-black hover:bg-primary/90 focus:ring-2 focus:ring-primary/50")
            }
          >
            {outOfStock ? "Sin stock" : addToCartText}
          </button>
        </div>
      </div>
    </article>
  );
}
