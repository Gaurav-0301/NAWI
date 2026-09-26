import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const data = await login(email, password);
            if (data.user && data.user.role === 'admin') navigate('/admin');
            else if (data.user && data.user.role === 'viewer') navigate('/viewer');
            else navigate('/home');
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F5F7] flex flex-col font-['Plus_Jakarta_Sans']">
            <Navbar />

            <div className="flex-1 flex items-center justify-center p-5">
                {/* Auth Card */}
                <div className="bg-white p-8 md:p-10 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full">
                    {/* Brand Header */}
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-[#F29F67] rounded-xl grid place-items-center text-white text-2xl mx-auto mb-4 shadow-md">
                            <i className="fas fa-balance-scale-right"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-1 font-[Outfit]">
                            Secure Login
                        </h2>
                        <p className="text-slate-500 text-sm">
                            Sign in to access your NAWI verification workspace
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg mb-4 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
                            <input
                                type="email"
                                className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border border-slate-300 rounded-lg text-sm text-slate-800 focus:border-[#F29F67] focus:ring-2 focus:ring-[#F29F67]/20 outline-none transition-all"
                                placeholder="name@organization.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
                            <input
                                type="password"
                                className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border border-slate-300 rounded-lg text-sm text-slate-800 focus:border-[#F29F67] focus:ring-2 focus:ring-[#F29F67]/20 outline-none transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="w-full mt-2 bg-[#F29F67] hover:bg-[#D8824C] text-white py-3 rounded-lg font-semibold text-sm transition-all shadow-md hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 border-0" 
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Authenticating...
                                </>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-slate-400 text-xs">
                        <i className="fas fa-shield-alt"></i> Encrypted JWT & bcrypt Authentication &bull; Schrödinger’s Incident
                    </div>
                </div>
            </div>
        </div>
    );
}


