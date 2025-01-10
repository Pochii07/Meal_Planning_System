import { useActionState } from 'react'
import { createContext, useReducer } from 'react'
export const PatientContext = createContext()

export const patientReducer = (state, action) => {
    switch (action.type) {
        case 'SET_PATIENTS':
            return {
                patients: action.payload
            }
        case 'CREATE_PATIENT':
            return{
                patients: [action.payload, ...state.patients]
            }
        case 'DELETE_PATIENT':
            return{
                patients: state.patients.filter((patient) => patient._id !== action.payload._id)
            }
        default:
            return state 
    }
}

export const PatientContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(patientReducer, {
        patients: []
    })


    return (
        <PatientContext.Provider value={{...state, dispatch}}>
            { children }
        </PatientContext.Provider>
    )
}

