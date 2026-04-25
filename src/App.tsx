import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Cadastrar from './pages/Cadastrar';
import Consultar from './pages/Consultar';
import Admin from './pages/Admin';
import LoginAdmin from './pages/LoginAdmin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cadastrar" element={<Cadastrar />} />
        <Route path="/consultar" element={<Consultar />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login-admin" element={<LoginAdmin />} />
      </Routes>
    </Router>
  );
}

export default App;