import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import MarcasPage from './components/MarcasPage'
import Home from './views/Home'
import Navigation from './views/Navigation'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Contact from './views/Contact'
import NavBar from './components/NavBar'
import CardList from './components/CardList'
import ColeccionableDestacado from './components/ColeccionableDestacado'

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleClick = ()=>{
    navigate('/home')
  }

export default function App() {
  return (
    <>
    <NavBar/>
    {/*<Navigation/>*/}
    <Routes>
      <Route path="/home" element={<Home/>}/>
      <Route path="/contact" element={<Contact/>}/>
      <Route path="/marcas" element={<MarcasPage/>}/>
    </Routes>
    {/*<CardList/>*/}
    <ColeccionableDestacado colId={1}/>
    </>
  )
}

      {/* Rutas */}
      <Routes>
        {/* redirigir raíz a /home */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />

        {/* 404 simple */}
        <Route path="*" element={<div className="p-8">404 — Not found</div>} />
      </Routes>
    </div>
  );
}
