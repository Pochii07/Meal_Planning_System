// Base API URL from environment variable with fallback
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
export const ML_API_URL = import.meta.env.VITE_ML_API_URL || '';
// Accessing environment variables in Vite
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';



// Auth endpoints
export const AUTH_API = `${API_BASE_URL}/api/auth`;
export const PATIENT_API = `${API_BASE_URL}/api/patient_routes`;
export const NUTRITIONIST_API = `${API_BASE_URL}/api/nutritionist/patients`;
export const RECIPES_API = 'http://localhost:4000/api/recipes';
