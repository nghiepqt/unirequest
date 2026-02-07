import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, Shield } from 'lucide-react';

const RegisterPage = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'student'
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const success = await register(formData);
        if (success) {
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } else {
            setError('Đăng ký thất bại. Email có thể đã tồn tại.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8 font-montserrat">
            <div className="max-w-md w-full space-y-10 bg-white p-12 rounded-none border border-gray-100 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-vin-red"></div>
                <div className="text-center">
                    <h1 className="text-4xl font-black text-vin-blue uppercase tracking-tighter">
                        Uni<span className="text-vin-red">Request</span>
                    </h1>
                    <h2 className="mt-6 text-xl font-bold text-vin-dark uppercase tracking-widest">
                        Tạo Tài Khoản
                    </h2>
                    <p className="mt-3 text-sm text-gray-500 font-medium">
                        Đã có tài khoản? <Link to="/login" className="font-bold text-vin-blue hover:text-vin-red transition-colors underline decoration-2 underline-offset-4">Đăng nhập ngay</Link>
                    </p>
                </div>
                <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-vin-red/10 border-l-4 border-vin-red p-4 animate-shake">
                            <p className="text-sm font-bold text-vin-red text-center uppercase tracking-wider">{error}</p>
                        </div>
                    )}

                    <div className="space-y-5">
                        <div className="group">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 group-focus-within:text-vin-blue transition-colors">Email Address</label>
                            <input
                                type="email"
                                required
                                placeholder="name@vinuni.edu.vn"
                                className="appearance-none rounded-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-300 text-vin-dark font-medium focus:outline-none focus:ring-1 focus:ring-vin-blue focus:border-vin-blue transition-all"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="group">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 group-focus-within:text-vin-blue transition-colors">Full Name</label>
                            <input
                                type="text"
                                required
                                placeholder="NGUYEN VAN A"
                                className="appearance-none rounded-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-300 text-vin-dark font-medium focus:outline-none focus:ring-1 focus:ring-vin-blue focus:border-vin-blue transition-all uppercase"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>

                        <div className="group">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 group-focus-within:text-vin-blue transition-colors">Password</label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                className="appearance-none rounded-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-300 text-vin-dark font-medium focus:outline-none focus:ring-1 focus:ring-vin-blue focus:border-vin-blue transition-all"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <div className="group">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 group-focus-within:text-vin-blue transition-colors">Access Level (Demo)</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="block w-full px-4 py-3 border border-gray-200 bg-white rounded-none text-sm font-bold text-vin-blue uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-vin-blue focus:border-vin-blue transition-all"
                            >
                                <option value="student">STUDENT PORTAL</option>
                                <option value="intermediary">INTERMEDIARY SYSTEM</option>
                                <option value="backoffice">TECHNICAL TEAM</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-[11px] font-bold uppercase tracking-[0.2em] text-white bg-vin-blue hover:bg-[#0d3b6b] transition-all shadow-xl active:translate-y-0.5 rounded-none"
                    >
                        Create Account
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
