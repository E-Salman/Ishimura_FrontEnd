export default function MarcasCard({ title, description, image, onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.(e)}
      className="group relative block overflow-hidden rounded-lg border border-transparent hover:border-primary/50 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/60"
    >
      <img
        src={image}
        alt={title}
        loading="lazy"
        className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-lg font-bold text-primary">{title}</h3>
        <p className="mt-1 text-sm text-gray-300">{description}</p>
      </div>
    </div>
  );
}
