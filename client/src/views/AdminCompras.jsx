import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminOrders } from "../redux/adminOrdersSlice";

function normalizeOrder(raw) {
  const base = raw ?? {};
  const items = Array.isArray(base.items) ? base.items : [];

  const mappedItems = items.map((item, idx) => ({
    key: item?.id ?? `${base.numeroOrden ?? "orden"}-${idx}`,
    nombre: item?.nombre ?? `Item ${idx + 1}`,
    cantidad: item?.cantidad ?? 1,
    precioUnitario: item?.precioUnitario ?? null,
    subtotal:
      item?.subtotal ??
      (item?.precioUnitario && item?.cantidad
        ? Number(item.precioUnitario) * Number(item.cantidad)
        : null),
  }));

  return {
    id: base.numeroOrden ?? base.id ?? null,
    fecha: base.creadaEn ?? null,
    metodoPago: base.metodoPago ?? null,
    total:
      base.montoTotal ??
      mappedItems.reduce((acc, it) => acc + Number(it.subtotal || 0), 0),
    email: base.emailUsuario ?? base.userEmail ?? base.email ?? null,
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
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  } catch (_) {
    return `$${Number(amount).toFixed(2)}`;
  }
}

export default function AdminCompras() {
  const loginToken = useSelector((state) => state.login?.token);
  const loginRole = useSelector((state) => state.login?.role);
  const token = loginToken;
  const isAdmin = Boolean(loginRole === "ADMIN");
  const dispatch = useDispatch();

  const {
    items: rawOrders,
    status,
    error,
  } = useSelector((state) => state.adminOrders);

  const [q, setQ] = useState(""); // búsqueda por nro orden / email
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!isAdmin || !token) return;
    if (status === "idle") {
      dispatch(fetchAdminOrders(token));
    }
  }, [isAdmin, token, status, dispatch]);

  // Si no es admin, misma vista de antes
  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-black text-primary">No autorizado</h1>
        <p className="mt-2 text-white/70">
          Necesitás permisos de administrador para ver las compras de clientes.
        </p>
        <p className="mt-4 text-sm text-white/60">
          Volvé al{" "}
          <Link to="/admin" className="text-primary underline">
            panel de control
          </Link>
          .
        </p>
      </main>
    );
  }

  const orders = useMemo(() =>
      Array.isArray(rawOrders) ? rawOrders.map((o) => normalizeOrder(o)) : [],
    [rawOrders]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const min = minTotal !== "" ? Number(minTotal) : null;
    const max = maxTotal !== "" ? Number(maxTotal) : null;

    return orders
      .filter((o) => {
        if (min != null && Number(o.total || 0) < min) return false;
        if (max != null && Number(o.total || 0) > max) return false;

        if (!term) return true;
        const matchesNumero = String(o.id ?? "")
          .toLowerCase()
          .includes(term);
        const matchesEmail = String(o.email ?? "")
          .toLowerCase()
          .includes(term);

        return matchesNumero || matchesEmail;
      })
      .sort((a, b) => {
        const da = new Date(a.fecha || 0).getTime();
        const db = new Date(b.fecha || 0).getTime();
        return db - da; // más recientes primero
      });
  }, [orders, q, minTotal, maxTotal]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const isLoading = status === "loading";

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-primary">
              Compras de clientes
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Listado de todas las órdenes generadas en la tienda.
            </p>
          </div>
          <Link
            to="/admin"
            className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            ⬅ Volver al panel
          </Link>
        </div>

        {/* Filtros */}
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            className="rounded-md border border-white/10 bg-black/60 px-3 py-2 text-sm text-white focus:border-primary/50 focus:outline-none md:col-span-2"
            placeholder="Buscar por número de orden o email"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <input
            type="number"
            min={0}
            className="rounded-md border border-white/10 bg-black/60 px-3 py-2 text-sm text-white focus:border-primary/50 focus:outline-none"
            placeholder="Precio mín."
            value={minTotal}
            onChange={(e) => {
              const v = e.target.value;
              setMinTotal(v === "" ? "" : Math.max(0, Number(v)));
              setPage(1);
            }}
          />
          <input
            type="number"
            min={0}
            className="rounded-md border border-white/10 bg-black/60 px-3 py-2 text-sm text-white focus:border-primary/50 focus:outline-none"
            placeholder="Precio máx."
            value={maxTotal}
            onChange={(e) => {
              const v = e.target.value;
              setMaxTotal(v === "" ? "" : Math.max(0, Number(v)));
              setPage(1);
            }}
          />
        </div>

        {isLoading && (
          <div className="rounded-xl border border-white/10 bg-black/70 p-6 text-white/70">
            Cargando compras…
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-black/60 px-5 py-8 text-center text-white/60">
            No hay compras registradas todavía.
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <>
            <div className="overflow-hidden rounded-lg border border-white/10 bg-black/60">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/60">
                  <tr>
                    <th className="px-3 py-3 text-left">N° Orden</th>
                    <th className="px-3 py-3 text-left">Fecha</th>
                    <th className="px-3 py-3 text-left">Cliente</th>
                    <th className="px-3 py-3 text-left">Método</th>
                    <th className="px-3 py-3 text-right">Total</th>
                    <th className="px-3 py-3 text-left">Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {pageItems.map((order) => (
                    <tr key={order.id}>
                      <td className="px-3 py-3 font-semibold text-white">
                        {order.id}
                      </td>
                      <td className="px-3 py-3 text-white/80">
                        {formatDate(order.fecha)}
                      </td>
                      <td className="px-3 py-3 text-white/80">
                        {order.email || "—"}
                      </td>
                      <td className="px-3 py-3 text-white/80">
                        {order.metodoPago || "—"}
                      </td>
                      <td className="px-3 py-3 text-right text-primary font-bold">
                        {formatMoney(order.total)}
                      </td>
                      <td className="px-3 py-3 text-white/70">
                        {order.items.map((it) => (
                          <div key={it.key} className="text-xs">
                            {it.cantidad} × {it.nombre}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="mt-4 flex items-center justify-between text-sm text-white/70">
              <span>
                Mostrando {pageItems.length} de {filtered.length} órdenes
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded bg-white/10 px-3 py-1 hover:bg-white/20 disabled:opacity-40"
                >
                  Prev
                </button>
                <span>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded bg-white/10 px-3 py-1 hover:bg-white/20 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
