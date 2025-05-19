import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskUpload from './pages/TaskUpload';
import TaskVerification from './pages/TaskVerification';
import AvailableUsers from './pages/AvailableUsers';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/task-upload/:pairingId"
              element={
                <PrivateRoute>
                  <TaskUpload />
                </PrivateRoute>
              }
            />
            <Route
              path="/task-verification/:pairingId"
              element={
                <PrivateRoute>
                  <TaskVerification />
                </PrivateRoute>
              }
            />
            <Route
              path="/available-users"
              element={
                <PrivateRoute>
                  <AvailableUsers />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;