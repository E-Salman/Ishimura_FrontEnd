import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const DetalleColeccionable = () => {
    const { id } = useParams(); // Get the :id from the URL
    const [coleccionable, setColeccionable] = useState(null);
    const [imagen, setImagen] = useState(null);
    const navigate = useNavigate();

    const URLBase = "http://localhost:4002/coleccionable/";

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch coleccionable details
                const res1 = await fetch(`${URLBase}${id}`);
                const data = await res1.json();
                setColeccionable(data);

                // Fetch first image (assuming endpoint returns binary)
                const res2 = await fetch(`${URLBase}${id}/imagenes/0`);
                if (res2.ok) {
                    const blob = await res2.blob();
                    const urlBlob = URL.createObjectURL(blob);
                    setImagen(urlBlob);
                }

                setLoading(false);
            } catch (err) {
                console.error("Error fetching data", err);
                setLoading(false);
            }
        };
        fetchData();

        // Clean up blob URL on unmount
        return () => {
            if (imagen) URL.revokeObjectURL(imagen);
        };
    }, [id]);
    if (!coleccionable) return <p>No data available</p>;

    const { nombre, precio, descripcion } = coleccionable;

    //Agregar mini galeria con todas las fotos del coleccionable (requiere añadir endpoint que devuelva el arreglo con las imagenes)
    return (
        <div className="flex flex-col min-h-screen bg-background-dark font-display text-gray-200">
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="relative w-full overflow-hidden rounded-xl">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-4 left-4 px-4 py-2 bg-[rgb(79_255_207_/var(--tw-bg-opacity,1))] bg-accent text-background-dark font-semibold rounded-lg hover:bg-accent/90 transition-colors z-20"
                    >
                        ← Back
                    </button>
                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12 text-[rgb(79_255_207_/var(--tw-text-opacity,1))]">
                        {/* Left: image */}
                        <div>
                            <div className="w-full overflow-hidden rounded-xl bg-gray-900 shadow-lg shadow-accent/10">
                                {imagen ? (
                                    <img
                                        src={imagen}
                                        alt={nombre}
                                        className="w-full h-full object-cover object-center"
                                    />
                                ) : (
                                    <p>No image available</p>
                                )}
                            </div>
                        </div>

                        {/* Right: info */}
                        <div className="flex flex-col justify-center">
                            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                                {nombre}
                            </h1>
                            <p className="mt-4 text-3xl font-bold text-accent">${precio}</p>

                            <div className="mt-6">
                                <p className="mt-2 text-base text-gray-300">{descripcion}</p>
                            </div>

                            <div className="mt-8 flex gap-4">
                                <button className="flex-1 flex items-center justify-center px-8 py-3 bg-[rgb(79_255_207_/var(--tw-bg-opacity,1))] border border-transparent text-base font-bold rounded-lg text-background-dark hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent dark:focus:ring-offset-background-dark transition-all duration-200">
                                    Agregar al carrito
                                </button>
                                <button className="px-4 py-3 border border-gray-700 rounded-lg hover:bg-gray-800 hover:border-accent hover:text-accent transition-colors">
                                    <span className="material-symbols-outlined text-gray-300">
                                        favorite_border
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DetalleColeccionable;
