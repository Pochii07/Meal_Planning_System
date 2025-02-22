import { create } from "zustand";

const API_URL = 'http://localhost:4000/api/auth';

export const useAuthStore = create((set) => ({
    user: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    isCheckingAuth: true,

    signup: async (firstName, lastName, email, birthDate, sex, password) => {
        set({
            isLoading: true,
            error: null
        })
        try {
            const response = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    birthDate,
                    sex,
                    password
                })
            })
            const data = await response.json()
            console.log(data);
            set({ isLoading: false, isAuthenticated: true, user: data.user})
        } catch (error) {
            set({ isLoading: false, error: error.message})
            console.log(error);
            throw error
        }
    },    
    verify_login: async (code) => {
        set({
            isLoading: true,
            error: null
        })
        try {
            const response = await fetch(`${API_URL}/verify_login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ code })
            })
            const data = await response.json()
            
            if (data.isAuthenticated) {
                set({ isLoading: false, isAuthenticated: true, user: data.user });
                return data
            } else {
                set({ isLoading: false, error: data.message });
                return data
            }
        } catch (error) {
            set({ isLoading: false, error: error.message})
            console.log(error);
            throw error
        }
    }    
}))