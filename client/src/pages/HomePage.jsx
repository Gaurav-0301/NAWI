import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { cachedFetch } from '../utils/apiCache';

export default function HomePage() {
    const { user, authFetch } = useAuth();
    const navigate = useNavigate();

    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0 });
    const [recentTests, setRecentTests] = useState([]);
    const [pendingInfo, setPendingInfo] = useState(null);

    useEffect(() => {
        cachedFetch(authFetch, '/api/history')
            .then(data => {
                if (Array.isArray(data)) {
                    setReports(data);
                    let passed = 0;
                    let failed = 0;
                    const recent = [];

                    data.forEach((r, idx) => {
                        let isPass = r.status === 'PASS';
                        if (isPass) passed++;
                        else failed++;

                        if (idx < 4) {
                            recent.push({
                                id: r._id ? r._id.substring(0, 8).toUpperCase() : 'N/A',
                                fullId: r._id,
                                name: r.instrument_id || "Unknown Instrument",
                                status: isPass ? "PASS" : "FAIL"
                            });
                        }
                    });

                    setStats({ total: data.length, passed, failed });
                    setRecentTests(recent);
                }
            })
            .catch(err => console.error("Error fetching reports:", err));

        try {
            const instStr = localStorage.getItem("InstrumentData");
            if (instStr) {
                const inst = JSON.parse(instStr);
                const name = `${inst.manufacturer || ""} ${inst.model || ""}`.trim() || inst.capacity || "Instrument Test";
                
                const rawPlan = localStorage.getItem("confirmedTestPlan") || localStorage.getItem("testPlan") || "[]";
                const plan = JSON.parse(rawPlan);
                const required = plan.filter(t => t.status === "REQUIRED");

                const resultKeys = { 1: "form0_results", 2: "form1_results", 3: "form2_results", 4: "form3_results", 5: "form_zero_results", 6: "form_tare_results", 8: "form_tilt_results" };
                let doneCount = 0;
                required.forEach(t => {
                    if (localStorage.getItem(resultKeys[t.id])) doneCount++;
                });

                const remaining = Math.max(0, required.length - doneCount);
                if (remaining > 0 || required.length === 0) {
                    setPendingInfo({
                        name,
                        remainingText: required.length === 0 ? "Test plan pending confirmation" : `${remaining} test(s) remaining`
                    });
                }
            }
        } catch (e) {}
    }, [authFetch]);

    const username = user?.name || user?.username || 'Nishant';

    return (
        <div className="flex min-h-screen w-full bg-[#F4F5F7] font-['Plus_Jakarta_Sans']">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 ml-[260px]">
                <Header title="Tester Overview Dashboard" />
                <div className="p-7 md:p-8 flex-1">
                    {/* Welcome Banner */}
                    <div className="mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1 font-['Outfit']">Good day, {username}</h1>
                        <p className="text-slate-500 text-sm">Here's your testing overview and active verification progress</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-7">
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h2 className="text-3xl font-extrabold text-slate-800 mb-0.5">{stats.total}</h2>
                            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Tests</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h2 className="text-3xl font-extrabold text-[#34B1AA] mb-0.5">{user?.role === 'tester' ? stats.total : stats.passed}</h2>
                            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{user?.role === 'tester' ? 'Submitted' : 'Passed'}</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h2 className="text-3xl font-extrabold text-amber-500 mb-0.5">{pendingInfo ? 1 : 0}</h2>
                            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Pending Sessions</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h2 className="text-3xl font-extrabold text-rose-500 mb-0.5">{user?.role === 'tester' ? (reports.filter(r => ['REJECTED_BY_VIEWER', 'REJECTED_BY_ADMIN', 'SENT_BACK_TO_TESTER'].includes(r.workflow_status)).length) : stats.failed}</h2>
                            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{user?.role === 'tester' ? 'Re-Test Needed' : 'Failed'}</p>
                        </div>
                    </div>

                    {/* Pending Session Banner */}
                    {pendingInfo && (
                        <div className="bg-gradient-to-r from-amber-50 to-amber-100/80 border border-amber-300 rounded-xl p-5 mb-7 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                            <div>
                                <h4 className="text-amber-800 font-bold text-sm mb-1 flex items-center gap-2">
                                    <i className="fas fa-clock"></i> Pending Test Session
                                </h4>
                                <p className="text-amber-900 text-sm">
                                    <strong>{pendingInfo.name}</strong> &bull; {pendingInfo.remainingText}
                                </p>
                            </div>
                            <button 
                                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 border-0 cursor-pointer" 
                                onClick={() => navigate('/tests')}
                            >
                                Continue Test Execution <i className="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    )}

                    {/* Content Panels Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Recent Tests Panel */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-200 mb-4 font-['Outfit']">Recent Tests</h3>
                            {recentTests.length > 0 ? (
                                <ul className="divide-y divide-slate-100 list-none p-0 m-0">
                                    {recentTests.map((t, i) => (
                                        <li 
                                            key={i} 
                                            onClick={() => navigate(`/report/${t.fullId}`)} 
                                            className="flex items-center justify-between py-3 hover:bg-slate-50 px-2 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <div>
                                                <strong className="text-slate-800 text-sm">{t.name}</strong>
                                                <span className="text-slate-400 text-xs font-mono ml-2">({t.id})</span>
                                            </div>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${
                                                user?.role === 'tester'
                                                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                                    : t.status === 'PASS' 
                                                        ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                            }`}>
                                                {user?.role === 'tester' ? 'SUBMITTED' : t.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-400 text-center py-6 text-sm">No tests completed yet.</p>
                            )}
                        </div>

                        {/* Quick Actions Panel */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-200 mb-4 font-['Outfit']">Quick Actions</h3>
                            <div className="flex flex-col gap-3">
                                <Link 
                                    to="/new-test" 
                                    className="bg-[#F29F67] hover:bg-[#D8824C] text-white px-5 py-3 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow flex items-center gap-3 no-underline"
                                >
                                    <i className="fas fa-plus"></i> New Test Setup
                                </Link>
                                <Link 
                                    to="/test-plan" 
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center gap-3 no-underline"
                                >
                                    <i className="fas fa-tasks"></i> Automatic Test Planner
                                </Link>
                                <Link 
                                    to="/history" 
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center gap-3 no-underline"
                                >
                                    <i className="fas fa-folder-open"></i> Inspection History
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

