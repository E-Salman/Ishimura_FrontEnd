import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createOrder } from "../lib/api";

const ConfirmarCompra = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const carrito = location.state?.carrito || [];

  const [direccion, setDireccion] = useState({
    calle: "",
    numero: "",
    ciudad: "",
    provincia: "",
    codigoPostal: "",
    pais: "",
  });

  const [tarjeta, setTarjeta] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleChange = (e) => {
    setDireccion({ ...direccion, [e.target.name]: e.target.value });
  };

  const handleConfirmar = async () => {
    if (!tarjeta || Object.values(direccion).some((v) => v === "")) {
      setMensaje("Por favor completá todos los campos.");
      return;
    }

    const payload = {
      metodoPago: "Tarjeta",
      direccionEnvio: direccion,
      items: carrito.map((item) => ({
        coleccionableId: item.coleccionableId,
        cantidad: item.cantidad,
      })),
    };

    try {
      await createOrder(payload);
      setMensaje("Compra confirmada");
      setTimeout(() => navigate("/home"), 2000);
    } catch (error) {
      console.error("Error de conexión:", error);
      setMensaje("Error de conexión con el servidor.");
    }
  };

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-black text-primary">Confirmar compra</h1>

        <div className="space-y-8">
          <section className="rounded-xl bg-black/80 p-6 shadow-lg ring-1 ring-white/10">
            <h2 className="mb-4 text-lg font-semibold text-white">Datos de envío</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                  Calle
                </label>
                <input
                  type="text"
                  name="calle"
                  className="w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Calle"
                  value={direccion.calle}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                  Número
                </label>
                <input
                  type="text"
                  name="numero"
                  className="w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Número"
                  value={direccion.numero}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                  Ciudad
                </label>
                <input
                  type="text"
                  name="ciudad"
                  className="w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ciudad"
                  value={direccion.ciudad}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                  Provincia
                </label>
                <input
                  type="text"
                  name="provincia"
                  className="w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Provincia"
                  value={direccion.provincia}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                  Código postal
                </label>
                <input
                  type="text"
                  name="codigoPostal"
                  className="w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Código postal"
                  value={direccion.codigoPostal}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
                  País
                </label>
                <input
                  type="text"
                  name="pais"
                  className="w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="País"
                  value={direccion.pais}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-black/80 p-6 shadow-lg ring-1 ring-white/10">
            <h2 className="mb-4 text-lg font-semibold text-white">Pago</h2>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">
              Número de tarjeta
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="XXXX XXXX XXXX XXXX"
              value={tarjeta}
              onChange={(e) => setTarjeta(e.target.value)}
            />
          </section>
        </div>

        {mensaje && (
          <p className="mt-4 text-sm font-semibold text-primary">{mensaje}</p>
        )}

        <div className="mt-8 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/carrito")}
            className="rounded-md bg-white/80 px-5 py-2.5 text-sm font-semibold text-black hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            Volver al carrito
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-black hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            Confirmar compra
          </button>
        </div>
      </div>
    </main>
  );
};

export default ConfirmarCompra;
