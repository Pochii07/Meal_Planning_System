import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import { NavbarCustom } from './components/navbar';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import LogIn from './pages/LogIn';
import GuestProfile from './pages/GuestProfile';
import PatientForm from './pages/home'
import Patients from './pages/patients';
import VerifyLogin from './pages/Verification';
import 'flowbite/dist/flowbite.css'; 

import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import { Button } from 'flowbite-react';

const ProtectedRoute = ({children}) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated && !user) {
    return <Navigate to="/" replace/>
  }

  return children
}
const AuthenticatedRoute = ({children}) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) {
    return <Navigate to="/GuestProfile" replace/>
  }

  return children
}

function App() {
  const { isCheckingAuth, checkAuth, logout, user } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  console.log(user);
  
  if (isCheckingAuth) {
    return <div>Loading...</div>
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className = "App">
      {user && <Button onClick={handleLogout}>Logout</Button>}
      <BrowserRouter>
      <NavbarCustom/>
        <div className = "pages">
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<PatientForm />} />

          {/* <Route path="/SignUp" element={<SignUp/>}></Route>
          <Route path="/LogIn" element={<LogIn/>}></Route> */
          /* <Route path="/GuestProfile" element={<GuestProfile/>}> </Route> */}

          <Route 
           path="/SignUp" 
            element={
              <AuthenticatedRoute>
                <SignUp/>
              </AuthenticatedRoute>
            }>
          </Route>
          <Route 
           path="/LogIn" 
            element={
              <AuthenticatedRoute>
                <LogIn/>
              </AuthenticatedRoute>
            }>
          </Route>
          <Route 
            path="/GuestProfile" 
            element={
              <ProtectedRoute>
                <GuestProfile/>
              </ProtectedRoute>
            }> 
          </Route>
          <Route path="/patients" element={<Patients />}> </Route>
          <Route path="/verify_login" element={<VerifyLogin />}> </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App
