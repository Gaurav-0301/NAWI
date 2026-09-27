import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    const closeMenu = () => setMobileOpen(false);

    return (
        <nav 
            className="sticky top-0 z-[1000] w-full flex items-center justify-between px-5 md:px-10 py-3.5 border-b border-slate-800 shadow-xl"
            style={{
                background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)'
            }}
        >
            {/* Brand Logo & Name */}
            <Link 
                to="/" 
                className="flex items-center gap-3 no-underline tracking-wide hover:opacity-95 transition-opacity"
                onClick={closeMenu}
                style={{ textDecoration: 'none' }}
            >
                <i className="fas fa-balance-scale-right text-[#2563EB] text-2xl"></i>
                <span className="text-white font-['Outfit'] text-2xl font-bold tracking-tight">
                    NAWI
                </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
                <a 
                    href="/#how-it-works" 
                    className="text-slate-300 hover:text-white no-underline text-xs md:text-sm font-semibold uppercase tracking-wider transition-colors duration-200"
                    style={{ textDecoration: 'none' }}
                >
                    How it works
                </a>
                <Link 
                    to="/verify" 
                    className={`no-underline text-xs md:text-sm font-semibold uppercase tracking-wider transition-colors duration-200 ${
                        location.pathname.startsWith('/verify') ? 'text-[#38BDF8]' : 'text-slate-300 hover:text-white'
                    }`}
                    style={{ textDecoration: 'none' }}
                >
                    Verification
                </Link>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
                {user ? (
                    <Link 
                        to={user.role === 'admin' ? '/admin' : '/home'} 
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-md font-semibold text-sm transition-all duration-200 shadow-md hover:-translate-y-0.5 no-underline flex items-center gap-2"
                        style={{ textDecoration: 'none' }}
                    >
                        Dashboard &rarr;
                    </Link>
                ) : (
                    <Link 
                        to="/login" 
                        className={`px-4 py-2 rounded-md font-semibold text-sm transition-all duration-200 no-underline ${
                            location.pathname === '/login' 
                                ? 'bg-[#2563EB] text-white shadow-md' 
                                : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                        style={{ textDecoration: 'none' }}
                    >
                        Login
                    </Link>
                )}
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
                className="md:hidden text-white hover:text-[#38BDF8] p-2 focus:outline-none text-2xl transition-colors cursor-pointer bg-transparent border-0"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle Navigation Menu"
            >
                <i className={mobileOpen ? "fas fa-times" : "fas fa-bars"}></i>
            </button>

            {/* Mobile Menu Dropdown */}
            {mobileOpen && (
                <div 
                    className="md:hidden flex flex-col absolute top-full left-0 right-0 px-6 py-5 gap-4 shadow-2xl z-[999] bg-[#0F172A] border-b border-slate-800"
                >
                    <a 
                        href="/#how-it-works" 
                        className="text-slate-300 hover:text-white no-underline text-base font-semibold py-2 border-b border-slate-800 uppercase tracking-wider transition-colors" 
                        onClick={closeMenu}
                    >
                        How it works
                    </a>
                    <Link 
                        to="/verify" 
                        className={`no-underline text-base font-semibold py-2 border-b border-slate-800 uppercase tracking-wider transition-colors ${
                            location.pathname.startsWith('/verify') ? 'text-[#38BDF8]' : 'text-slate-300 hover:text-white'
                        }`} 
                        onClick={closeMenu}
                    >
                        Verification
                    </Link>
                    <div className="flex flex-col gap-2.5 pt-2">
                        {user ? (
                            <Link 
                                to={user.role === 'admin' ? '/admin' : '/home'} 
                                className="w-full text-center bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-2.5 rounded-md font-semibold text-sm shadow-md transition-all no-underline block" 
                                onClick={closeMenu}
                            >
                                Dashboard &rarr;
                            </Link>
                        ) : (
                            <Link 
                                to="/login" 
                                className={`w-full text-center py-2.5 rounded-md font-semibold text-sm transition-colors no-underline block ${
                                    location.pathname === '/login' 
                                        ? 'bg-[#2563EB] text-white shadow-md' 
                                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                                }`}
                                onClick={closeMenu}
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
