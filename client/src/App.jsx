import "./App.css";
import MarcasPage from "./components/MarcasPage";
import Home from "./views/Home";
import Contact from "./views/Contact";
import Carrito from "./views/Carrito";
import Wishlist from "./views/Wishlist";
import ConfirmarCompra from "./views/ConfirmarCompra";
import NavBar from "./components/NavBar";
import ColeccionableDestacado from "./components/ColeccionableDestacado";
import Login from "./views/Login";
import Register from "./views/Register";
import ForgotPassword from "./views/ForgotPassword";
import HomeCarousel from "./components/HomeCarousel";
import DetalleColeccionable from "./views/DetalleColeccionable";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import Footer from './components/Footer'

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    navigate("/home");
  };

  return (
    <>
      <NavBar />
      {/*<Navigation/>*/}      
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/coleccionable/:id" element={<DetalleColeccionable />} />
        <Route path="/marcas" element={<MarcasPage />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/confirmar-compra" element={<ConfirmarCompra />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<div className="p-8">404 - Not found</div>} />
      </Routes>
      <Footer/>
    </>
  );
}

export default App;
