import React, { useEffect, useState, useCallback } from 'react'; // Make sure React is imported
import { useNutritionistPatientContext } from '../hooks/use_nutritionist_patient_context'
import { usePatientManagement } from '../hooks/use_patient_management'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom';
import { patientService } from '../services/patientService';

import AddPatientForm from '../components_nutritionist/addPatient';
import PatientTable from '../components_nutritionist/patientTable';
import PatientSearchBar from '../components_nutritionist/searchbar';

import { BMI_CATEGORIES } from '../components_nutritionist/searchbar';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

const NutritionistDashboard = () => {
  const { patients = [], dispatch } = useNutritionistPatientContext()
  const { user, isAuthenticated, isCheckingAuth} = useAuthStore()
  const navigate = useNavigate()
  const [isFormOpen, setIsFormOpen] = useState(false)
  
  const [removingPatientId, setRemovingPatientId] = useState(null);
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);

  const [currSearchText, setCurrSearchText] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);

  const {
    loading,
    error,
    handleCreatePatient,
    setLoading,
    setError
  } = usePatientManagement(dispatch);

  const handleRegenerateMealPlan = useCallback(async (patientId) => {
    try {
      console.log("Starting meal plan regeneration for patient:", patientId);
      
      // Call the service to regenerate the meal plan
      const response = await patientService.regenerateMealPlan(patientId);
      console.log("Regeneration API response:", response);
      
      if (!response) {
        console.error("Failed to regenerate meal plan - empty response");
        return null;
      }
      
      // Update patients in context with the new data
      if (patients && Array.isArray(patients)) {
        // Create updated patients array with new meal plan
        const updatedPatients = patients.map(p => 
          p._id === patientId ? {
            ...p,
            prediction: response.prediction,
            progress: response.progress || {},
            skippedMeals: response.skippedMeals || {},
            mealNotes: response.mealNotes || {}
          } : p
        );
        
        console.log("Dispatching updated patients:", updatedPatients);
        dispatch({ type: 'SET_PATIENTS', payload: updatedPatients });
        
        // Also do a full refresh from the backend to ensure data consistency
        setTimeout(async () => {
          const refreshedPatients = await patientService.getAllPatients();
          if (refreshedPatients) {
            console.log("Dispatching refreshed patients:", refreshedPatients);
            dispatch({ type: 'SET_PATIENTS', payload: refreshedPatients });
          }
        }, 300);
      }
      
      return response;
    } catch (error) {
      console.error('Failed to regenerate meal plan:', error);
      return null;
    }
  }, [patients, dispatch, patientService]);

  useEffect(() => {
    const fetchInitialPatients = async () => {
      try {
        setLoading(true);
        const fetchedPatients = await patientService.fetchPatients();
        dispatch({ type: 'SET_PATIENTS', payload: fetchedPatients });
      } catch (error) {
        console.error('Error fetching patients:', error);
        setError('Failed to fetch patients');
      } finally {
        setLoading(false);
      }
    };

    if (!isCheckingAuth) {
      if (!isAuthenticated || !user || user.role !== 'nutritionist') {
        navigate('/'); // redirect non-nutritionist users
      } else {
        fetchInitialPatients(); // fetch patients if user is authenticated nutritionist
      }
    }
  }, [user, isAuthenticated, isCheckingAuth, navigate]);

  useEffect(() => {
    // Initialize filteredPatients with all patients when component mounts
    setFilteredPatients(patients || []);
  }, []);

  useEffect(() => {
    if (currSearchText) {
      handleSearch(currSearchText, 'name');
    } else {
      setFilteredPatients(patients || []);
    }
    console.log("Patients data updated:", patients);
  }, [patients]); 

  const handleRemovePatient = async (patientId) => {
    setRemovingPatientId(patientId);
    setOpenRemoveDialog(true);
  };

  const confirmRemovePatient = async () => {
    if (!removingPatientId) return;
    
    try {
      await patientService.removePatient(removingPatientId);
      dispatch({ 
        type: 'SET_PATIENTS', 
        payload: patients.filter(patient => patient._id !== removingPatientId) 
      });
    } catch (error) {
      console.error('Error removing patient:', error);
      setError('Failed to remove patient');
    } finally {
      setRemovingPatientId(null);
      setOpenRemoveDialog(false);
    }
  };

  const handleSearch = (searchText, filterType) => {
    setCurrSearchText(searchText);
    if (!patients) {
      setFilteredPatients([]);
      return;
    }
  
    const filtered = patients.filter(patient => {
      if (!searchText) return true;

      switch (filterType) {
        case 'name':
          return `${patient.firstName} ${patient.lastName}`
            .toLowerCase()
            .includes(searchText.toLowerCase());
        case 'age':
          return patient.age.toString() === searchText;
        case 'bmi':
          const category = BMI_CATEGORIES.find(c => c.label === searchText);
          if (!category) return false;
          return patient.BMI >= category.range[0] && patient.BMI <= category.range[1];
        default:
          return true;
      }
    });
    setFilteredPatients(filtered);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Add Patient Button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Patient Management</h1>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300"
        >
          {isFormOpen ? 'Close Form' : 'Add New Patient'}
        </button>
      </div>
      <PatientSearchBar 
        onSearchChange={handleSearch}
      />
      {/* Patient Form */}
      {isFormOpen && (
        <AddPatientForm 
          onSubmit={handleCreatePatient}
          error={error}
          dispatch={dispatch}
          setIsFormOpen={setIsFormOpen}
        />
      )}
      {/* Patients Table */}
      <PatientTable 
        patients={filteredPatients} 
        onUpdatePatient={(updatedPatient) => {
          const updatedPatients = patients.map(p => 
            p._id === updatedPatient._id ? updatedPatient : p
          );
          dispatch({ type: 'SET_PATIENTS', payload: updatedPatients });
        }}
        onRemove={handleRemovePatient}
        onRegenerateMealPlan={handleRegenerateMealPlan}
        openRemoveDialog={openRemoveDialog}
        setOpenRemoveDialog={setOpenRemoveDialog}
      />
      <Dialog
        open={openRemoveDialog}
        onClose={() => {
          setOpenRemoveDialog(false)
          setRemovingPatientId(null);
        }}
        aria-labelledby="remove-patient-dialog-title"
      >
        <DialogTitle id="remove-patient-dialog-title">
          Confirm Patient Removal
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this patient? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenRemoveDialog(false);
              setRemovingPatientId(null);
            }}
            color="primary"
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmRemovePatient}
            color="error"
            autoFocus
          >
            Remove Patient
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default NutritionistDashboard