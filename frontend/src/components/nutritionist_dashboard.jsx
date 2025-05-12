import React, { useEffect, useState, useCallback } from 'react'; // Make sure React is imported
import { useNutritionistPatientContext } from '../hooks/use_nutritionist_patient_context'
import { usePatientManagement } from '../hooks/use_patient_management'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom';
import { patientService } from '../services/patientService';

import AddPatientForm from '../components_nutritionist/addPatient';
import PatientTable from '../components_nutritionist/patientTable';
import PatientSearchBar from '../components_nutritionist/searchbar';
import ArchivedPatientTable from '../components_nutritionist/archivedPatientTable';

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
  const [openRegenerateDialog, setOpenRegenerateDialog] = useState(false);
  const [regeneratePatientId, setRegeneratePatientId] = useState(null);

  const [currSearchText, setCurrSearchText] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [filteredArchivedPatients, setFilteredArchivedPatients] = useState([]);
  const [archivedPatients, setArchivedPatients] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'archived'

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
            mealNotes: response.mealNotes || {},
            nutritionistNotes: response.nutritionistNotes || {}
          } : p
        );
        
        console.log("Dispatching updated patients:", updatedPatients);
        dispatch({ type: 'SET_PATIENTS', payload: updatedPatients });
        
        // Also do a full refresh from the backend to ensure data consistency
        setTimeout(async () => {
          const refreshedPatients = await patientService.fetchPatients();
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

  const handleArchivePatient = async (patientId) => {
    try {
      const archivedPatient = await patientService.archivePatient(patientId);
      
      // Update the patients list
      dispatch({ 
        type: 'ARCHIVE_PATIENT', 
        payload: archivedPatient
      });
      
      console.log("Creating toast");
      // Toast creation code
      console.log("Toast created and appended");
      const successToast = document.createElement('div');
      successToast.className = 'fixed bottom-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50 animate-fade-in-up';
      successToast.innerHTML = '<span class="mr-2">✅</span> Patient archived successfully!';
      document.body.appendChild(successToast);
      setTimeout(() => successToast.remove(), 4000);
    } catch (error) {
      console.error('Error archiving patient:', error);
      setError('Failed to archive patient');
    } finally {
      setRemovingPatientId(null);
      setOpenRemoveDialog(false);
    }
  };

  useEffect(() => {
    const fetchInitialPatients = async () => {
      try {
        setLoading(true);
        const fetchedPatients = await patientService.fetchPatients();
        dispatch({ type: 'SET_PATIENTS', payload: fetchedPatients });

        const fetchedArchivedPatients = await patientService.fetchArchivedPatients();
        setArchivedPatients(fetchedArchivedPatients || []);
        setFilteredArchivedPatients(fetchedArchivedPatients || []);
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
    if (activeTab === 'active') {
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
    } else {
      // Filter archived patients
      if (!archivedPatients) {
        setFilteredArchivedPatients([]);
        return;
      }
      
      const filtered = archivedPatients.filter(patient => {
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
      setFilteredArchivedPatients(filtered);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with tabs */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Patient Management</h1>
          <div className="mt-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                className={`${
                  activeTab === "active"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab("active")}
              >
                Active Patients
              </button>
              <button
                className={`${
                  activeTab === "archived"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab("archived")}
              >
                Archived Patients
              </button>
            </nav>
          </div>
        </div>
        {activeTab === "active" && (
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300"
          >
            {isFormOpen ? "Close Form" : "Add New Patient"}
          </button>
        )}
      </div>
      <PatientSearchBar 
         key={activeTab} 
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
      {activeTab === 'active' ? (
       <PatientTable 
          patients={filteredPatients} 
          onUpdatePatient={(updatedPatient) => {
            const updatedPatients = patients.map(p => 
              p._id === updatedPatient._id ? updatedPatient : p
            );
            dispatch({ type: 'SET_PATIENTS', payload: updatedPatients });
          }}
          onRemove={(patientId) => {
            setRemovingPatientId(patientId);
            setOpenRemoveDialog(true);
          }}
          onRegenerateMealPlan={handleRegenerateMealPlan}
          openRemoveDialog={openRemoveDialog}
          setOpenRemoveDialog={setOpenRemoveDialog}
          setOpenRegenerateDialog={setOpenRegenerateDialog}  
          openRegenerateDialog={openRegenerateDialog}  
          setRegeneratePatientId={setRegeneratePatientId}
          regeneratePatientId={regeneratePatientId}
      />
      ) : (
        <ArchivedPatientTable filteredPatients={filteredArchivedPatients} />
      )}
      <Dialog
      open={openRemoveDialog}
      onClose={() => {
        setOpenRemoveDialog(false);
        setRemovingPatientId(null);
      }}
      aria-labelledby="archive-patient-dialog-title"
    >
      <DialogTitle id="archive-patient-dialog-title">Archive Patient</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to archive this patient? You can restore them
          from the Archive tab later.
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
          onClick={() => handleArchivePatient(removingPatientId)}
          color="primary"
          autoFocus
        >
          Archive Patient
        </Button>
      </DialogActions>
      </Dialog>
      <Dialog
        open={openRegenerateDialog}
        onClose={() => {
          setOpenRegenerateDialog(false);
          setRegeneratePatientId(null);
        }}
      >
        <DialogTitle>Confirm Meal Plan Regeneration</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to regenerate this meal plan? Existing meal data
            will be replaced.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenRegenerateDialog(false);
              setRegeneratePatientId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleRegenerateMealPlan(regeneratePatientId);
              setOpenRegenerateDialog(false);
              setRegeneratePatientId(null);
            }}
            color="primary"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default NutritionistDashboard