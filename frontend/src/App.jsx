import { BrowserRouter, Routes, Route} from 'react-router-dom'

import PatientForm from './pages/home'
import Patients from './pages/patients';
import Navbar from './components/navbar'

function App() {
  
  return (
    <div className = "App">
      <BrowserRouter>
      <Navbar/>
        <div className = "pages">
          <Routes>
          <Route path="/home" element={<PatientForm />} />
          <Route path="/patients" element={<Patients />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App
