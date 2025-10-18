export default function CategoryCard({ title, description, image, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left rounded-2xl p-4 bg-zinc-900/90 hover:bg-zinc-800 transition shadow-md focus:outline-none focus:ring-2 focus:ring-teal-400"
    >
      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl mb-4 bg-zinc-800">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
        />
      </div>
      <h3 className="text-teal-300 text-lg font-semibold">{title}</h3>
      <p className="text-zinc-400 text-sm">{description}</p>
    </button>
  );
}