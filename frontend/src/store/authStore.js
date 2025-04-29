import { create } from "zustand";
import { AUTH_API } from '../config/api';

const API_URL = AUTH_API;

export const useAuthStore = create((set) => ({
    user: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    isCheckingAuth: true,
    message: null,
    verificationData: null,
    requiresVerification: false,
    verificationEmail: null,

    // Initialize auth state when store is created
    initialize: async () => {
        await useAuthStore.getState().checkAuth();
    },

    // Universal authenticated fetch method
    authFetch: async (url, options = {}) => {
        const token = localStorage.getItem('authToken');
        console.log('Token from localStorage:', token);  // Added debug log

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            console.error('No token found in localStorage.');
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                credentials: 'include',
            });

            if (response.status === 401) {
                localStorage.removeItem('authToken');
                set({ isAuthenticated: false, user: null });
                throw new Error('Session expired. Please login again.');
            }

            return response;
        } catch (error) {
            console.error('Auth fetch error:', error);
            throw error;
        }
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (data.user?.token) {
                localStorage.setItem('authToken', data.user.token);  // Store token in localStorage
                set({
                    isLoading: false,
                    isAuthenticated: true,  // Set isAuthenticated to true
                    user: data.user,
                });
                console.log('Logged in successfully, user:', data.user);
                return data;
            }

            throw new Error('Invalid login response');
        } catch (error) {
            set({ 
                isLoading: false,
                isAuthenticated: false,  // Ensure it's set to false on failure
                user: null,
                error: error.message,
            });
            console.error('Login error:', error);
            throw error;
        }
    },

    checkAuth: async () => {
        set({ isCheckingAuth: true, error: null });
        try {
            const token = localStorage.getItem('authToken');
            console.log('Checking auth with token:', token); // Debug log for token check
            if (!token) {
                set({ isCheckingAuth: false, isAuthenticated: false, user: null });
                return false;
            }

            const response = await fetch(`${API_URL}/check_auth`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                localStorage.removeItem('authToken');
                throw new Error('Session expired');
            }

            const data = await response.json();
            set({ isCheckingAuth: false, isAuthenticated: true, user: data.user });
            console.log('User authenticated:', data.user);  // Added log
            return true;
        } catch (error) {
            localStorage.removeItem('authToken');
            set({
                isCheckingAuth: false,
                isAuthenticated: false,
                user: null,
                error: error.message,
            });
            console.error('Auth check error:', error);  // Log error here
            return false;
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
            
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('pendingVerification');
            set({ 
                isLoading: false, 
                isAuthenticated: false, 
                user: null,
                requiresVerification: false,
                verificationData: null
            });
        } catch (error) {
            set({ isLoading: false, error: error.message });
            throw error;
        }
    },    

    forgotpassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/forgot_password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    message: `Server error: ${response.status} ${response.statusText}`
                }));
                throw new Error(errorData.message || 'Password reset request failed');
            }
            
            const data = await response.json();
            set({ isLoading: false, message: data.message });
            return data;
        } catch (error) {
            set({ isLoading: false, error: error.message });
            throw error;
        }
    },

    resetpassword: async (token, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/reset_password/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ password })
            });
            
            const data = await response.json();
            set({ isLoading: false, message: data.message });
            return data;
        } catch (error) {
            set({ isLoading: false, error: error.message });
            throw error;
        }
    },

    checkPasswordResetToken: async (token) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/check_reset_token/${token}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error('Invalid or expired token');
            }
            
            const data = await response.json();
            return data.isValid;
        } catch (error) {
            set({ error: error.message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    refreshToken: async () => {
        set({ isLoading: true });
        try {
            const response = await fetch(`${API_URL}/refresh_token`, {
                method: 'POST',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.token) {
                localStorage.setItem('authToken', data.token);
                set({ user: data.user, isAuthenticated: true });
            }
            
            return data.token;
        } catch (error) {
            set({ error: error.message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    clearError: () => set({ error: null }),
    clearMessage: () => set({ message: null }),
}));