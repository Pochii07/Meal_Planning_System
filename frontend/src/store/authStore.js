import { create } from "zustand";

const API_URL = 'http://localhost:4000/api/auth';

export const useAuthStore = create((set) => ({
    user: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    isCheckingAuth: true,
    message: null,
    verificationData: null,

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
            
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            const verificationData = {
                email: data.verificationData.email,
                expiresAt: data.verificationData.expiresAt,
                userId: data.verificationData.tempUserId,
                token: data.verificationData.token
            };

            console.log(verificationData)
            sessionStorage.setItem('pendingVerification', JSON.stringify(verificationData));

            set({ isLoading: false, verificationData, user: null});
            return data;
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
            const storedData = sessionStorage.getItem('pendingVerification');
            if (!storedData) {
                throw new Error('No pending verification found');
            }
            const verificationData = JSON.parse(storedData);
            console.log('Registration data:', verificationData);

            const response = await fetch(`${API_URL}/verify_login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    code,
                    email: verificationData.email,
                    userId: verificationData.userId
                 })
            })
            const data = await response.json()
            console.log('Verify_login response:', data); // Debug log
            
            if (!response.ok) {
                throw new Error(data.message || 'Verification failed');
            }
            sessionStorage.removeItem('pendingVerification');
            
            set({ 
                isLoading: false,
                isAuthenticated: true,
                user: data.user,
                verificationData: null
            });
            return data;
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
        });
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            
            if (data.success === true && data.user) {
                set({ 
                    isLoading: false, 
                    isAuthenticated: true, 
                    user: data.user // This will now include the token
                });
                return data;
            }
            set({ 
                isLoading: false, 
                isAuthenticated: false,
                user: null,
                error: data.message 
            });
            return data;
        } catch (error) {
            set({ 
                isLoading: false, 
                error: error.message,
                isAuthenticated: false,
                user: null
            });
            throw error;
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
            console.log(message);
        } catch (error) {
            set({ isLoading: false, error: error.message})
            console.log(error);
            throw error
        }
    }
}));
