import './App.css'
import MarcasPage from './components/MarcasPage'
import Home from './views/Home'
import Contact from './views/Contact'
import Carrito from './views/Carrito'
import Wishlist from './views/Wishlist'
import NavBar from './components/NavBar'
import ColeccionableDestacado from './components/ColeccionableDestacado'
import { Routes, Route, Navigate } from 'react-router-dom'
import Coleccionables from './views/Coleccionables'
import NewArrivals from './views/NewArrivals'

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/marcas" element={<MarcasPage />} />
        <Route path="/coleccionables" element={<Coleccionables />} />
        <Route path="/new-arrivals" element={<NewArrivals />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="*" element={<div className="p-8">404 - Not found</div>} />
      </Routes>
      {/*<CardList/>*/}
      <ColeccionableDestacado colId={1} />
    </>
  )
}
