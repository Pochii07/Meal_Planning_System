import { create } from "zustand";

const API_URL = 'http://localhost:4000/api/auth';

export const useAuthStore = create((set) => ({
    user: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    isCheckingAuth: true,
    message: null,

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
            set({ isLoading: false, user: data.user})
        } catch (error) {
            set({ isLoading: false, error: error.message})
            console.log(error);
            throw error
        }
    },  
    /** 
     *  verification otp login credentials
     */  
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
    },
    login: async (email, password) => {
        set({
            isLoading: true,
            error: null
        })
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            })
            const data = await response.json()
            console.log(data)
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
    },   
    checkAuth: async () => {    
        set({
            isCheckingAuth: true,
            error: null
        })
        try {
            const response = await fetch(`${API_URL}/check_auth`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            })
            const data = await response.json()
            if(data.user){
                set({ isCheckingAuth: false, isAuthenticated: true, user: data.user });   
            } else {
                set({ isCheckingAuth: false, isAuthenticated: false, user: null})
            }
        } catch (error) {
            set({ isCheckingAuth: false, isAuthenticated: false, user: null})
            console.log(error);
            throw error
        }
    },
    logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await fetch(`${API_URL}/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          });
          set({ isLoading: false, isAuthenticated: false, user: null });
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
    },    
    forgotpassword: async (email) => {
        set({
            isLoading: true,
            error: null
        })
        try {
            const response = await fetch(`${API_URL}/forgot_password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email })
            })
            const data = await response.json()
            
            if (data){
                set({ isLoading: false, message: data.message });
                return data
            } else {
                set({ isLoading: false, error: error.message });
                return data
            }
        } catch (error) {
            set({ isLoading: false, error: error.message})
            console.log(error);
            throw error
        }
    },
    resetpassword: async (token, password) => {
        set({
            isLoading: true,
            error: null
        })
        try {
            const response = await fetch(`${API_URL}/reset_password/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ password })
            })
            const data = await response.json()
            set({ isLoading: false, message: data.message });
            console.log(message)
        } catch (error) {
            set({ isLoading: false, error: error.message})
            console.log(message);
            throw error
        }
    }
}));
