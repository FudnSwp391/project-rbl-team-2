import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from "./supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (sessionUser) => {
        if (!sessionUser) {
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
        }
        setUser(sessionUser);
        let { data, error } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).single();

        // Self-healing: If user exists in Auth but has no row in the profiles table, create it immediately!
        if ((!data || error) && sessionUser) {
            console.info('[AuthContext] Profile missing, creating self-healed profile row for:', sessionUser.email);
            const newProfile = {
                id: sessionUser.id,
                email: sessionUser.email,
                full_name: sessionUser.user_metadata?.full_name || sessionUser.email.split('@')[0],
                role: 'user',
                plan: 'Free',
                status: 'active',
                created_at: new Date().toISOString()
            };

            const { data: insertedData, error: insertError } = await supabase
                .from('profiles')
                .insert([newProfile])
                .select()
                .single();

            if (!insertError) {
                data = insertedData;
                console.info('[AuthContext] Profile successfully healed!');
            } else {
                console.error('[AuthContext] Failed to heal profile:', insertError.message);
            }
        }

        if (data?.status === 'banned') {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
        } else {
            if (data && data.plan) {
                const { data: planData } = await supabase.from('subscription_plans').select('*').eq('name', data.plan).single();
                if (planData) {
                    data.planLimits = {
                        max_mentor_bookings: planData.max_mentor_bookings || 0,
                        max_ai_interviews: planData.max_ai_interviews || 0,
                        max_questions: planData.max_questions || 5
                    };
                }
            }
            setProfile(data || null);
        }
        setLoading(false);
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user);
        } else {
            const { data } = await supabase.auth.getSession();
            if (data?.session?.user) {
                await fetchProfile(data.session.user);
            }
        }
    };

    useEffect(() => {

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            fetchProfile(session?.user);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            fetchProfile(session?.user);
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
        profile,
        loading,
        register,
        login,
        loginWithOAuth,
        logout,
        resetPassword,
        updateProfile,
        updatePassword,
        refreshProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
