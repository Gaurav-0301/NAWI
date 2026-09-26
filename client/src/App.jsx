import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SkeletonDashboard } from './components/SkeletonLoader';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import NewTestPage from './pages/NewTestPage';
import TestPlanPage from './pages/TestPlanPage';
import TestExecutionPage from './pages/TestExecutionPage';
import HistoryPage from './pages/HistoryPage';
import ReportSummaryPage from './pages/ReportSummaryPage';
import ReportDetailedPage from './pages/ReportDetailedPage';
import CertificatePage from './pages/CertificatePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ViewerDashboardPage from './pages/ViewerDashboardPage';
import PublicVerifyPage from './pages/PublicVerifyPage';

function ProtectedRoute({ children, adminOnly = false }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F4F5F7] p-8">
                <SkeletonDashboard />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/home" replace />;
    }

    return children;
}

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />

                    {/* PUBLIC UNPROTECTED QR & MANUAL VERIFICATION ROUTES */}
                    <Route path="/verify" element={<PublicVerifyPage />} />
                    <Route path="/verify/:reportId" element={<PublicVerifyPage />} />

                    <Route path="/home" element={
                        <ProtectedRoute>
                            <HomePage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/viewer" element={
                        <ProtectedRoute>
                            <ViewerDashboardPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/new-test" element={
                        <ProtectedRoute>
                            <NewTestPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/test-plan" element={
                        <ProtectedRoute>
                            <TestPlanPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/tests" element={
                        <ProtectedRoute>
                            <TestExecutionPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/history" element={
                        <ProtectedRoute>
                            <HistoryPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/report/:id" element={
                        <ProtectedRoute>
                            <ReportSummaryPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/report-detailed/:id" element={
                        <ProtectedRoute>
                            <ReportDetailedPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/certificate/:id" element={<CertificatePage />} />

                    <Route path="/admin" element={
                        <ProtectedRoute adminOnly={true}>
                            <AdminDashboardPage />
                        </ProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}
