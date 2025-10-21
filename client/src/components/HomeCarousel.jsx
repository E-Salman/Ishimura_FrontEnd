import { useEffect, useState } from "react";
import ColeccionableDestacado from "./ColeccionableDestacado";
import Coleccionable from "./Coleccionable";
import { NavLink } from "react-router-dom";


const HomeCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [coleccionables, setColeccionables] = useState([])
  const [imagenes, setImagenes] = useState([])

  const URLBase = `http://localhost:4002/coleccionable/`

  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const getUniqueRandoms = (count, min, max) => {
    const numbers = new Set();
    while (numbers.size < count) {
      numbers.add(randomInt(min, max));
    }
    return Array.from(numbers);
  };

  const randomIds = getUniqueRandoms(5, 1, 22);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.all(
          randomIds.map(async (id) => {
            const res1 = await fetch(URLBase + id)//options
            const coleccionableData = await res1.json();

            const res2 = await fetch(URLBase + id + "/imagenes/0");
            const blob = await res2.blob();

            if (res1.ok && res2.ok) {
              const imagenBlob = URL.createObjectURL(blob);
              //setColeccionables([...coleccionables, { coleccionableData }]);
              //setImagenes([...imagenes, { imagenBlob }]);
              return { coleccionableData, imagenBlob };
            }
            else console.log("Imagen no encontrada para el coleccionable #" + id)
          })
        )
        const validResults = results.filter(Boolean);
        setColeccionables(validResults.map(r => r.coleccionableData));
        setImagenes(validResults.map(r => r.imagenBlob));
      }
      catch (err) {
        console.error("Error al obtener los datos", err)
      }
    };
    fetchData();
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % coleccionables.length);
  const prev = () => setCurrent((prev) => (prev - 1 + coleccionables.length) % coleccionables.length);

  useEffect(() => {
    if (coleccionables.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % coleccionables.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [coleccionables]);

  return (
    <section className="py-12 text-white">
      <div className="relative flex items-center justify-center">
        {/* Arrows */}
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

        {/* Carousel Container */}
        <div className="overflow-hidden w-[300px] sm:w-[400px] md:w-[500px] rounded-xl shadow-lg">
          {coleccionables.length > 0 && (
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(-${current * 100}%)`,
              }}
            >
              {coleccionables.map((coleccionable, index) => (
                <NavLink
                  key={coleccionable.id}
                  to={`/coleccionable/${coleccionable.id}`}
                  className="w-full flex-shrink-0 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-300"
                >
                  <img
                    src={imagenes[index]}
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