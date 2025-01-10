import { usePatientContext } from "../hooks/use_patient_context"

const PatientDetails = ({ patient }) => {
  const { dispatch } = usePatientContext()

  const handleClick = async () => {
    const response = await fetch('/api/patient_routes/' + patient._id, {
      method: 'DELETE'
    })
    const json = await response.json()

    if (response.ok) {
      dispatch({type: 'DELETE_PATIENT', payload: json})
    }
  }

    return (
        <div className="patient-details">
            <h4>{patient._id}</h4>
            <p><strong>age: </strong>{patient.age}</p>
            <p><strong>height: </strong>{patient.height}</p>
            <p><strong>weight: </strong>{patient.weight}</p>
            <p><strong>BMI: </strong>{patient.BMI}</p>
            <p><strong>activity level: </strong>{patient.activity_level}</p>
            <p><strong>preference: </strong>{patient.preference}</p>
            <p><strong>restrictions: </strong>{patient.restrictions}</p>
            <p><strong>Date Created: </strong>{patient.createdAt}</p>
            <span onClick={handleClick}>delete</span>
        </div>
    )
}

export default PatientDetails