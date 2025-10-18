import CategoryCard from "./CategoryCard";

export default function CategoryGrid({ categories = [], onSelect }) {
  if (!categories.length) {
    return <p className="text-zinc-400">No hay categorías.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c) => (
        <CategoryCard
          key={c.id}
          title={c.title}
          description={c.description}
          image={c.image}
          onClick={() => onSelect?.(c)}
        />
      ))}
    </div>
  );
}
