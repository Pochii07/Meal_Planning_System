import { PatientContext } from "../context/patient_context";
import { useContext } from "react";

export const usePatientContext = () => {
    const context = useContext(PatientContext)

    if (!context) {
        throw Error('context error')
    }

    return context
}