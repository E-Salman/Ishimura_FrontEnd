import ColeccionableCard from './ColeccionableCard';

// Grid simple para reutilizar el card en listas y secciones
export default function ColeccionablesGrid({
  items = [],
  onAddToCart,
  onAddToWishlist,
  onItemClick,
  className = '',
  addToCartText,
  addToCartClassName,
  onQuantityChange,
  showWishlistButton = true,
  showAddToCartButton = true,
  showDeleteButton = false,
  secondaryText,
  secondaryClassName,
  onSecondaryClick,
}) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-white/60">No hay coleccionables.</p>;
  }

  return (
    <div className={
      'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ' + className
    }>
      {items.map((it) => (
        <ColeccionableCard
          key={it._rowId || it.id}
          id={it.id}
          nombre={it.nombre}
          descripcion={it.descripcion}
          precio={it.precio}
          precioAnterior={it.precioAnterior ?? it.listPrice} //Verificar si esto sirve cuando toque promociones
          imagen={it.imagen}
          imagenUrl={it.imagenUrl}
          stock={it.stock}
          cantidadCarrito={it.cantidadCarrito}
          onQuantityChange={onQuantityChange ? (qty) => onQuantityChange(it, qty) : undefined}//probar sacar ? despues de q este todo funcionando de nuevo
          onAddToCart={onAddToCart}
          onAddToWishlist={onAddToWishlist}
          showAddToCartButton={showAddToCartButton}
          onClick={() => onItemClick?.(it)}
          addToCartText={addToCartText}
          addToCartClassName={addToCartClassName}
          inWishlist={Boolean(it.inWishlist)}
          showWishlistButton={showWishlistButton}
          secondaryText={secondaryText}
          secondaryClassName={secondaryClassName}
          onSecondaryClick={onSecondaryClick ? () => onSecondaryClick(it) : undefined}
          showDeleteButton={showDeleteButton}
        />
      ))}
    </div>
  );
}