import { useEffect,useState } from "react"

const Patients = () => {
    const [allPatients, setPatients] = useState(null)

    useEffect(() => {
        const fetchPatients = async () => {
            const response = await fetch('/api/patient_routes')
            const json = await response.json()

            if (response.ok){
                setPatients(json)
            }
        }

        fetchPatients()
    }, [])

    return (
        <div className="home">
            <div className="patients">
                {allPatients && allPatients.map((patient) => (
                    <p key={patient._id}>{patient._id}</p>
                ))}
            </div>
        </div>
    )
}

export default Patients