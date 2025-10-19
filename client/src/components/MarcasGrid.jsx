import MarcasCard from "./MarcasCard";

export default function MarcasGrid({ marcas = [], onSelect }) {
  if (!marcas.length) {
    return <p className="text-zinc-400">No hay marcas.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {marcas.map((m) => (
        <MarcasCard
          key={m.id}
          title={m.title}
          description={m.description}
          image={m.image}
          onClick={() => onSelect?.(m)}
        />
      ))}
    </div>
  );
}
