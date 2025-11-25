import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setActivePath } from "../redux/navigationSlice";

const Navigation = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { links, activePath } = useSelector((state) => state.navigation);

  useEffect(() => {
    dispatch(setActivePath(location.pathname.toLowerCase()));
  }, [location.pathname, dispatch]);

  return (
    <nav className="w-full bg-black/70 text-white shadow-sm">
      <ul className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3 text-sm font-semibold">
        {links.map((link) => {
          const isActive =
            activePath &&
            activePath.toLowerCase().startsWith(link.path.toLowerCase());
          return (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`transition-colors ${
                  isActive ? "text-primary" : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navigation;
