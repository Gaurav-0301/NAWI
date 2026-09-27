import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { SkeletonTable } from '../components/SkeletonLoader';
import { cachedFetch } from '../utils/apiCache';

export default function HistoryPage() {
    const navigate = useNavigate();
    const { authFetch, user } = useAuth();

    const [reports, setReports] = useState([]);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'rejected'
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cachedFetch(authFetch, '/api/history')
            .then(data => {
                if (Array.isArray(data)) {
                    setReports(data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [authFetch]);

    const rejectedReports = useMemo(() => {
        return reports.filter(r => 
            ['REJECTED_BY_VIEWER', 'REJECTED_BY_ADMIN', 'SENT_BACK_TO_TESTER'].includes(r.workflow_status)
        );
    }, [reports]);

    const filteredReports = useMemo(() => {
        const reportsToDisplay = activeTab === 'rejected' ? rejectedReports : reports;
        return reportsToDisplay.filter(r => {
            const idStr = r._id ? r._id.substring(0, 8).toUpperCase() : '';
            const instStr = (r.instrument_id || '').toUpperCase();
            const snStr = (r.serial_no || '').toUpperCase();
            const fullSearch = `${idStr} ${instStr} ${snStr}`;

            if (searchTerm && !fullSearch.includes(searchTerm.toUpperCase())) return false;
            if (filterStatus && r.status !== filterStatus) return false;
            if (filterClass && !r.accuracy_class.includes(filterClass)) return false;
            if (filterDate) {
                const dateStr = new Date(r.createdAt).toISOString().split('T')[0];
                if (dateStr !== filterDate) return false;
            }

            return true;
        });
    }, [reports, activeTab, rejectedReports, searchTerm, filterStatus, filterClass, filterDate]);

    const handleReTest = (report, e) => {
        e.stopPropagation();
        if (report.instrument_data) {
            localStorage.setItem("InstrumentData", JSON.stringify(report.instrument_data));
            if (report.instrument_data.capacity) localStorage.setItem("Capacity", report.instrument_data.capacity);
            if (report.instrument_data.e_value) localStorage.setItem("eValue", report.instrument_data.e_value);
            if (report.instrument_data.Class_value) localStorage.setItem("ClassValue", report.instrument_data.Class_value);
        }
        navigate('/new-test');
    };

    return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <Header title="Historical Inspection Records" />
                <div className="app-content">
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.6rem', margin: '0 0 6px 0', fontFamily: 'Outfit, sans-serif' }}>VERIFICATION HISTORY</h2>
                            <p style={{ color: '#64748b', margin: 0 }}>Search and review archived NAWI test certificates & inspection workflow status.</p>
                        </div>

                        {/* Retest Queue Alert Pill */}
                        {rejectedReports.length > 0 && (
                            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', padding: '8px 16px', borderRadius: '8px', color: '#991B1B', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-exclamation-triangle" style={{ color: '#EF4444' }}></i>
                                <span>{rejectedReports.length} Report(s) Rejected & Require Retesting</span>
                            </div>
                        )}
                    </div>

                    {/* Navigation Tabs */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '2px solid #E2E8F0', paddingBottom: '2px' }}>
                        <button
                            onClick={() => setActiveTab('all')}
                            style={{
                                padding: '10px 20px',
                                border: 'none',
                                background: 'none',
                                fontWeight: activeTab === 'all' ? 700 : 500,
                                color: activeTab === 'all' ? '#2563EB' : '#64748b',
                                borderBottom: activeTab === 'all' ? '3px solid #2563EB' : 'none',
                                cursor: 'pointer',
                                fontSize: '0.95rem'
                            }}
                        >
                            <i className="fas fa-list" style={{ marginRight: '6px' }}></i> All Inspection Records ({reports.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('rejected')}
                            style={{
                                padding: '10px 20px',
                                border: 'none',
                                background: 'none',
                                fontWeight: activeTab === 'rejected' ? 700 : 500,
                                color: activeTab === 'rejected' ? '#EF4444' : '#64748b',
                                borderBottom: activeTab === 'rejected' ? '3px solid #EF4444' : 'none',
                                cursor: 'pointer',
                                fontSize: '0.95rem'
                            }}
                        >
                            <i className="fas fa-history" style={{ marginRight: '6px' }}></i> Rejected by Viewer / Admin ({rejectedReports.length})
                        </button>
                    </div>

                    <div className="form-card" style={{ marginBottom: '24px', padding: '20px' }}>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                                <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8' }}></i>
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ paddingLeft: '38px' }}
                                    placeholder="Search by Test ID / Serial No / Manufacturer..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div style={{ width: '140px' }}>
                                <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                    <option value="">Status: All</option>
                                    <option value="PASS">PASS</option>
                                    <option value="FAIL">FAIL</option>
                                </select>
                            </div>

                            <div style={{ width: '140px' }}>
                                <select className="form-input" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                                    <option value="">Class: All</option>
                                    <option value="I">Class I</option>
                                    <option value="II">Class II</option>
                                    <option value="III">Class III</option>
                                    <option value="IIII">Class IIII</option>
                                </select>
                            </div>

                            <div style={{ width: '160px' }}>
                                <input type="date" className="form-input" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="table-card">
                        {loading ? (
                            <SkeletonTable rows={6} cols={6} />
                        ) : filteredReports.length > 0 ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Test ID</th>
                                        <th>Instrument</th>
                                        <th>Serial No.</th>
                                        <th>Date</th>
                                        <th>Workflow Status</th>
                                        <th>Result</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.map(r => {
                                        const dateObj = new Date(r.createdAt);
                                        const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                        const isRejected = ['REJECTED_BY_VIEWER', 'REJECTED_BY_ADMIN', 'SENT_BACK_TO_TESTER'].includes(r.workflow_status);

                                        return (
                                            <tr
                                                key={r._id}
                                                onClick={() => navigate(`/report/${r._id}`)}
                                                style={{ cursor: 'pointer', background: isRejected ? '#FEF2F2' : 'transparent' }}
                                                className="table-row-hover"
                                            >
                                                <td><strong style={{ color: '#2563EB' }}>TP-{r._id.substring(0, 8).toUpperCase()}</strong></td>
                                                <td>
                                                    <div><strong>{r.instrument_id || "Unknown"}</strong></div>
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Class {r.accuracy_class}</span>
                                                </td>
                                                <td>{r.serial_no}</td>
                                                <td>{dateStr}</td>
                                                <td>
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        background: isRejected ? '#FEE2E2' : r.workflow_status === 'CERTIFIED' ? '#ECFDF5' : r.workflow_status === 'PENDING_ADMIN_APPROVAL' ? '#FEF3C7' : '#F1F5F9',
                                                        color: isRejected ? '#991B1B' : r.workflow_status === 'CERTIFIED' ? '#047857' : r.workflow_status === 'PENDING_ADMIN_APPROVAL' ? '#B45309' : '#334155'
                                                    }}>
                                                        {r.workflow_status || 'SUBMITTED'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {user?.role === 'tester' ? (
                                                        <span className="status-badge" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                                                            <i className="fas fa-paper-plane" style={{ marginRight: '4px' }}></i> SUBMITTED
                                                        </span>
                                                    ) : (
                                                        <span className={`status-badge ${r.status === 'PASS' ? 'status-pass' : 'status-fail'}`}>
                                                            {r.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {isRejected ? (
                                                        <button
                                                            className="btn"
                                                            style={{ padding: '6px 14px', fontSize: '0.8rem', background: '#DC2626' }}
                                                            onClick={(e) => handleReTest(r, e)}
                                                        >
                                                            <i className="fas fa-redo"></i> Re-Test Instrument
                                                        </button>
                                                    ) : (
                                                        <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                                                            View Report &rarr;
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No inspection reports match the criteria.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
