import React from 'react'
import ReactDOM from 'react-dom/client'
import NodelinkTreemap from './NodelinkTreemap'
import './index.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Treemap from './Treemap'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NodelinkTreemap />} />
        <Route path="/treemap" element={<Treemap />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>)
