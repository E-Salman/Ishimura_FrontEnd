import { NavLink, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import logo from "../../../assets/images/logoishimura.png";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMarcas } from "../redux/marcasSlice";
import { fetchLineasByMarca } from "../redux/lineasSlice";
import { fetchColeccionables } from "../redux/coleccionablesSlice";
import { logout } from "../redux/loginSlice";
import { isTokenExpired } from "../lib/token";
function AvatarInitial({ email }) {
  const initial = (email?.[0] || "?").toUpperCase();
  return (
    <div
      className="
        size-10 rounded-lg
        flex items-center justify-center font-bold
        text-white dark:text-black
        bg-transparent hover:bg-transparent
        transition-all duration-300
        select-none
      "
      title={email}
    >
      {initial}
    </div>
  );
}

const linkBase = "text-sm font-medium transition-colors";
const linkInactive =
  "text-white/60 hover:text-primary dark:text-black/60 dark:hover:text-primary";
const linkActive = "text-primary";

const NavBar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ---- LOGIN STATE ----
const { email, role, token } = useSelector((state) => state.login);
const userEmail = email || "";
const isLogged = Boolean(token); // o Boolean(token && userEmail), pero ya no hace falta el LS
const isAdmin = role === "ADMIN";

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Logout automático si el token está vencido
  useEffect(() => {
    if (token && isTokenExpired(token)) {
      dispatch(logout());
      setOpen(false);
      navigate("/login", { replace: true });
    }
  }, [token, dispatch, navigate]);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

const handleLogout = () => {
  dispatch(logout());             // esto limpia token/email/role en Redux
  setOpen(false);
  navigate("/login", { replace: true });
};


  const goToPurchases = () => {
    setOpen(false);
    navigate("/mis-compras");
  };

 
  const { items: marcas, status: marcasStatus } = useSelector(
    (state) => state.marcas
  );

  const lineasByMarca = useSelector((state) => state.lineas.byMarca);

  const {
    items: coleccionables,
    status: colStatus,
  } = useSelector((state) => state.coleccionables);

  useEffect(() => {
    if (marcasStatus === "idle") {
      dispatch(fetchMarcas());
    }
  }, [marcasStatus, dispatch]);

  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState({
    brands: [],
    lines: [],
    items: [],
  });
  const [showSug, setShowSug] = useState(false);
  const [loadingSug, setLoadingSug] = useState(false);
  const searchRef = useRef(null);

  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim();
  }

  useEffect(() => {
    const term = norm(q);
    if (!term || term.length < 2) {
      setSuggestions({ brands: [], lines: [], items: [] });
      return;
    }

    let cancelled = false;
    setLoadingSug(true);

    if (colStatus === "idle") {
      dispatch(fetchColeccionables());
    }

    const timer = setTimeout(() => {
      try {
        // ---- BRANDS ----
        const brandsNorm = (Array.isArray(marcas) ? marcas : []).map((m) => {
          const id = m?.id ?? m?.marcaId ?? m?._id ?? String(m.id || "");
          const nombre = m?.nombre ?? m?.name ?? m?.title ?? "Marca";
          return { id, nombre, raw: m };
        });

        const filtBrands = brandsNorm
          .filter((m) => norm(m.nombre).includes(term))
          .slice(0, 5);

        // ---- LÍNEAS ----
        filtBrands.forEach((bm) => {
          const key = String(bm.id);
          const entry = lineasByMarca?.[key];
          if (!entry || entry.status === "idle") {
            dispatch(fetchLineasByMarca(key));
          }
        });

        const allLines = Object.entries(lineasByMarca || {}).flatMap(
          ([marcaId, entry]) => {
            if (!entry || !Array.isArray(entry.items)) return [];
            const marcaMatch = brandsNorm.find(
              (b) => String(b.id) === String(marcaId)
            );
            const marcaNombre = marcaMatch?.nombre ?? "Marca";
            return entry.items.map((l) => ({
              id: l?.id ?? l?.lineaId ?? l?.lineaID ?? String(l.id || ""),
              nombre: l?.nombre ?? l?.name ?? l?.titulo ?? "Línea",
              marcaId,
              marcaNombre,
            }));
          }
        );

        const filtLines = allLines
          .filter((ln) => norm(ln.nombre).includes(term))
          .slice(0, 5);

        // ---- ITEMS ----
        const itemsSource = Array.isArray(coleccionables)
          ? coleccionables
          : [];
        const filtItems = itemsSource
          .filter((x) => norm(x?.nombre ?? x?.name ?? "").includes(term))
          .slice(0, 6);

        if (!cancelled) {
          setSuggestions({
            brands: filtBrands,
            lines: filtLines,
            items: filtItems,
          });
        }
      } finally {
        if (!cancelled) setLoadingSug(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, marcas, lineasByMarca, coleccionables, colStatus, dispatch]);

  // Hide suggestions on outside click
  useEffect(() => {
    function onDoc(e) {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSug(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function onSubmitSearch(e) {
    e.preventDefault();
    const term = norm(q);
    if (!term) return;

    // ITEMS exactos
    const itemsSource = Array.isArray(coleccionables) ? coleccionables : [];
    const exactItem = itemsSource.find(
      (x) => norm(x?.nombre ?? x?.name ?? "") === term
    );
    if (exactItem) {
      navigate(`/coleccionable/${exactItem.id}`);
      setShowSug(false);
      return;
    }

    // BRANDS exactas
    const brandsNorm = (Array.isArray(marcas) ? marcas : []).map((m) => {
      const id = m?.id ?? m?.marcaId ?? m?._id ?? String(m.id || "");
      const nombre = m?.nombre ?? m?.name ?? m?.title ?? "Marca";
      return { id, nombre, raw: m };
    });

    const exactBrand = brandsNorm.find((m) => norm(m.nombre) === term);
    if (exactBrand && exactBrand.id) {
      navigate(
        `/coleccionables?marcaId=${encodeURIComponent(exactBrand.id)}`
      );
      setShowSug(false);
      return;
    }

    // LÍNEAS exactas / parciales
    const allLines = Object.entries(lineasByMarca || {}).flatMap(
      ([marcaId, entry]) => {
        if (!entry || !Array.isArray(entry.items)) return [];
        const marcaMatch = brandsNorm.find(
          (b) => String(b.id) === String(marcaId)
        );
        const marcaNombre = marcaMatch?.nombre ?? "Marca";
        return entry.items.map((l) => ({
          id: l?.id ?? l?.lineaId ?? l?.lineaID ?? String(l.id || ""),
          nombre: l?.nombre ?? l?.name ?? l?.titulo ?? "Línea",
          marcaId,
          marcaNombre,
        }));
      }
    );

    const exactLine = allLines.find((ln) => norm(ln.nombre) === term);
    if (exactLine) {
      navigate(
        `/coleccionables?marcaId=${encodeURIComponent(
          exactLine.marcaId
        )}&lineaId=${encodeURIComponent(exactLine.id)}`
      );
      setShowSug(false);
      return;
    }

    const partialLine = allLines.find((ln) =>
      norm(ln.nombre).includes(term)
    );
    if (partialLine) {
      navigate(
        `/coleccionables?marcaId=${encodeURIComponent(
          partialLine.marcaId
        )}&lineaId=${encodeURIComponent(partialLine.id)}`
      );
      setShowSug(false);
      return;
    }

    // Fallback: listado por query
    navigate(`/coleccionables?q=${encodeURIComponent(q)}`);
    setShowSug(false);
  }

  return (
    <header
      className="
        grid grid-cols-[auto_1fr_auto] items-center
        gap-4 md:gap-8
        whitespace-nowrap border-b border-white/10 dark:border-black/10
        pl-2 pr-6 py-4 w-full
        text-white dark:text-black
        bg-[rgba(15,23,21,0.6)] dark:bg-[rgba(255,255,255,0.6)]
        backdrop-blur-md
        shadow-[0_0_10px_rgba(79,255,207,0.2)]
        transition-all duration-300
        relative z-[1000]
      "
    >
      {/* LEFT: logo + nav links */}
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-3 text-primary">
          <img
            src={logo}
            alt="Ishimura Logo"
            className="w-10 h-10 object-contain"
          />
          <h2 className="text-xl font-bold tracking-wide">
            ISHIMURA COLLECTIBLES
          </h2>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/marcas"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            Marcas
          </NavLink>
          <NavLink
            to="/coleccionables"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            Coleccionables
          </NavLink>
          <NavLink
            to="/new-arrivals"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            Nuevo
          </NavLink>
          <NavLink
            to="/sales"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            Promociones
          </NavLink>
        </nav>
      </div>

      {/* CENTER: search bar */}
      <div className="hidden lg:flex justify-center" ref={searchRef}>
        {/* (lo dejo igual que lo tenías) */}
        {/* ... */}
      </div>

      {/* RIGHT: wishlist, cart, user + theme toggle */}
      <div className="flex items-center justify-end gap-3">
        {!isAdmin && (
          <>
            <NavLink to="/wishlist">
              <button className="flex items-center justify-center rounded-full bg-primary/20 size-10 text-white hover:bg-primary/30 dark:text-black dark:hover:bg-primary/25">
                <span className="material-symbols-outlined text-[22px]">
                  favorite_border
                </span>
              </button>
            </NavLink>
            <NavLink to="/carrito">
              <button className="flex items-center justify-center rounded-full bg-primary/20 size-10 text-white hover:bg-primary/30 dark:text-black dark:hover:bg-primary/25">
                <span className="material-symbols-outlined text-[22px]">
                  shopping_cart
                </span>
              </button>
            </NavLink>
          </>
        )}

        {isAdmin && (
          <NavLink
            to="/admin"
            className="rounded-lg bg-primary/20 px-4 py-2 text-sm font-bold text-white hover:bg-primary/30 transition-colors dark:text-black dark:hover:bg-primary/25"
          >
            Panel de Control
          </NavLink>
        )}

        {!isLogged ? (
          <NavLink
            to="/login"
            className="rounded-lg bg-primary/20 px-4 py-2 text-sm font-bold text-white hover:bg-primary/30 transition-colors dark:text-black dark:hover:bg-primary/25"
          >
            Login
          </NavLink>
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-2 text-white hover:bg-black/30 dark:border-black/20 dark:bg-white/40 dark:text-black dark:hover:bg-white/50"
            >
              <AvatarInitial email={userEmail} />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg bg-black/90 text-sm text-white shadow-lg ring-1 ring-white/10 backdrop-blur-md dark:bg-white dark:text-black dark:ring-black/10">
                <div className="px-4 py-3 border-b border-white/10 dark:border-black/10">
                  <p className="text-[11px] uppercase tracking-wide text-white/60 dark:text-black/60">Sesión</p>
                  <p className="mt-1 text-xs font-semibold break-all text-white dark:text-black">{userEmail}</p>
                </div>
                {!isAdmin && (
                  <button
                    className="block w-full px-4 py-2 text-left hover:bg-white/10 dark:hover:bg-black/10 bg-transparent border-0 focus:outline-none"
                    onClick={goToPurchases}
                  >
                    Mis compras
                  </button>
                )}
                <button
                  className="block w-full px-4 py-2 text-left text-red-300 hover:bg-white/10 dark:text-red-600 dark:hover:bg-black/10 bg-transparent border-0 focus:outline-none"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}

        <div
          className="
            grid place-items-center size-10 rounded-full
            bg-primary/20 hover:bg-primary/30
            dark:bg-primary/10 dark:hover:bg-primary/25
            ring-1 ring-white/40 dark:ring-black/30
            shadow-[0_0_6px_rgba(79,255,207,0.4)]
            backdrop-blur-sm transition-all duration-300
            [&>*]:m-0 [&>*]:p-0 [&>*]:size-10 [&>*]:grid [&>*]:place-items-center
            [&_*]:text-[22px]
          "
        >
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default NavBar;
