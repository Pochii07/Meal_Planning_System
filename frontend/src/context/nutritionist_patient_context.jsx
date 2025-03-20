import { createContext, useReducer } from 'react'

export const NutritionistPatientContext = createContext()

export const nutritionistPatientReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PATIENTS':
      return { 
        patients: action.payload 
      }
    case 'CREATE_PATIENT':
      return { 
        patients: [action.payload, ...state.patients] 
      }
    case 'DELETE_PATIENT':
      return { 
        patients: state.patients.filter((p) => p._id !== action.payload._id)
      }
    default:
      return state
  }
}

export const NutritionistPatientContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(nutritionistPatientReducer, { 
    patients: null 
  })
  
  return (
    <NutritionistPatientContext.Provider value={{ ...state, dispatch }}>
      { children }
    </NutritionistPatientContext.Provider>
  )
}