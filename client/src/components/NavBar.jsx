import { NavLink, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../context/AuthContext.jsx";
import logo from "../../../assets/images/logoishimura.png";
import { useEffect, useRef, useState } from "react";

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
const linkInactive = "text-white/60 hover:text-primary dark:text-black/60 dark:hover:text-primary";
const linkActive = "text-primary";

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

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
      "
    >
      {/* IZQUIERDA: logo + links */}
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-3 text-primary">
          <img src={logo} alt="Ishimura Logo" className="w-10 h-10 object-contain" />
          <h2 className="text-xl font-bold tracking-wide">ISHIMURA COLLECTIBLES</h2>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/home" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>Home</NavLink>
          <NavLink to="/categories" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>Categories</NavLink>
          <NavLink to="/new-arrivals" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>New Arrivals</NavLink>
          <NavLink to="/sales" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>Sales</NavLink>
        </nav>
      </div>

      {/* CENTRO: buscador */}
      <div className="hidden lg:flex justify-center">
        <label className="relative block w-full max-w-[34rem]">
          <span className="sr-only">Search</span>
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/40 dark:text-black/40">
            <span className="material-symbols-outlined">search</span>
          </span>
          <input
            className="block w-full rounded-full border-none bg-primary/20 py-2 pl-10 pr-3 text-sm
                       text-white placeholder:text-white/40
                       dark:text-black dark:placeholder:text-black/50 dark:bg-primary/10"
            placeholder="Search for figures..."
            type="text"
          />
        </label>
      </div>

      {/* DERECHA: fav, cart, login/avatar + theme */}
      <div className="flex items-center justify-end gap-3">
        <button className="flex items-center justify-center rounded-full bg-primary/20 size-10 text-white hover:bg-primary/30 dark:text-black dark:hover:bg-primary/25">
          <span className="material-symbols-outlined text-[22px]">favorite_border</span>
        </button>

        <button className="flex items-center justify-center rounded-full bg-primary/20 size-10 text-white hover:bg-primary/30 dark:text-black dark:hover:bg-primary/25">
          <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
        </button>

        {!user ? (
          <NavLink
            to="/login"
            className="rounded-lg bg-primary/20 px-4 py-2 text-sm font-bold text-white hover:bg-primary/30 transition-colors
                       dark:text-black dark:hover:bg-primary/25"
          >
            Login
          </NavLink>
        ) : (
          <div className="relative" ref={menuRef}>
           <button
  aria-haspopup="menu"
  aria-expanded={open}
  onClick={() => setOpen((v) => !v)}
  className="
    flex items-center justify-center rounded-full size-10
    bg-primary/20 hover:bg-primary/30
    dark:bg-primary/10 dark:hover:bg-primary/25
    text-white dark:text-black
    transition-all duration-300
  "
  title={user.email}
>
  <AvatarInitial email={user.email} />
</button>


            {open && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-64 rounded-xl border border-white/10 dark:border-black/10
                           bg-[#0f1715]/80 dark:bg-white/80 backdrop-blur-md shadow-lg z-50 overflow-hidden"
              >
                <div className="px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-white/60 dark:text-black/60">
                    Signed in as
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white dark:text-black break-all">
                    {user.email}
                  </p>
                </div>
                <div className="h-px bg-white/10 dark:bg-black/10" />
                <button
                  onClick={handleLogout}
                  role="menuitem"
                  className="w-full text-left px-4 py-3 text-sm font-semibold
                             text-red-300 hover:text-red-200 hover:bg-white/5
                             dark:text-red-600 dark:hover:text-red-700 dark:hover:bg-black/5"
                >
                  Logout
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
