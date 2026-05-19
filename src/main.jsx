import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './pages/Home'
import CreateRoom from './pages/CreateRoom'
import HostRoom from './pages/HostRoom'
import JoinRoom from './pages/JoinRoom'
import PlayerRoom from './pages/PlayerRoom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create" element={<CreateRoom />} />
      <Route path="/host/:roomId" element={<HostRoom />} />
      <Route path="/join/:roomId" element={<JoinRoom />} />
      <Route path="/play/:roomId" element={<PlayerRoom />} />
    </Routes>
  </BrowserRouter>
)
