import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Form from './components/Form'
import Home from './views/Home'
import Navigation from './views/Navigation'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Contact from './views/Contact'
import NavBar from './components/NavBar'
import CardList from './components/CardList'
import ColeccionableDestacado from './components/ColeccionableDestacado'
import Login from './views/Login'
import Register from "./views/Register";
import ForgotPassword from "./views/ForgotPassword";


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
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

    </Routes>
    {/*<CardList/>*/}
    <ColeccionableDestacado colId={1}/>
    <p>hacer todolist</p>
    <Form/>
    <button onClick={handleClick}>ir a home</button>
    <p>La ruta actual en donde estamos es: {location.pathname}</p>
    </>
  )
}

export default App