import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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

    const token = localStorage.getItem("token");
    const payload = {
      metodoPago: "Tarjeta",
      direccionEnvio: direccion,
      items: carrito.map((item) => ({
        coleccionableId: item.coleccionable?.id,
        cantidad: item.cantidad,
      })),
    };

    try {
      const response = await fetch("http://localhost:4002/ordenes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMensaje("Compra confirmada");
        localStorage.removeItem("carrito");
        setTimeout(() => navigate("/home"), 2000);
      } else {
        setMensaje("Hubo un error al procesar la compra.");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setMensaje("Error de conexión con el servidor.");
    }
  };

  return (
    <div className="confirmar-compra">
      <h2>Confirmar Compra</h2>

      <div className="formulario-envio">
        <h3>Dirección de Envío</h3>
        {Object.keys(direccion).map((campo) => (
          <input
            key={campo}
            type="text"
            name={campo}
            placeholder={campo}
            value={direccion[campo]}
            onChange={handleChange}
          />
        ))}
      </div>

      <div className="formulario-tarjeta">
        <h3>Pago con Tarjeta</h3>
        <input
          type="text"
          placeholder="Número de tarjeta"
          value={tarjeta}
          onChange={(e) => setTarjeta(e.target.value)}
        />
      </div>

      <button onClick={handleConfirmar}>Confirmar compra</button>

      {mensaje && <p style={{ marginTop: "10px" }}>{mensaje}</p>}
    </div>
  );
};

export default ConfirmarCompra;