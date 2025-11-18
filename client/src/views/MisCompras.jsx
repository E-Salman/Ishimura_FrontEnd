import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getUserOrders } from "../lib/api";
import { useAuth } from "../context/AuthContext.jsx";

function normalizeOrder(raw) {
  const base = raw ?? {};
  const items = Array.isArray(base.items)
    ? base.items
    : Array.isArray(base.detalles)
    ? base.detalles
    : Array.isArray(base.detalle)
    ? base.detalle
    : Array.isArray(base.productos)
    ? base.productos
    : [];

  const mappedItems = items.map((item, idx) => ({
    key:
      item?.id ??
      item?.detalleId ??
      item?.ordenDetalleId ??
      `${base?.id ?? base?.ordenId ?? idx}-${idx}`,
    nombre:
      item?.nombre ??
      item?.coleccionableNombre ??
      item?.coleccionable?.nombre ??
      item?.producto ??
      `Item ${idx + 1}`,
    cantidad: item?.cantidad ?? item?.qty ?? 1,
    precio:
      item?.precio ??
      item?.precioUnitario ??
      item?.monto ??
      item?.importe ??
      item?.coleccionable?.precio ??
      null,
  }));

  return {
    id:
      base?.id ??
      base?.ordenId ??
      base?.orderId ??
      base?.codigo ??
      base?.numero ??
      base?.code ??
      base?.uuid ??
      null,
    fecha:
      base?.fecha ??
      base?.fechaCreacion ??
      base?.createdAt ??
      base?.createdDate ??
      base?.fechaCompra ??
      base?.timestamp ??
      null,
    estado: base?.estado ?? base?.status ?? base?.estadoOrden ?? "Procesando",
    total:
      base?.total ??
      base?.monto ??
      base?.importe ??
      base?.totalOrden ??
      mappedItems.reduce((acc, it) => acc + Number(it.precio || 0) * Number(it.cantidad || 1), 0),
    items: mappedItems,
    raw: base,
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
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);
  } catch (_) {
    return `$${Number(amount).toFixed(2)}`;
  }
}

export default function MisCompras() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getUserOrders(token, controller.signal);
        setOrders(Array.isArray(data) ? data.map(normalizeOrder) : []);
      } catch (e) {
        if (e?.message !== "No autorizado") {
          setError(e?.message || "No se pudieron cargar tus compras.");
        } else {
          setError("Iniciá sesión nuevamente para ver tus compras.");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [token]);

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

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-primary">Mis compras</h1>
          <p className="mt-2 text-sm text-white/60">
            Historial de órdenes asociadas a tu cuenta ({user.email}).
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border border-white/10 bg-black/70 p-6 text-white/70">
            Cargando tus compras…
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
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
                  <p className="text-lg font-semibold text-white">{order.id ?? "Sin ID"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/50">Fecha</p>
                  <p className="text-white">{formatDate(order.fecha)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/50">Estado</p>
                  <span className="inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-300">
                    {order.estado}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/50">Total</p>
                  <p className="text-xl font-bold text-primary">{formatMoney(order.total)}</p>
                </div>
              </div>

              <ul className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <li key={item.key} className="flex flex-col rounded-xl border border-white/5 bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-white">{item.nombre}</p>
                      <p className="text-sm text-white/60">Cantidad: {item.cantidad}</p>
                    </div>
                    <p className="text-sm font-semibold text-primary">{formatMoney(item.precio)}</p>
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
