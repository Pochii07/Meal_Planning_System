import {useState } from "react"
import { usePatientContext } from "../hooks/use_patient_context"

const PatientForm = () => {
    const {dispatch} = usePatientContext()

    const [age, setAge] = useState('')
    const [weight, setWeight] = useState('')
    const [height, setHeight] = useState('')
    const [activity_level, setActivityLevel] = useState('')
    const [preference, setPreference] = useState('')
    const [restrictions, setRestrictions] = useState('')
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()

        const patient = {age, weight, height, activity_level, preference, restrictions, }
        
        const response = await fetch('/api/patient_routes', {
            method: 'POST',
            body: JSON.stringify(patient),
            headers:{
                'Content-Type': 'application/json'
            }
        })
        const json = await response.json()

        if (!response.ok) {
            setError(json.error)
        }
        if (response.ok) {
            setAge('')
            setWeight('')
            setHeight('')
            setActivityLevel('')
            setPreference('')
            setRestrictions('')
            setError(null)
            console.log('new patient added', json)
            dispatch({type: 'CREATE_PATIENT', payload: json})
        }
    }


    return (
        <form className = "PatientForm" onSubmit={handleSubmit}>
            <h3> Add New Patient </h3>

            <label> Age: </label>
            <input
                type = "number"
                onChange = {(e) => setAge(e.target.value)}
                value={age}
            />
            <label> Weight: </label>
            <input
                type = "number"
                onChange = {(e) => setWeight(e.target.value)}
                value={weight}
            />
            <label> Height: </label>
            <input
                type = "number"
                onChange = {(e) => setHeight(e.target.value)}
                value={height}
            />
            <label> Activity Level: </label>
            <input
                type = "number"
                onChange = {(e) => setActivityLevel(e.target.value)}
                value={activity_level}
            />
            <label> Preference: </label>
            <input
                type = "text"
                onChange = {(e) => setPreference(e.target.value)}
                value={preference}
            />
            <label> Restrictions: </label>
            <input
                type = "text"
                onChange = {(e) => setRestrictions(e.target.value)}
                value={restrictions}
            />

            <button> Submit </button>
            {error && <div className="error">{error}</div>}
        </form>

    )
}


export default PatientForm