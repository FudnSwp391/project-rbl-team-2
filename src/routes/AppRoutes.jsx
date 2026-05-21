import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/Landing/LandingPage';
import CVManager from '../pages/CV/CVManager';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import Profile from '../pages/Auth/Profile';
import ProtectedRoute from '../ProtectedRoute';

// Placeholder components
const Dashboard = () => <div className="container animate-fade"><h1>User Dashboard</h1></div>;
const MockInterview = () => <div className="container animate-fade"><h1>AI Mock Interview Room</h1></div>;
const AdminPanel = () => <div className="container animate-fade"><h1>Admin Dashboard</h1></div>;

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Protected Routes */}
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/interview" element={<ProtectedRoute><MockInterview /></ProtectedRoute>} />
      <Route path="/cv-analysis" element={<ProtectedRoute><CVManager /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
    </Routes>
  );
};

export default AppRoutes;
