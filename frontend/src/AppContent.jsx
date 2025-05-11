import { useLocation, BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { NavbarCustom } from './components/navbar';
import PatientAccessPage from './pages/PatientAccessPage'; // Renamed from GuestMealTracker
import LogIn from './pages/LogIn';
import VerifyLogin from './pages/Verification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { NutritionistPatientContextProvider } from './context/nutritionist_patient_context';
import NutritionistDashboard from './components/nutritionist_dashboard';
import ViewPatients from './pages/ViewPatients';
import PatientMealPlan from './pages/PatientMealPlan'; // Renamed from GuestMealTrackerDisplay
import AdminPage from './pages/Admin';
import LoadingScreen from './components/LoadingScreen';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';

// Protects routes that require authentication (nutritionist)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !user || user.role !== 'nutritionist') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Protects routes that require admin authentication
const ProtectedAdminRoute = ({children}) => {
  const { isAuthenticated, user, isAdmin } = useAuthStore();
  
  if (!isAuthenticated || !isAdmin()) {
    return <Navigate to="/" replace/>
  }
  return children;
}

// Routes that should only be accessible when not authenticated
const AuthenticatedRoute = ({children}) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/nutritionist/dashboard" replace />;
  }
  return children;
};

function App() {
  const location = useLocation();
  const hideNavbarRoutes = ["/verify_login", "/ChefitAdmin"];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  const { isCheckingAuth, checkAuth, logout } = useAuthStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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

  // Check token expiry on component mount and when location changes
  useEffect(() => {
    checkTokenExpiry();
  }, [location]);

  if (isCheckingAuth) {
    return <LoadingScreen />;
  }

  return (
    <div className="App">
      {!shouldHideNavbar && <NavbarCustom />}
      <div className="pages">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} /> {/* Default to patient access */}
          <Route path="/AboutUs" element={<AboutUs />} />
          <Route path="/ContactUs" element={<ContactUs />} />
          
          {/* Authentication routes */}
          <Route
            path="/login"
            element={
              <AuthenticatedRoute>
                <LogIn />
              </AuthenticatedRoute>
            }
          />
          <Route path="/verify_login" element={<VerifyLogin />} />
          <Route path="/ForgotPassword" element={<ForgotPassword />} />
          <Route path="/reset_password/:token" element={<ResetPassword />} />
          
          {/* Patient access routes */}
          <Route path="/patient-access" element={<PatientAccessPage />} /> {/* Renamed from guest-meal-tracker */}
          <Route path="/patient-meal-plan/:accessCode" element={<PatientMealPlan />} /> {/* Renamed from guest-meal-tracker/:accessCode */}
          
          {/* Protected nutritionist routes */}
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
          
          {/* Admin routes */}
          <Route 
            path="/ChefitAdmin" 
            element={
              <ProtectedAdminRoute>
                <AdminPage />
              </ProtectedAdminRoute>
            }
          />
          
          {/* Catch-all redirect to patient access */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;