import { Link, useLocation, Navigate, Outlet } from 'react-router-dom';
import { User, Shield, Wrench, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const { user, logout } = useAuth();

    const isActive = (path) => location.pathname === path;

    if (!user) return <Navigate to="/login" replace />;

    const getNavItems = () => {
        switch (user.role) {
            case 'student':
                return [{ path: '/student', label: 'Student Portal', icon: User, color: 'text-blue-600' }];
            case 'intermediary':
                return [{ path: '/intermediary', label: 'Intermediary System', icon: Shield, color: 'text-purple-600' }];
            case 'backoffice':
                return [{ path: '/tech', label: 'Technician App', icon: Wrench, color: 'text-orange-600' }]; // Display as Technician App
            default:
                return [];
        }
    };

    const navItems = getNavItems();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-gray-800">UniRequest</span>
                            {user && (
                                <span className="ml-4 px-2 py-1 bg-gray-100 rounded text-xs text-gray-500 uppercase">
                                    {user.role === 'backoffice' ? 'Technician' : user.role}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex space-x-4">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${isActive(item.path)
                                            ? `${item.color} border-current`
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <item.icon className="w-4 h-4 mr-2" />
                                        {item.label}
                                    </Link>
                                ))}
                            </div>

                            <button
                                onClick={logout}
                                className="ml-4 text-gray-400 hover:text-red-500 transition-colors"
                                title="Đăng xuất"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
            <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
                    Demo Application for Automatic Request Forwarding
                </div>
            </footer>
        </div>
    );
};

export default Layout;
