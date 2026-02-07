import { Link, Navigate, Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();

    if (!user) return <Navigate to="/login" replace />;

    return (
        <div className="min-h-screen bg-white flex flex-col font-montserrat">
            <nav className="bg-vin-blue shadow-md relative z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20">
                        <div className="flex items-center">
                            <span className="text-2xl font-black text-white uppercase tracking-tighter">
                                Uni<span className="text-vin-red">Request</span>
                            </span>
                        </div>

                        <div className="flex items-center space-x-8">
                            <button
                                onClick={logout}
                                className="ml-4 p-2 text-white/70 hover:text-vin-red hover:bg-white/10 transition-all rounded-none"
                                title="Đăng xuất"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in-up">
                <Outlet />
            </main>
            <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">
                        VinUniversity Facility Management System
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
