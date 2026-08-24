import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Common/Navbar';
import NotificationToast from './components/Common/NotificationToast';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import CustomerDashboard from './pages/CustomerDashboard';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/" replace /> : <Register />}
          />

          {/* Role-Based Index Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                {user?.role === 'ADMIN' ? (
                  <AdminDashboard />
                ) : user?.role === 'AGENT' ? (
                  <AgentDashboard />
                ) : (
                  <CustomerDashboard />
                )}
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <NotificationToast />
    </div>
  );
}
