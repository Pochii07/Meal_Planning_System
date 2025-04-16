import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'  // Put this first so Tailwind directives are processed first
import 'flowbite'  // Then Flowbite JS
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)