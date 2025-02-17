import { create } from "zustand";

const API_URL = 'http://localhost:4000/api/auth';

export const useAuthStore = create((set) => ({
    user: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    isCheckingAuth: true,

    signup: async (email, password, name) => {
        set({
            isLoading: true,
            error: null
        })
        try {
            const response = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(email, password, name)
            })
            const data = await response.json()
            console.log(data);
        } catch (error) {
            console.log(error);
        }
    } 
}))