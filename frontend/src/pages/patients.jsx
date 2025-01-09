import { useEffect } from "react"
import { usePatientContext } from "../hooks/use_patient_context"


import PatientDetails from '../components/patient_details'

const Patients = () => {
   const {patients, dispatch} = usePatientContext()

    useEffect(() => {
        const fetchPatients = async () => {
            const response = await fetch('/api/patient_routes')
            const json = await response.json()

            if (response.ok){
                dispatch({type:'SET_PATIENTS', payload: json})
            }
        }

        fetchPatients()
    }, [dispatch])

    return (
        <div className="home">
            <p>patients</p>
            <div className="patients">
                {patients && patients.map((patient) => (
                    <PatientDetails key={patient._id} patient={patient}/>
                ))}
            </div>
        </div>
    )
}

export default Patients