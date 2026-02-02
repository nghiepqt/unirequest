import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their appropriate home based on role, or accessible error page
        if (user.role === 'student') return <Navigate to="/student" replace />;
        if (user.role === 'intermediary') return <Navigate to="/intermediary" replace />;
        if (user.role === 'backoffice') return <Navigate to="/tech" replace />;
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;
