import { useEffect, useState } from "react";
import { usePatientContext } from "../hooks/use_patient_context";
import PatientDetails from '../components/patient_details';

const Patients = () => {
  const { patients, dispatch } = usePatientContext();
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('/api/patient_routes');
        if (!response.ok) {
          throw new Error('Failed to fetch patients');
        }
        const json = await response.json();
        dispatch({ type: 'SET_PATIENTS', payload: json });
      } catch (err) {
        setError(err.message);
      }
    };

    fetchPatients();
  }, [dispatch]);

  return (
    <div className="home">
      <div className="patients">
        {error && <div className="error">{error}</div>}
        {patients && patients.map((patient) => (
          <PatientDetails key={patient._id} patient={patient} />
        ))}
      </div>
    </div>
  );
};

export default Patients;