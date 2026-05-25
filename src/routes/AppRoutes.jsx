import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/Landing/LandingPage';
import CVManager from '../pages/CV/CVManager';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import Profile from '../pages/Auth/Profile';
import ProtectedRoute from '../ProtectedRoute';
import AdminRoute from '../AdminRoute';
import Dashboard from '../pages/Dashboard/Dashboard';
import PricingPage from '../pages/Subscriptions/PricingPage';
import AdminPanel from '../pages/Admin/AdminPanel';

// Placeholder components
const MockInterviewPlaceholder = () => <div className="container animate-fade"><h1>AI Mock Interview Room</h1></div>;

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/pricing" element={<PricingPage />} />

      {/* Protected Routes */}
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/interview" element={<ProtectedRoute><MockInterviewPlaceholder /></ProtectedRoute>} />
      <Route path="/cv-analysis" element={<ProtectedRoute><CVManager /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
    </Routes>
  );
};

export default AppRoutes;
