import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from "./supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Registration with email, password and optional metadata
    const register = async (email, password, options = {}) => {
        return await supabase.auth.signUp({
            email,
            password,
            options
        });
    };

    // Login with email and password
    const login = async (email, password) => {
        return await supabase.auth.signInWithPassword({
            email,
            password,
        });
    };

    // Logout
    const logout = async () => {
        return await supabase.auth.signOut();
    };

    // Send password reset email
    const resetPassword = async (email) => {
        return await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password',
        });
    };

    // Update user profile metadata
    const updateProfile = async (data) => {
        return await supabase.auth.updateUser({
            data: data
        });
    };

    // Update user password
    const updatePassword = async (newPassword) => {
        return await supabase.auth.updateUser({
            password: newPassword
        });
    };

    // Login with OAuth Provider (Google, Facebook, etc.)
    const loginWithOAuth = async (provider) => {
        return await supabase.auth.signInWithOAuth({
            provider: provider,
        });
    };

    const value = {
        user,
        loading,
        register,
        login,
        loginWithOAuth,
        logout,
        resetPassword,
        updateProfile,
        updatePassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
