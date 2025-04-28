import { usePatientContext } from "../hooks/use_patient_context"
import formatDate from 'date-fns/formatDistanceToNow'
import { PATIENT_API } from '../config/api';

const PatientDetails = ({ patient }) => {
  const { dispatch } = usePatientContext()

  const handleClick = async () => {
    const response = await fetch(`${PATIENT_API}/${patient._id}`, {
      method: 'DELETE'
    })
    const json = await response.json()

    if (response.ok) {
      dispatch({ type: 'DELETE_PATIENT', payload: json })
    }
  }

  const renderPrediction = (prediction) => {
    if (!prediction) {
      return <p>No prediction</p>
    }

    console.log("Prediction:", prediction)

    if (typeof prediction === 'string') {
      try {
        prediction = JSON.parse(prediction.replace(/'/g, '"'))
      } catch (e) {
        return <p>Invalid prediction format</p>
      }
    }

    if (typeof prediction === 'object' && !Array.isArray(prediction)) {
      return (
        <div className="prediction-container">
          {Object.keys(prediction).map(day => (
            <div key={day} className="prediction-day">
              <h5>{day}</h5>
              <p><strong>Breakfast:</strong> {prediction[day].breakfast}</p>
              <p><strong>Lunch:</strong> {prediction[day].lunch}</p>
              <p><strong>Dinner:</strong> {prediction[day].dinner}</p>
            </div>
          ))}
        </div>
      )
    }

    return <p>Invalid prediction format</p>
  }

  return (
    <div className="patient-details">
      <h4>{patient._id}</h4>
      <p><strong>Age: </strong>{patient.age}</p>
      <p><strong>Height: </strong>{patient.height}</p>
      <p><strong>Weight: </strong>{patient.weight}</p>
      <p><strong>BMI: </strong>{patient.BMI}</p>
      <p><strong>TDEE: </strong>{patient.TDEE} calories</p>
      <p><strong>Activity Level: </strong>{patient.activity_level}</p>
      <p><strong>Preference: </strong>{patient.preference}</p>
      <p><strong>Restrictions: </strong>{patient.restrictions}</p>
      <div><strong>Prediction:</strong> {renderPrediction(patient.prediction)}</div>
      <p><strong>Date Created: </strong>{formatDate(new Date(patient.createdAt), { addSuffix: true })}</p>
      <span onClick={handleClick}>delete</span>
    </div>
  )
}

export default PatientDetails