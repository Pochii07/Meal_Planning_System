import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PatientContextProvider } from './context/patient_context'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PatientContextProvider>
      <App />
    </PatientContextProvider>
  </StrictMode>,
)
