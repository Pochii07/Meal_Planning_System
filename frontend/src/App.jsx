import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import { NavbarCustom } from './components/navbar';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import LogIn from './pages/LogIn';
import GuestProfile from './pages/GuestProfile';
import PatientForm from './pages/form'
import Patients from './pages/patients';
import VerifyLogin from './pages/Verification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import GuestMealTracker from './pages/GuestMealTracker';
import 'flowbite/dist/flowbite.css'; 
import MealTracker from './components/MealTracker';
import GuestMealPlanner from './pages/GuestMealPlanner'
import NutritionistMealPlanner from './pages/NutritionistMealPlanner'
import NutritionistProfile from './pages/NutritionistProfile'
import ViewPatients from './pages/ViewPatients'
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import { Button } from 'flowbite-react';
import { NutritionistPatientContextProvider } from './context/nutritionist_patient_context';
import NutritionistDashboard from './components/nutritionist_dashboard';

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
    return <Navigate to="/" replace/>
  }

  return children
}

function App() {
  const { isCheckingAuth, checkAuth, logout, user } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  console.log(user);

  useEffect(() => {
    if (!sessionStorage.getItem("reloaded")) {
      sessionStorage.setItem("reloaded", "true");
      window.location.reload();
    }
  }, []);
  
  if (isCheckingAuth) {
    return <div>Loading...</div>
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className = "App">
      <BrowserRouter>
      <NavbarCustom/>
        <div className = "pages">
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/form" element={<PatientForm />} />
          <Route path="/meal-tracker" element={
            <ProtectedRoute>
              <MealTracker />
            </ProtectedRoute>
          } />
          
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
          <Route path="/GuestMealPlanner" element={<GuestMealPlanner />}> </Route>
          <Route path="/NutritionistMealPlanner" element={<NutritionistMealPlanner />}> </Route>
          <Route path="/NutritionistProfile" element={<NutritionistProfile />}> </Route>
          <Route path="/ViewPatients" element={<ViewPatients />}> </Route>
          <Route path="/GuestMealTracker" element={<GuestMealTracker />} />
            
          <Route path="/ForgotPassword" element={<ForgotPassword/>}></Route>
          {/* Authenticated route  */}
          <Route 
            path="/reset_password/:token" 
            element={
            <ResetPassword/>
            }>
          </Route>
          <Route path="/patients" element={<Patients />}> </Route>
          <Route path="/verify_login" element={<VerifyLogin />}> </Route>

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
            path="/nutritionist/meal-planner" 
            element={
              <ProtectedRoute>
                <NutritionistPatientContextProvider>
                  <NutritionistMealPlanner />
                </NutritionistPatientContextProvider>
              </ProtectedRoute>
            }
          />

          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App
