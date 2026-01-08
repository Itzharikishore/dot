import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Auth pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Dashboard pages
import Dashboard from './pages/Dashboard/Dashboard';

// Children management
import ChildrenList from './pages/Children/ChildrenList';
import ChildDetail from './pages/Children/ChildDetail';
import ChildForm from './pages/Children/ChildForm';

// Activities
import ActivitiesList from './pages/Activities/ActivitiesList';
import ActivityDetail from './pages/Activities/ActivityDetail';
import ActivityForm from './pages/Activities/ActivityForm';

// Progress tracking
import ProgressTracking from './pages/Progress/ProgressTracking';
import ProgressDetail from './pages/Progress/ProgressDetail';

// Assignments
import AssignmentsList from './pages/Assignments/AssignmentsList';
import AssignmentForm from './pages/Assignments/AssignmentForm';

// Home Programs
import HomeProgramsList from './pages/HomePrograms/HomeProgramsList';
import HomeProgramDetail from './pages/HomePrograms/HomeProgramDetail';
import HomeProgramForm from './pages/HomePrograms/HomeProgramForm';

// Patient Details
import PatientDetails from './pages/PatientDetails/PatientDetails';

// Notifications
import Notifications from './pages/Notifications/Notifications';

// Profile
import Profile from './pages/Profile/Profile';

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Children Management */}
          <Route path="children" element={<ChildrenList />} />
          <Route path="children/new" element={<ChildForm />} />
          <Route path="children/:id" element={<ChildDetail />} />
          <Route path="children/:id/edit" element={<ChildForm />} />

          {/* Activities */}
          <Route path="activities" element={<ActivitiesList />} />
          <Route
            path="activities/new"
            element={
              <ProtectedRoute allowedRoles={['therapist', 'superuser']}>
                <ActivityForm />
              </ProtectedRoute>
            }
          />
          <Route path="activities/:id" element={<ActivityDetail />} />
          <Route
            path="activities/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['therapist', 'superuser']}>
                <ActivityForm />
              </ProtectedRoute>
            }
          />

          {/* Progress Tracking */}
          <Route path="progress" element={<ProgressTracking />} />
          <Route path="progress/:id" element={<ProgressDetail />} />

          {/* Assignments */}
          <Route
            path="assignments"
            element={
              <ProtectedRoute allowedRoles={['therapist', 'superuser']}>
                <AssignmentsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="assignments/new"
            element={
              <ProtectedRoute allowedRoles={['therapist', 'superuser']}>
                <AssignmentForm />
              </ProtectedRoute>
            }
          />

          {/* Home Programs */}
          <Route
            path="home-programs"
            element={
              <ProtectedRoute allowedRoles={['therapist', 'superuser']}>
                <HomeProgramsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="home-programs/new"
            element={
              <ProtectedRoute allowedRoles={['therapist', 'superuser']}>
                <HomeProgramForm />
              </ProtectedRoute>
            }
          />
          <Route path="home-programs/:id" element={<HomeProgramDetail />} />
          <Route
            path="home-programs/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['therapist', 'superuser']}>
                <HomeProgramForm />
              </ProtectedRoute>
            }
          />

          {/* Patient Details */}
          <Route path="patient-details" element={<PatientDetails />} />

          {/* Notifications */}
          <Route path="notifications" element={<Notifications />} />

          {/* Profile */}
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;
