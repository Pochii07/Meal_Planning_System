const PatientDetails = ({patient}) => {
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
            
        </div>
    )
}

export default PatientDetails