import { useLocation, BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NavbarCustom } from './components/navbar';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import LogIn from './pages/LogIn';
import GuestProfile from './pages/GuestProfile';
import PatientForm from './pages/form';
import Patients from './pages/patients';
import VerifyLogin from './pages/Verification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import GuestMealTracker from './pages/GuestMealTracker';
import { PatientContextProvider } from './context/patient_context';
import MealTracker from './components/MealTracker';
import NutritionistProfile from './pages/NutritionistProfile';
import ViewPatients from './pages/ViewPatients';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import { Button } from 'flowbite-react';
import { NutritionistPatientContextProvider } from './context/nutritionist_patient_context';
import NutritionistDashboard from './components/nutritionist_dashboard';
import GuestMealTrackerDisplay from './pages/GuestMealTrackerDisplay';
import AdminPage from './pages/Admin'
import ContactUs from './pages/ContactUs';
import AboutUs from './pages/AboutUs';
import LoadingScreen from './components/LoadingScreen';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated && !user) {
    return <Navigate to="/" replace />;
  }

  return children
}

const ProtectedAdminRoute = ({children}) => {
  const { isAuthenticated, user, isAdmin } = useAuthStore();
  
  if (!isAuthenticated || !isAdmin()) {
    return <Navigate to="/" replace/>
  }

  return children;
}

const AuthenticatedRoute = ({children}) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const location = useLocation();
  const hideNavbarRoutes = ["/verify_login", "/ChefitAdmin"];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  const { isCheckingAuth, checkAuth, logout, user } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const navigate = useNavigate();

  const checkTokenExpiry = () => {
    const token = localStorage.getItem('token'); 
  
    if (token) {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
  
      if (decoded.exp < currentTime) { 
        localStorage.removeItem('token');  
        navigate('/login');  
      }
    }
  };
  
  useEffect(() => {
    if (!sessionStorage.getItem("reloaded")) {
      sessionStorage.setItem("reloaded", "true");
      window.location.reload();
    }
  }, []);

  if (isCheckingAuth) {
    return <LoadingScreen />;
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="App">
      {!shouldHideNavbar && <NavbarCustom />}
      <div className="pages">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/form"
            element={
              <PatientContextProvider>
                <PatientForm />
              </PatientContextProvider>
            }
          />
          <Route
            path="/meal-tracker"
            element={
              <ProtectedRoute>
                <MealTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/SignUp"
            element={
              <AuthenticatedRoute>
                <SignUp />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/LogIn"
            element={
              <AuthenticatedRoute>
                <LogIn />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/GuestProfile"
            element={
              <ProtectedRoute>
                <GuestProfile />
              </ProtectedRoute>
            }
          />
          <Route path="/ContactUs" element={<ContactUs />} />
          <Route path="/AboutUs" element={<AboutUs />} />         
          <Route path="/NutritionistProfile" element={<NutritionistProfile />} />
          <Route path="/ViewPatients" element={<ViewPatients />} />
          <Route path="/GuestMealTracker" element={<GuestMealTracker />} />
          <Route path="/guest-meal-tracker" element={<GuestMealTracker />} />
          <Route path="/guest-meal-tracker/:accessCode" element={<GuestMealTrackerDisplay />} />
          <Route path="/ForgotPassword" element={<ForgotPassword />} />
          {/* Authenticated route */}
          <Route path="/reset_password/:token" element={<ResetPassword />} />
          <Route
            path="/patients"
            element={
              <PatientContextProvider>
                <Patients />
              </PatientContextProvider>
            }
          />
          <Route path="/verify_login" element={<VerifyLogin />} />
          <Route
            path="/nutritionist/dashboard"
            element={
              <ProtectedRoute>
                <NutritionistPatientContextProvider>
                  <NutritionistDashboard />
                </NutritionistPatientContextProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/nutritionist/patients"
            element={
              <ProtectedRoute>
                <NutritionistPatientContextProvider>
                  <ViewPatients />
                </NutritionistPatientContextProvider>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/ChefitAdmin" 
            element={
              <ProtectedAdminRoute>
                <AdminPage />
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
