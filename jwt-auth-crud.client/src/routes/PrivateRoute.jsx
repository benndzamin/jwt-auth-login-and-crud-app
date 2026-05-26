// routes/PrivateRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PrivateRoute = ({ allowedRoles }) => {
    // Extract 'user' and 'loading' from the AuthContext
    const { user, loading } = useAuth();

    // Check for the token directly in the session storage as a secondary fallback during login
    const hasToken = !!sessionStorage.getItem('token');

    // STEP 1: If the Context is still loading the state but the token is present,
    // display a spinner and prevent the router from prematurely redirecting back to Login.
    if (loading && hasToken) {
        return (
            <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
                <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    // STEP 2: Once loading is complete, if there is truly no user and no token, redirect to login page
    if (!user && !hasToken) {
        return <Navigate to="/login" replace />;
    }

    // STEP 3: If the user is authenticated but does not possess the required role, redirect to unauthorized page
    if (user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Everything is valid, proceed to the requested dashboard route
    return <Outlet />;
};