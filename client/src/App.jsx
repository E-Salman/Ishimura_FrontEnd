import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Form from './components/Form'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CategoriesPage from "./components/CategoriesPage";
//import Navbar from "./components/Navbar"; // tu barra fija

function App() {
  //const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
    <Navbar />
      <Routes>
        <Route path="/categories" element={<CategoriesPage />} />
        {/* otras rutas */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
