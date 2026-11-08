import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SplashScreen from './SplashScreen/SplashScreen';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <SplashScreen />;
    }

    if (!user) return <Navigate to="/login" replace />;
    return children;
};

export default ProtectedRoute;
