import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const success = await login(formData.email, formData.password);
        if (success) {
            navigate('/');
        } else {
            setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 border border-gray-200 rounded-none shadow-sm transition-all duration-300">
                <div>
                    <h2 className="mt-6 text-center text-4xl font-bold text-vin-blue tracking-tight uppercase">
                        Đăng nhập
                    </h2>
                    <p className="mt-4 text-center text-sm text-gray-500 font-medium">
                        HOẶC <Link to="/register" className="text-vin-red hover:underline decoration-2 underline-offset-4">ĐĂNG KÝ TÀI KHOẢN MỚI</Link>
                    </p>
                </div>
                <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 border-l-4 border-vin-red p-4 text-vin-red text-sm font-semibold">
                            {error}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 group-focus-within:text-vin-blue transition-colors">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-400 text-vin-dark focus:outline-none focus:ring-1 focus:ring-vin-blue focus:border-vin-blue transition-all sm:text-sm"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 group-focus-within:text-vin-blue transition-colors">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-400 text-vin-dark focus:outline-none focus:ring-1 focus:ring-vin-blue focus:border-vin-blue transition-all sm:text-sm"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-none text-white bg-vin-blue hover:bg-[#0d3b6b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vin-blue transition-all uppercase tracking-widest"
                        >
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
