import React, { useState, useEffect } from 'react';
import { patientService } from '../services/patientService';

const ArchivedPatientTable = () => {
  const [archivedPatients, setArchivedPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArchivedPatients = async () => {
      try {
        setLoading(true);
        const patients = await patientService.fetchArchivedPatients();
        // Make sure patients is an array before setting state
        setArchivedPatients(Array.isArray(patients) ? patients : []);
      } catch (err) {
        console.error('Error fetching archived patients:', err);
        setError('Failed to load archived patients');
        setArchivedPatients([]); // Ensure it's always an array
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedPatients();
  }, []);

  const handleRestore = async (patientId) => {
    try {
      await patientService.restorePatient(patientId);
      setArchivedPatients(archivedPatients.filter(patient => patient._id !== patientId));
      
      // Show success message
      const successToast = document.createElement('div');
      successToast.className = 'fixed bottom-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50 animate-fade-in-up';
      successToast.innerHTML = '<span class="mr-2">✅</span> Patient restored successfully!';
      document.body.appendChild(successToast);
      setTimeout(() => successToast.remove(), 3000);
    } catch (error) {
      console.error('Error restoring patient:', error);
    }
  };

  if (loading) return <div className="text-center py-8">Loading archived patients...</div>;
  if (error) return <div className="text-center text-red-600 py-8">{error}</div>;
  if (archivedPatients.length === 0) return <div className="text-center text-gray-600 py-8">No archived patients found.</div>;

  return (
    <div className="patient-table-container bg-white">
      <div className="patient-table-header">
        <table>
          <thead>
            <tr>
              <th>Name (LN, FN)</th>
              <th>Age</th>
              <th>BMI</th>
              <th>Archived Date</th>
              <th>Actions</th>
            </tr>
          </thead>
        </table>
      </div>
      
      <div className="patient-table-body">
        <table>
          <tbody>
            {archivedPatients.map(patient => (
              <tr key={patient._id} className="hover:bg-gray-50 transition-colors">
                <td className="td-name whitespace-normal break-words max-w-[200px]">
                  <div className="text-sm font-medium text-gray-900 uppercase">
                    {`${patient.lastName}, ${patient.firstName}`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{patient.age}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{patient.BMI}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {patient.archivedAt ? new Date(patient.archivedAt).toLocaleDateString() : 'N/A'}
                  </div>
                </td>
                <td className="px-6 whitespace-nowrap text-sm font-medium">
                  <button
                    className="text-green-600 hover:text-green-900 cursor-pointer"
                    onClick={() => handleRestore(patient._id)}
                  >
                    Restore Patient
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ArchivedPatientTable;