import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchColeccionablesCarousel } from "../redux/coleccionablesCarouselSlice";
import { fetchColeccionables } from "/store/coleccionablesSlice";
import { NavLink } from "react-router-dom";

const HomeCarousel = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.coleccionables);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    dispatch(fetchColeccionablesCarousel());
  }, [dispatch]);

  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [items]);

  const next = () => setCurrent((prev) => (prev + 1) % items.length);
  const prev = () => setCurrent((prev) => (prev - 1 + items.length) % items.length);

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <section className="py-12 text-white">
      <div className="relative flex items-center justify-center">
        <button
          onClick={prev}
          className="absolute left-0 z-10 bg-black/50 px-4 py-2 rounded-full hover:bg-black/70"
        >
          ‹
        </button>
        <button
          onClick={next}
          className="absolute right-0 z-10 bg-black/50 px-4 py-2 rounded-full hover:bg-black/70"
        >
          ›
        </button>

        <div className="overflow-hidden w-[300px] sm:w-[400px] md:w-[500px] rounded-xl shadow-lg">
          {items.length > 0 && (
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(-${current * 100}%)`,
              }}
            >
              {items.map(({ coleccionable, imagen }) => (
                <NavLink
                  key={coleccionable.id}
                  to={`/coleccionable/${coleccionable.id}`}
                  className="w-full flex-shrink-0 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-300"
                >
                  <img
                    src={imagen}
                    alt={coleccionable.nombre}
                    className="w-full max-h-[500px] object-contain rounded-xl"
                  />
                  <div className="mt-4 text-center text-[rgb(79_255_207_/1)]">
                    <h3 className="text-xl font-semibold">{coleccionable.nombre}</h3>
                    <p className="text-gray-300 text-sm">{coleccionable.descripcion}</p>
                  </div>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeCarousel;
