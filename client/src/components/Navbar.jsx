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
            className="sticky top-0 z-[1000] w-full flex items-center justify-between px-5 md:px-10 py-3.5 border-b-2 border-[#34B1AA] shadow-xl"
            style={{
                background: 'linear-gradient(180deg, #1E1E2C 0%, #0A2C3E 100%)',
                borderColor: '#34B1AA'
            }}
        >
            {/* Brand Logo & Name */}
            <Link 
                to="/" 
                className="flex items-center gap-3 no-underline tracking-wide hover:opacity-95 transition-opacity"
                onClick={closeMenu}
                style={{ textDecoration: 'none' }}
            >
                <i className="fas fa-balance-scale-right text-[#F29F67] text-2xl" style={{ color: '#F29F67' }}></i>
                <span className="text-[#F6F4EC] font-['Outfit'] text-2xl font-bold" style={{ color: '#F6F4EC', fontFamily: 'Outfit, sans-serif' }}>
                    NAWI
                </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
                <a 
                    href="/#how-it-works" 
                    className="text-[#C9D6D6] hover:text-[#F29F67] no-underline text-xs md:text-sm font-semibold uppercase tracking-wider transition-colors duration-200"
                    style={{ color: '#C9D6D6', textDecoration: 'none' }}
                >
                    How it works
                </a>
                <Link 
                    to="/verify" 
                    className={`no-underline text-xs md:text-sm font-semibold uppercase tracking-wider transition-colors duration-200 ${
                        location.pathname.startsWith('/verify') ? 'text-[#F29F67]' : 'text-[#C9D6D6] hover:text-[#F29F67]'
                    }`}
                    style={{ color: location.pathname.startsWith('/verify') ? '#F29F67' : '#C9D6D6', textDecoration: 'none' }}
                >
                    Verification
                </Link>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
                {user ? (
                    <Link 
                        to={user.role === 'admin' ? '/admin' : '/home'} 
                        className="bg-[#F29F67] hover:bg-[#D8824C] text-white px-4 py-2 rounded-md font-semibold text-sm transition-all duration-200 shadow-md hover:-translate-y-0.5 no-underline flex items-center gap-2"
                        style={{ background: '#F29F67', color: 'white', textDecoration: 'none' }}
                    >
                        Dashboard &rarr;
                    </Link>
                ) : (
                    <Link 
                        to="/login" 
                        className={`px-4 py-2 rounded-md font-semibold text-sm transition-all duration-200 no-underline ${
                            location.pathname === '/login' 
                                ? 'bg-[#F29F67] text-white shadow-md' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                        style={{ 
                            background: location.pathname === '/login' ? '#F29F67' : '#f1f5f9', 
                            color: location.pathname === '/login' ? 'white' : '#1e293b', 
                            textDecoration: 'none' 
                        }}
                    >
                        Login
                    </Link>
                )}
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
                className="md:hidden text-[#F6F4EC] hover:text-[#F29F67] p-2 focus:outline-none text-2xl transition-colors cursor-pointer bg-transparent border-0"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle Navigation Menu"
                style={{ background: 'transparent', color: '#F6F4EC', border: 'none' }}
            >
                <i className={mobileOpen ? "fas fa-times" : "fas fa-bars"}></i>
            </button>

            {/* Mobile Menu Dropdown */}
            {mobileOpen && (
                <div 
                    className="md:hidden flex flex-col absolute top-full left-0 right-0 px-6 py-5 gap-4 shadow-2xl z-[999]"
                    style={{
                        background: '#0A2C3E',
                        borderBottom: '2px solid #34B1AA'
                    }}
                >
                    <a 
                        href="/#how-it-works" 
                        className="text-[#C9D6D6] hover:text-[#F29F67] no-underline text-base font-semibold py-2 border-b border-white/10 uppercase tracking-wider transition-colors" 
                        onClick={closeMenu}
                        style={{ color: '#C9D6D6', textDecoration: 'none' }}
                    >
                        How it works
                    </a>
                    <Link 
                        to="/verify" 
                        className={`no-underline text-base font-semibold py-2 border-b border-white/10 uppercase tracking-wider transition-colors ${
                            location.pathname.startsWith('/verify') ? 'text-[#F29F67]' : 'text-[#C9D6D6] hover:text-[#F29F67]'
                        }`} 
                        onClick={closeMenu}
                        style={{ color: location.pathname.startsWith('/verify') ? '#F29F67' : '#C9D6D6', textDecoration: 'none' }}
                    >
                        Verification
                    </Link>
                    <div className="flex flex-col gap-2.5 pt-2">
                        {user ? (
                            <Link 
                                to={user.role === 'admin' ? '/admin' : '/home'} 
                                className="w-full text-center bg-[#F29F67] hover:bg-[#D8824C] text-white py-2.5 rounded-md font-semibold text-sm shadow-md transition-all no-underline block" 
                                onClick={closeMenu}
                                style={{ background: '#F29F67', color: 'white', textDecoration: 'none' }}
                            >
                                Dashboard &rarr;
                            </Link>
                        ) : (
                            <Link 
                                to="/login" 
                                className={`w-full text-center py-2.5 rounded-md font-semibold text-sm transition-colors no-underline block ${
                                    location.pathname === '/login' 
                                        ? 'bg-[#F29F67] text-white shadow-md' 
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                                }`}
                                onClick={closeMenu}
                                style={{ 
                                    background: location.pathname === '/login' ? '#F29F67' : '#f1f5f9', 
                                    color: location.pathname === '/login' ? 'white' : '#1e293b', 
                                    textDecoration: 'none' 
                                }}
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



