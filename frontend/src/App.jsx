import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { RequestProvider } from './context/RequestContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

import StudentPage from './pages/StudentPage';
import Intermediary from './pages/Intermediary';
import TechPage from './pages/TechPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const RoleBasedRedirect = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'student': return <Navigate to="/student" replace />;
    case 'intermediary': return <Navigate to="/intermediary" replace />;
    case 'backoffice': return <Navigate to="/tech" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <RequestProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<Layout />}>
              {/* Public or Common Routes */}
              <Route path="/" element={<RoleBasedRedirect />} />

              {/* Role Protected Routes */}
              <Route element={<PrivateRoute allowedRoles={['student']} />}>
                <Route path="/student" element={<StudentPage />} />
              </Route>

              <Route element={<PrivateRoute allowedRoles={['intermediary']} />}>
                <Route path="/intermediary" element={<Intermediary />} />
              </Route>

              <Route element={<PrivateRoute allowedRoles={['backoffice']} />}>
                <Route path="/tech" element={<TechPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </RequestProvider>
    </AuthProvider>
  );
}

export default App;
