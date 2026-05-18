import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/Landing/LandingPage';
import CVManager from '../pages/CV/CVManager';

// Placeholder components
const Login = () => <div className="container animate-fade"><h1>Login Page</h1></div>;
const Register = () => <div className="container animate-fade"><h1>Register Page</h1></div>;
const Dashboard = () => <div className="container animate-fade"><h1>User Dashboard</h1></div>;
const MockInterview = () => <div className="container animate-fade"><h1>AI Mock Interview Room</h1></div>;
const AdminPanel = () => <div className="container animate-fade"><h1>Admin Dashboard</h1></div>;

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/interview" element={<MockInterview />} />
      <Route path="/cv-analysis" element={<CVManager />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  );
};

export default AppRoutes;
