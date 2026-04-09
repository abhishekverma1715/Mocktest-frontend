import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingScreen from './components/common/LoadingScreen';

// ── Lazy-loaded User Pages ─────────────────────────────────────────────
const LoginPage        = lazy(() => import('./pages/LoginPage'));
const RegisterPage     = lazy(() => import('./pages/RegisterPage'));
const DashboardPage    = lazy(() => import('./pages/DashboardPage'));
const TestsPage        = lazy(() => import('./pages/TestsPage'));
const ExamPage         = lazy(() => import('./pages/ExamPage'));
const ResultPage       = lazy(() => import('./pages/ResultPage'));
const HistoryPage      = lazy(() => import('./pages/HistoryPage'));
const ProfilePage      = lazy(() => import('./pages/ProfilePage'));
const LeaderboardPage  = lazy(() => import('./pages/LeaderboardPage'));
const BookmarksPage    = lazy(() => import('./pages/BookmarksPage'));
const VideosPage       = lazy(() => import('./pages/VideosPage'));
const MembershipPage   = lazy(() => import('./pages/MembershipPage'));
const FeedbackPage     = lazy(() => import('./pages/FeedbackPage'));
const StudyMaterialPage= lazy(() => import('./pages/StudyMaterialPage'));

// ── Lazy-loaded Admin Pages ────────────────────────────────────────────
const AdminLoginPage  = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboard  = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminQuestions  = lazy(() => import('./pages/admin/AdminQuestions'));
const AdminTests      = lazy(() => import('./pages/admin/AdminTests'));
const AdminUsers      = lazy(() => import('./pages/admin/AdminUsers'));
const AdminResults    = lazy(() => import('./pages/admin/AdminResults'));
const AdminVideos     = lazy(() => import('./pages/admin/AdminVideos'));
const AdminReports    = lazy(() => import('./pages/admin/AdminReports'));
const AdminPayments   = lazy(() => import('./pages/admin/AdminPayments'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminFeedback   = lazy(() => import('./pages/admin/AdminFeedback'));
const AdminTeachers   = lazy(() => import('./pages/admin/AdminTeachers'));
const AdminProfile    = lazy(() => import('./pages/admin/AdminProfile'));
const AdminMaterial   = lazy(() => import('./pages/admin/AdminMaterial'));

// ── Lazy-loaded Teacher Pages ──────────────────────────────────────────
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const TeacherQuestions = lazy(() => import('./pages/teacher/TeacherQuestions'));
const TeacherTests     = lazy(() => import('./pages/teacher/TeacherTests'));
const TeacherVideos    = lazy(() => import('./pages/teacher/TeacherVideos'));

// ── Route Guards ───────────────────────────────────────────────────────
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles.length > 0 && !roles.includes(user.role)) {
    if (user.role === 'admin')   return <Navigate to="/admin" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) {
    if (user.role === 'admin')   return <Navigate to="/admin" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth */}
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* User Routes */}
        <Route path="/dashboard"     element={<ProtectedRoute roles={['user']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/tests"         element={<ProtectedRoute roles={['user']}><TestsPage /></ProtectedRoute>} />
        <Route path="/exam/:testId"  element={<ProtectedRoute roles={['user']}><ExamPage /></ProtectedRoute>} />
        <Route path="/result/:resultId" element={<ProtectedRoute roles={['user']}><ResultPage /></ProtectedRoute>} />
        <Route path="/history"       element={<ProtectedRoute roles={['user']}><HistoryPage /></ProtectedRoute>} />
        <Route path="/profile"       element={<ProtectedRoute roles={['user']}><ProfilePage /></ProtectedRoute>} />
        <Route path="/leaderboard"   element={<ProtectedRoute roles={['user']}><LeaderboardPage /></ProtectedRoute>} />
        <Route path="/bookmarks"     element={<ProtectedRoute roles={['user']}><BookmarksPage /></ProtectedRoute>} />
        <Route path="/videos"        element={<ProtectedRoute roles={['user']}><VideosPage /></ProtectedRoute>} />
        <Route path="/membership"    element={<ProtectedRoute roles={['user']}><MembershipPage /></ProtectedRoute>} />
        <Route path="/feedback"      element={<ProtectedRoute roles={['user']}><FeedbackPage /></ProtectedRoute>} />
        <Route path="/study-material"element={<ProtectedRoute roles={['user']}><StudyMaterialPage /></ProtectedRoute>} />

        {/* Teacher Routes */}
        <Route path="/teacher"           element={<ProtectedRoute roles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/teacher/questions" element={<ProtectedRoute roles={['teacher']}><TeacherQuestions /></ProtectedRoute>} />
        <Route path="/teacher/tests"     element={<ProtectedRoute roles={['teacher']}><TeacherTests /></ProtectedRoute>} />
        <Route path="/teacher/videos"    element={<ProtectedRoute roles={['teacher']}><TeacherVideos /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/login"      element={<PublicRoute><AdminLoginPage /></PublicRoute>} />
        <Route path="/admin"            element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/questions"  element={<ProtectedRoute roles={['admin']}><AdminQuestions /></ProtectedRoute>} />
        <Route path="/admin/tests"      element={<ProtectedRoute roles={['admin']}><AdminTests /></ProtectedRoute>} />
        <Route path="/admin/users"      element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/results"    element={<ProtectedRoute roles={['admin']}><AdminResults /></ProtectedRoute>} />
        <Route path="/admin/videos"     element={<ProtectedRoute roles={['admin']}><AdminVideos /></ProtectedRoute>} />
        <Route path="/admin/reports"    element={<ProtectedRoute roles={['admin']}><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/payments"   element={<ProtectedRoute roles={['admin']}><AdminPayments /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute roles={['admin']}><AdminCategories /></ProtectedRoute>} />
        <Route path="/admin/feedback"   element={<ProtectedRoute roles={['admin']}><AdminFeedback /></ProtectedRoute>} />
        <Route path="/admin/teachers"   element={<ProtectedRoute roles={['admin']}><AdminTeachers /></ProtectedRoute>} />
        <Route path="/admin/profile"    element={<ProtectedRoute roles={['admin']}><AdminProfile /></ProtectedRoute>} />
        <Route path="/admin/material"   element={<ProtectedRoute roles={['admin']}><AdminMaterial /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#12202e',
              color: '#f0f4fc',
              border: '1px solid rgba(99,102,241,0.22)',
              fontFamily: "'Outfit', sans-serif",
              fontSize: '0.875rem',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#12202e' } },
            error:   { iconTheme: { primary: '#f43f5e', secondary: '#12202e' } },
            duration: 3500,
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
