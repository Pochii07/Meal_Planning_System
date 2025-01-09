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

