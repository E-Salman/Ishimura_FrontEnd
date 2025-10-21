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
  onAddToCart,
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
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
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

        <button
          type="button"
          onClick={() => onAddToCart?.({ id, nombre: displayTitle, precio: currentPrice })}
          className="mt-4 w-full rounded-full bg-primary px-6 py-3 text-center text-sm font-bold text-black transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {addToCartText}
        </button>
      </div>
    </article>
  );
}
