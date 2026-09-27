import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
    const { user, logout, showToast } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const role = user?.role || 'tester';
    const username = user?.name || user?.username || (role === 'admin' ? 'Admin' : role === 'viewer' ? 'Quality Reviewer' : 'Nishant');
    const hasActiveSession = !!localStorage.getItem('InstrumentData');

    const handleBlockedNav = (e, path) => {
        if (!hasActiveSession && (path === '/test-plan' || path === '/tests')) {
            e.preventDefault();
            showToast('No active test session found. Please start a new test to proceed.');
        }
    };

    return (
        <aside className="w-[260px] bg-[#090A0F] flex flex-col fixed top-0 left-0 bottom-0 z-[100] border-r border-white/10">
            {/* Sidebar Brand Header */}
            <div className="px-5 py-6 border-b border-white/10 flex items-center gap-3">
                <div className="w-9 h-9 bg-[#2563EB] rounded-lg grid place-items-center color-white text-lg shadow-md text-white">
                    <i className="fas fa-balance-scale-right"></i>
                </div>
                <div className="text-white font-bold text-base font-['Outfit'] tracking-wide">
                    NAWI
                </div>
            </div>
            
            {/* Sidebar Navigation Items */}
            <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
                {role === 'admin' ? (
                    <>
                        <NavLink 
                            to="/admin" 
                            className={({ isActive }) => `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all no-underline border-l-4 ${
                                isActive ? 'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]' : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'
                            }`}
                        >
                            <i className="fas fa-user-shield w-5 text-center"></i> <span>Admin Dashboard</span>
                        </NavLink>
                        <NavLink 
                            to="/history" 
                            className={({ isActive }) => `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all no-underline border-l-4 ${
                                isActive ? 'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]' : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'
                            }`}
                        >
                            <i className="fas fa-history w-5 text-center"></i> <span>All Reports</span>
                        </NavLink>
                    </>
                ) : role === 'viewer' ? (
                    <>
                        <NavLink 
                            to="/viewer" 
                            className={({ isActive }) => `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all no-underline border-l-4 ${
                                isActive ? 'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]' : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'
                            }`}
                        >
                            <i className="fas fa-search-plus w-5 text-center"></i> <span>Review Queue</span>
                        </NavLink>
                        <NavLink 
                            to="/history" 
                            className={({ isActive }) => `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all no-underline border-l-4 ${
                                isActive ? 'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]' : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'
                            }`}
                        >
                            <i className="fas fa-history w-5 text-center"></i> <span>Archived Reports</span>
                        </NavLink>
                    </>
                ) : (
                    <>
                        <NavLink 
                            to="/home" 
                            className={({ isActive }) => `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all no-underline border-l-4 ${
                                isActive ? 'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]' : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'
                            }`}
                        >
                            <i className="fas fa-th-large w-5 text-center"></i> <span>Dashboard</span>
                        </NavLink>
                        <NavLink 
                            to="/new-test" 
                            className={({ isActive }) => `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all no-underline border-l-4 ${
                                isActive ? 'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]' : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'
                            }`}
                        >
                            <i className="fas fa-plus w-5 text-center"></i> <span>New Test</span>
                        </NavLink>
                        <NavLink 
                            to="/test-plan" 
                            onClick={(e) => handleBlockedNav(e, '/test-plan')}
                            className={({ isActive }) => `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all no-underline border-l-4 ${
                                isActive ? 'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]' : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'
                            }`}
                        >
                            <i className="fas fa-clipboard-list w-5 text-center"></i> 
                            <span>{hasActiveSession && location.pathname !== '/test-plan' ? 'Resume Planner' : 'Test Planner'}</span>
                        </NavLink>
                        <NavLink 
                            to="/tests" 
                            onClick={(e) => handleBlockedNav(e, '/tests')}
                            className={({ isActive }) => `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all no-underline border-l-4 ${
                                isActive ? 'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]' : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'
                            }`}
                        >
                            <i className="fas fa-flask w-5 text-center"></i> 
                            <span>{hasActiveSession && location.pathname !== '/tests' ? 'Resume Execution' : 'Test Execution'}</span>
                        </NavLink>
                        <NavLink 
                            to="/history" 
                            className={({ isActive }) => `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all no-underline border-l-4 ${
                                isActive ? 'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]' : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'
                            }`}
                        >
                            <i className="fas fa-history w-5 text-center"></i> <span>History</span>
                        </NavLink>
                    </>
                )}
            </div>

            {/* Sidebar User Footer */}
            <div className="px-5 py-4 border-t border-white/10 mt-auto bg-[#05060A]">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#0D9488] grid place-items-center text-white font-bold text-sm shadow">
                        {username.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                        <div className="text-white text-sm font-semibold truncate">{username}</div>
                        <div className="text-slate-400 text-xs">{role === 'admin' ? 'Administrator' : role === 'viewer' ? 'Quality Reviewer' : 'Tester'}</div>
                    </div>
                </div>
                <button 
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors w-full cursor-pointer border-0" 
                    onClick={() => { logout(); navigate('/login'); }}
                >
                    <i className="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        </aside>
    );
}

