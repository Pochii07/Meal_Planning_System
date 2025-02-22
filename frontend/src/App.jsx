import { BrowserRouter, Routes, Route} from 'react-router-dom'
import { NavbarCustom } from './components/navbar';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import LogIn from './pages/LogIn';
import GuestProfile from './pages/GuestProfile';
import PatientForm from './pages/home'
import Patients from './pages/patients';
import VerifyLogin from './pages/Verification';
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
          <Route path="/SignUp" element={<SignUp/>}></Route>
          <Route path="/LogIn" element={<LogIn/>}></Route>
          <Route path="/GuestProfile" element={<GuestProfile/>}> </Route>
          <Route path="/patients" element={<Patients />}> </Route>
          <Route path="/verify_login" element={<VerifyLogin />}> </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App
