import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { SkeletonTable } from '../components/SkeletonLoader';

export default function HistoryPage() {
    const navigate = useNavigate();
    const { authFetch } = useAuth();

    const [reports, setReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authFetch('/api/history')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setReports(data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [authFetch]);

    const filteredReports = reports.filter(r => {
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

    return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <Header title="Historical Inspection Records" />
                <div className="app-content">
                    <div style={{ marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '1.6rem', margin: '0 0 6px 0' }}>VERIFICATION HISTORY</h2>
                        <p style={{ color: '#64748b' }}>Search and review archived NAWI test certificates and inspection reports.</p>
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
                                        <th>Rule Set</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.map(r => {
                                        const dateObj = new Date(r.createdAt);
                                        const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                        return (
                                            <tr
                                                key={r._id}
                                                onClick={() => navigate(`/report/${r._id}`)}
                                                style={{ cursor: 'pointer' }}
                                                className="table-row-hover"
                                            >
                                                <td><strong style={{ color: '#F29F67' }}>TP-{r._id.substring(0, 8).toUpperCase()}</strong></td>
                                                <td>{r.instrument_id || "Unknown"}</td>
                                                <td>{r.serial_no}</td>
                                                <td>{dateStr}</td>
                                                <td>{r.rule_set_version || 'OIML R-76 V1'}</td>
                                                <td>
                                                    <span className={`status-badge ${r.status === 'PASS' ? 'status-pass' : 'status-fail'}`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No historical reports match the criteria.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
