import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/Landing/LandingPage';
import CVManager from '../pages/CV/CVManager';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import Profile from '../pages/Auth/Profile';
import ProtectedRoute from '../ProtectedRoute';
import AdminRoute from '../AdminRoute';
import MentorRoute from '../MentorRoute';
import Dashboard from '../pages/Dashboard/Dashboard';
import PricingPage from '../pages/Subscriptions/PricingPage';
import AdminPanel from '../pages/Admin/AdminPanel';

// Recruiter Components
import RecruiterDashboard from '../pages/Recruiter/RecruiterDashboard';
import JobManagement from '../pages/Recruiter/JobManagement';
import PostJob from '../pages/Recruiter/PostJob';
import BlogManagement from '../pages/Recruiter/BlogManagement';
import PostBlog from '../pages/Recruiter/PostBlog';
import CompanyProfile from '../pages/Recruiter/CompanyProfile';
import RecruiterRegistration from '../pages/Recruiter/RecruiterRegistration';

// Mentor Components
import MentorDashboard from '../pages/Mentor/MentorDashboard';
import MentorBlogManagement from '../pages/Mentor/MentorBlogManagement';
import MentorPostBlog from '../pages/Mentor/MentorPostBlog';
import MentorReviews from '../pages/Mentor/MentorReviews';
import MentorReviewDetail from '../pages/Mentor/MentorReviewDetail';
import MentorSchedule from '../pages/Mentor/MentorSchedule';
import MentorSession from '../pages/Mentor/MentorSession';
import MentorRegistration from '../pages/Mentor/MentorRegistration';

// Public Views
import CompanyView from '../pages/Public/CompanyView';
import BlogList from '../pages/Public/BlogList';
import BlogPost from '../pages/Public/BlogPost';
import JobView from '../pages/Public/JobView';
import JobList from '../pages/Public/JobList';

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
      
      {/* Public Recruiter/Company views */}
      <Route path="/company/:id" element={<CompanyView />} />
      <Route path="/company/:companyId/job/:jobId" element={<JobView />} />
      <Route path="/jobs" element={<JobList />} />
      <Route path="/blogs" element={<BlogList />} />
      <Route path="/blog/:id" element={<BlogPost />} />
      
      {/* Protected User Routes */}
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/interview" element={<ProtectedRoute><MockInterviewPlaceholder /></ProtectedRoute>} />
      <Route path="/cv-analysis" element={<ProtectedRoute><CVManager /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

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

      {/* Mentor Registration (public, requires login) */}
      <Route path="/mentor-register" element={<MentorRegistration />} />

      {/* Protected Mentor Routes */}
      <Route path="/mentor" element={<MentorRoute><MentorDashboard /></MentorRoute>} />
      <Route path="/mentor/blogs" element={<MentorRoute><MentorBlogManagement /></MentorRoute>} />
      <Route path="/mentor/blogs/new" element={<MentorRoute><MentorPostBlog /></MentorRoute>} />
      <Route path="/mentor/blogs/edit/:id" element={<MentorRoute><MentorPostBlog /></MentorRoute>} />
      <Route path="/mentor/reviews" element={<MentorRoute><MentorReviews /></MentorRoute>} />
      <Route path="/mentor/reviews/:id" element={<MentorRoute><MentorReviewDetail /></MentorRoute>} />
      <Route path="/mentor/schedule" element={<MentorRoute><MentorSchedule /></MentorRoute>} />
      <Route path="/mentor/schedule/session/:id" element={<MentorRoute><MentorSession /></MentorRoute>} />
    </Routes>
  );
};

export default AppRoutes;
