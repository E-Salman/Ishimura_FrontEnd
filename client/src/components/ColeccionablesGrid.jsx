import ColeccionableCard from './ColeccionableCard';

// Grid simple para reutilizar el card en listas y secciones
export default function ColeccionablesGrid({ items = [], onAddToCart, onItemClick, className = '' }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-white/60">No hay coleccionables.</p>;
  }

  return (
    <div className={
      'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ' + className
    }>
      {items.map((it) => (
        <ColeccionableCard
          key={it.id ?? it._id ?? crypto.randomUUID?.() ?? String(Math.random())}
          id={it.id ?? it._id}
          nombre={it.nombre ?? it.title}
          descripcion={it.descripcion ?? it.description}
          precio={it.precio ?? it.price}
          precioAnterior={it.precioAnterior ?? it.listPrice}
          imagen={it.imagen ?? it.imageUrl ?? it.image}
          onAddToCart={onAddToCart}
          onClick={() => onItemClick?.(it)}
        />
      ))}
    </div>
  );
}

