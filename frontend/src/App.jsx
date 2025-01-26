import { BrowserRouter, Routes, Route} from 'react-router-dom'
import { NavbarCustom } from './components/navbar';
import LandingPage from './pages/LandingPage';
import PatientForm from './pages/home'
import Patients from './pages/patients';
import 'flowbite/dist/flowbite.css'; 



function App() {
  
  return (
    <div className = "App">
      <BrowserRouter>
      <NavbarCustom/>
        <div className = "pages">
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<PatientForm />} />
          <Route path="/patients" element={<Patients />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App
