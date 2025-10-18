import { useEffect, useState } from "react";
import CategoryGrid from "./CategoryGrid";

export default function CategoriesPage() {
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4002"; // tu backend
    fetch(`${BASE}/api/categories`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setCategories)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p style={{ color: "tomato" }}>Error: {error}</p>;
  if (!categories) return <p>Cargando...</p>;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold text-emerald-300 mb-6">Categories</h1>
      <CategoryGrid
        categories={categories.map((c) => ({
          id: c.id,
          title: c.name,
          description: c.description,
          image: c.imageUrl, // adapta a tu DTO
          slug: c.slug,
        }))}
        onSelect={(cat) => console.log(cat)}
      />
    </main>
  );
}