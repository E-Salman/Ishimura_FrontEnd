import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext.jsx";
import {
  fetchMisCompras,
  selectMisCompras,
  selectMisComprasError,
  selectMisComprasStatus,
} from "../redux/misComprasSlice";

function normalizeOrder(raw) {
  const base = raw ?? {};
  const items = Array.isArray(base.items) ? base.items : [];
  const items = Array.isArray(base.items) ? base.items : [];

  const mappedItems = items.map((item, idx) => ({
    key: item.coleccionableId ?? idx, // fallback mínimo solo para la key de React
    nombre: item.nombre,
    cantidad: item.cantidad,
    precio: item.precioUnitario,
    subtotal: item.subtotal,
  }));

  return {
    id: base.numeroOrden,
    fecha: base.creadaEn,
    total: base.montoTotal,
    metodoPago: base.metodoPago,
    items: mappedItems,
    emailUsuario: base.emailUsuario,
  };
}

function formatDate(dateLike) {
  if (!dateLike) return "Sin fecha";
  try {
    const d =
      typeof dateLike === "number"
        ? new Date(dateLike)
        : new Date(String(dateLike).replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return String(dateLike);
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch (_) {
    return String(dateLike);
  }
}

function formatMoney(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return "$0.00";
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);
  } catch (_) {
    return `$${Number(amount).toFixed(2)}`;
  }
}

export default function MisCompras() {
  const { user, token } = useAuth();
  const dispatch = useDispatch();
  const rawOrders = useSelector(selectMisCompras);
  const status = useSelector(selectMisComprasStatus);
  const error = useSelector(selectMisComprasError);
  const orders = useMemo(
    () => (Array.isArray(rawOrders) ? rawOrders.map(normalizeOrder) : []),
    [rawOrders]
  );

  useEffect(() => {
    if (!token) return;
    dispatch(fetchMisCompras());
  }, [token, dispatch]);

  if (!user || !token) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-primary">Mis compras</h1>
          <p className="mt-4 text-white/70">
            Tenés que <Link to="/login" className="text-primary underline">iniciar sesión</Link> para
            ver tu historial de compras.
          </p>
        </div>
      </main>
    );
  }

  const isLoading = status === "loading";

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-primary">Mis compras</h1>
          <p className="mt-2 text-sm text-white/60">
            Historial de órdenes asociadas a tu cuenta ({email.email}).
          </p>
        </div>

        {status === "loading" && (
          <div className="rounded-xl border border-white/10 bg-black/70 p-6 text-white/70">
            Cargando tus compras...
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {status === "succeeded" && !error && orders.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-black/60 px-5 py-8 text-center text-white/60">
            Aún no registramos compras en tu cuenta. Explorá la{" "}
            <Link to="/coleccionables" className="text-primary underline">tienda</Link> y completá tu
            primera orden.
          </div>
        )}

        <div className="space-y-6">
          {orders.map((order) => (
            <article
              key={order.id ?? crypto.randomUUID?.() ?? Math.random()}
              className="rounded-2xl border border-white/10 bg-black/70 p-5 shadow-lg ring-1 ring-white/5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm text-white/50">Orden</p>
                  <p className="text-lg font-semibold text-white">
                    {order.id ?? "Sin ID"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/50">Fecha</p>
                  <p className="text-white">{formatDate(order.fecha)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/50">Método</p>
                  <span className="inline-flex rounded-full bg-slate-500/20 px-3 py-1 text-sm font-semibold text-slate-200">
                    {order.metodoPago ?? "N/D"}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/50">Total</p>
                  <p className="text-xl font-bold text-primary">
                    {formatMoney(order.total)}
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <li
                    key={item.key}
                    className="flex flex-col rounded-xl border border-white/5 bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                  <li
                    key={item.key}
                    className="flex flex-col rounded-xl border border-white/5 bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">{item.nombre}</p>
                      <p className="text-sm text-white/60">
                        Cantidad: {item.cantidad}
                        {item.subtotal != null ? (
                          <span className="ml-2 text-white/50">
                            Subtotal: {formatMoney(item.subtotal)}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-primary">
                      {formatMoney(item.precio)}
                    </p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
