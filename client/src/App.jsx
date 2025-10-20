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

export default App
