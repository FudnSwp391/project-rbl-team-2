import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/Landing/LandingPage';
import CVManager from '../pages/CV/CVManager';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import Profile from '../pages/Auth/Profile';
import ProtectedRoute from '../ProtectedRoute';

// Recruiter Components
import RecruiterDashboard from '../pages/Recruiter/RecruiterDashboard';
import JobManagement from '../pages/Recruiter/JobManagement';
import PostJob from '../pages/Recruiter/PostJob';
import BlogManagement from '../pages/Recruiter/BlogManagement';
import PostBlog from '../pages/Recruiter/PostBlog';
import CompanyProfile from '../pages/Recruiter/CompanyProfile';
import RecruiterRegistration from '../pages/Recruiter/RecruiterRegistration';

// Public Views
import CompanyView from '../pages/Public/CompanyView';
import BlogList from '../pages/Public/BlogList';
import BlogPost from '../pages/Public/BlogPost';
import JobView from '../pages/Public/JobView';
import JobList from '../pages/Public/JobList';

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
      
      {/* Public Recruiter/Company views */}
      <Route path="/company/:id" element={<CompanyView />} />
      <Route path="/company/:companyId/job/:jobId" element={<JobView />} />
      <Route path="/jobs" element={<JobList />} />
      <Route path="/blogs" element={<BlogList />} />
      <Route path="/blog/:id" element={<BlogPost />} />
      
      {/* Protected User Routes */}
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/interview" element={<ProtectedRoute><MockInterview /></ProtectedRoute>} />
      <Route path="/cv-analysis" element={<ProtectedRoute><CVManager /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />

      {/* Protected Recruiter Routes */}
      <Route path="/recruiter-register" element={<RecruiterRegistration />} />
      <Route path="/recruiter" element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />
      <Route path="/recruiter/company" element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />
      <Route path="/recruiter/jobs" element={<ProtectedRoute><JobManagement /></ProtectedRoute>} />
      <Route path="/recruiter/jobs/new" element={<ProtectedRoute><PostJob /></ProtectedRoute>} />
      <Route path="/recruiter/jobs/edit/:id" element={<ProtectedRoute><PostJob /></ProtectedRoute>} />
      <Route path="/recruiter/blogs" element={<ProtectedRoute><BlogManagement /></ProtectedRoute>} />
      <Route path="/recruiter/blogs/new" element={<ProtectedRoute><PostBlog /></ProtectedRoute>} />
      <Route path="/recruiter/blogs/edit/:id" element={<ProtectedRoute><PostBlog /></ProtectedRoute>} />
    </Routes>
  );
};

export default AppRoutes;
