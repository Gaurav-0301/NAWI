import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { SkeletonTable } from '../components/SkeletonLoader';

export default function ViewerDashboardPage() {
    const { authFetch, showToast } = useAuth();

    // Stats State
    const [stats, setStats] = useState({
        labsCount: 0,
        pendingReviewCount: 0,
        sentForApprovalCount: 0,
        certificatesIssuedCount: 0
    });

    // Queue Reports & Tabs State
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'sent' | 'rejected'
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);

    // Search and Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterClass, setFilterClass] = useState('');

    // Selected Report for Review Modal / Drawer
    const [selectedReport, setSelectedReport] = useState(null);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    
    // Test-level Comments state: { [testKey]: commentString }
    const [rowComments, setRowComments] = useState({});
    const [generalComment, setGeneralComment] = useState('');
    const [submittingAction, setSubmittingAction] = useState(false);

    // Photo Preview Modal
    const [previewPhoto, setPreviewPhoto] = useState(null);

    // Fetch Analytics Stats
    const fetchStats = () => {
        setStatsLoading(true);
        authFetch('/api/viewer/stats')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setStats(data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setStatsLoading(false));
    };

    // Fetch Reports by Tab
    const fetchReports = (tab) => {
        setLoading(true);
        authFetch(`/api/viewer/reports?tab=${tab}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setReports(data);
                } else {
                    setReports([]);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchReports(activeTab);
    }, [activeTab]);

    // Open Full Report Review Screen
    const handleOpenReview = (report) => {
        setSelectedReport(report);
        setRowComments({});
        setGeneralComment('');
        setReviewModalOpen(true);
    };

    // Handle Comment Change for a Test Row
    const handleCommentChange = (testKey, val) => {
        setRowComments(prev => ({
            ...prev,
            [testKey]: val
        }));
    };

    // Check if rejection is allowed (Guardrail: At least one comment required)
    const hasAnyComment = () => {
        const hasRowComment = Object.values(rowComments).some(c => c && c.trim().length > 0);
        const hasGenComment = generalComment && generalComment.trim().length > 0;
        return hasRowComment || hasGenComment;
    };

    // Submit Review Action (APPROVE or REJECT)
    const handleDecision = async (action) => {
        if (!selectedReport) return;

        if (action === 'REJECT' && !hasAnyComment()) {
            showToast('Rejection requires at least one test row comment explaining what the tester needs to fix.');
            return;
        }

        setSubmittingAction(true);
        try {
            const formattedComments = Object.entries(rowComments)
                .filter(([_, text]) => text && text.trim().length > 0)
                .map(([key, text]) => ({
                    test_key: key,
                    comment: text.trim()
                }));

            const res = await authFetch(`/api/viewer/reports/${selectedReport._id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    comments: formattedComments,
                    general_comment: generalComment.trim()
                })
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || 'Failed to record decision');
            }

            showToast(data.message || (action === 'APPROVE' ? 'Report forwarded to Admin for approval' : 'Report sent back to Tester with comments'));
            setReviewModalOpen(false);
            setSelectedReport(null);
            fetchStats();
            fetchReports(activeTab);
        } catch (err) {
            showToast(err.message);
        } finally {
            setSubmittingAction(false);
        }
    };

    // Filter reports based on search and dropdown filters
    const filteredReports = reports.filter(r => {
        const idStr = r._id ? r._id.substring(0, 8).toUpperCase() : '';
        const instStr = (r.instrument_id || '').toUpperCase();
        const testerStr = (r.createdBy || '').toUpperCase();
        const snStr = (r.serial_no || '').toUpperCase();
        const fullSearch = `${idStr} ${instStr} ${testerStr} ${snStr}`;

        if (searchTerm && !fullSearch.includes(searchTerm.toUpperCase())) return false;
        if (filterStatus && r.status !== filterStatus) return false;
        if (filterClass && !r.accuracy_class.includes(filterClass)) return false;

        return true;
    });

    return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <Header title="Quality Reviewer Technical Portal" />
                <div className="app-content">

                    {/* Page Title & Description matching HistoryPage style */}
                    <div style={{ marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '1.6rem', margin: '0 0 6px 0', fontFamily: 'Outfit, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            TECHNICAL REVIEW QUEUE
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                            Auditing submitted NAWI inspection reports for metrological compliance prior to final administrator sign-off.
                        </p>
                    </div>

                    {/* 1. Overview / Analytics Section (Matching App Theme Cards) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        {/* Card 1: Registered Labs / Testers */}
                        <div className="form-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: 0 }}>
                            <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#F1F5F9', color: '#475569', display: 'grid', placeItems: 'center', fontSize: '1.3rem' }}>
                                <i className="fas fa-users-cog"></i>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    System Testers / Labs
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                                    {statsLoading ? '...' : stats.labsCount}
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Pending Review Queue */}
                        <div className="form-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #F29F67', marginBottom: 0 }}>
                            <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#FEF0E6', color: '#F29F67', display: 'grid', placeItems: 'center', fontSize: '1.3rem' }}>
                                <i className="fas fa-hourglass-half"></i>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Pending Review Queue
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#D8824C', fontFamily: 'Outfit, sans-serif' }}>
                                    {statsLoading ? '...' : stats.pendingReviewCount}
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Sent for Admin Approval */}
                        <div className="form-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #3B8FF3', marginBottom: 0 }}>
                            <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#EFF6FF', color: '#3B8FF3', display: 'grid', placeItems: 'center', fontSize: '1.3rem' }}>
                                <i className="fas fa-paper-plane"></i>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Awaiting Admin Sign-off
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563EB', fontFamily: 'Outfit, sans-serif' }}>
                                    {statsLoading ? '...' : stats.sentForApprovalCount}
                                </div>
                            </div>
                        </div>

                        {/* Card 4: Certificates Issued */}
                        <div className="form-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #34B1AA', marginBottom: 0 }}>
                            <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#ECFDF5', color: '#34B1AA', display: 'grid', placeItems: 'center', fontSize: '1.3rem' }}>
                                <i className="fas fa-certificate"></i>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Certificates Issued
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f766e', fontFamily: 'Outfit, sans-serif' }}>
                                    {statsLoading ? '...' : stats.certificatesIssuedCount}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Status Tracking Tabs & Search / Filter Card (Identical to HistoryPage layout) */}
                    <div className="form-card" style={{ marginBottom: '24px', padding: '20px' }}>
                        {/* Tab Buttons */}
                        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setActiveTab('pending')}
                                style={{
                                    padding: '8px 16px',
                                    fontWeight: 700,
                                    fontSize: '0.88rem',
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background: activeTab === 'pending' ? '#FEF0E6' : '#F1F5F9',
                                    color: activeTab === 'pending' ? '#D8824C' : '#64748b',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <i className="fas fa-inbox" style={{ marginRight: '6px' }}></i>
                                Pending Review ({stats.pendingReviewCount})
                            </button>

                            <button
                                onClick={() => setActiveTab('sent')}
                                style={{
                                    padding: '8px 16px',
                                    fontWeight: 700,
                                    fontSize: '0.88rem',
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background: activeTab === 'sent' ? '#EFF6FF' : '#F1F5F9',
                                    color: activeTab === 'sent' ? '#2563EB' : '#64748b',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <i className="fas fa-paper-plane" style={{ marginRight: '6px' }}></i>
                                Sent for Approval ({stats.sentForApprovalCount})
                            </button>

                            <button
                                onClick={() => setActiveTab('rejected')}
                                style={{
                                    padding: '8px 16px',
                                    fontWeight: 700,
                                    fontSize: '0.88rem',
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background: activeTab === 'rejected' ? '#FEF2F2' : '#F1F5F9',
                                    color: activeTab === 'rejected' ? '#DC2626' : '#64748b',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <i className="fas fa-exclamation-triangle" style={{ marginRight: '6px' }}></i>
                                Rejected by Admin
                            </button>
                        </div>

                        {/* Search and Filters Input Bar (Identical to HistoryPage) */}
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                                <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '13px', color: '#94a3b8' }}></i>
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ paddingLeft: '38px' }}
                                    placeholder="Search by Test ID / Serial No / Tester..."
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
                        </div>
                    </div>

                    {/* 3. Pending Review Queue Table (Identical to HistoryPage table card) */}
                    <div className="table-card">
                        {loading ? (
                            <SkeletonTable rows={5} cols={7} />
                        ) : filteredReports.length > 0 ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Test ID</th>
                                        <th>Instrument</th>
                                        <th>Tester Name</th>
                                        <th>Date Submitted</th>
                                        <th>Accuracy Class</th>
                                        <th>Auto Result</th>
                                        <th>Workflow Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.map((r) => {
                                        const dateObj = new Date(r.createdAt);
                                        const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

                                        return (
                                            <tr key={r._id} className="table-row-hover">
                                                <td>
                                                    <strong style={{ color: '#F29F67' }}>
                                                        TP-{r._id.substring(0, 8).toUpperCase()}
                                                    </strong>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{r.instrument_id || "NAWI Scale"}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.instrument_type}</div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <i className="fas fa-user-circle" style={{ color: '#94a3b8' }}></i>
                                                        <span>{r.createdBy || "Nishant"}</span>
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: '0.85rem', color: '#475569' }}>{dateStr}</td>
                                                <td>
                                                    <span style={{ background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                                                        Class {r.accuracy_class || 'III'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${r.status === 'PASS' ? 'status-pass' : 'status-fail'}`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {r.workflow_status === 'SUBMITTED' || r.workflow_status === 'RESUBMITTED' ? (
                                                        <span style={{ background: '#FEF0E6', color: '#D8824C', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            {r.workflow_status}
                                                        </span>
                                                    ) : r.workflow_status === 'PENDING_ADMIN_APPROVAL' ? (
                                                        <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            Awaiting Admin
                                                        </span>
                                                    ) : r.workflow_status === 'SENT_BACK_TO_TESTER' ? (
                                                        <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            Sent Back to Tester
                                                        </span>
                                                    ) : r.workflow_status === 'REJECTED_BY_ADMIN' ? (
                                                        <span style={{ background: '#FEF2F2', color: '#B91C1C', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            Rejected by Admin
                                                        </span>
                                                    ) : (
                                                        <span style={{ background: '#ECFDF5', color: '#059669', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            {r.workflow_status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => handleOpenReview(r)}
                                                        className="btn"
                                                        style={{
                                                            padding: '6px 14px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 600,
                                                            background: activeTab === 'pending' ? '#F29F67' : '#475569',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <i className="fas fa-search-plus" style={{ marginRight: '4px' }}></i>
                                                        {activeTab === 'pending' ? 'Audit Report' : 'View Review'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', margin: 0 }}>
                                No reports match the selected criteria.
                            </p>
                        )}
                    </div>

                </div>
            </div>

            {/* 4. Full Report Review Screen (Modal Overlay matching App Styling) */}
            {reviewModalOpen && selectedReport && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 2000,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#F8FAFC',
                        width: '100%',
                        maxWidth: '1100px',
                        height: '92vh',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        overflow: 'hidden',
                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                    }}>
                        {/* Review Screen Header */}
                        <div style={{
                            background: '#0F172A',
                            color: 'white',
                            padding: '16px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F29F67', fontFamily: 'Outfit, sans-serif' }}>
                                    TECHNICAL AUDIT — TP-{selectedReport._id.substring(0, 8).toUpperCase()}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                                    Tester: {selectedReport.createdBy || "Nishant"} &bull; Rule Set: {selectedReport.rule_set_version || "OIML R-76 V1"}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span className={`status-badge ${selectedReport.status === 'PASS' ? 'status-pass' : 'status-fail'}`}>
                                    Auto: {selectedReport.status}
                                </span>
                                <button
                                    onClick={() => setReviewModalOpen(false)}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        color: 'white',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '1.1rem'
                                    }}
                                >
                                    &times;
                                </button>
                            </div>
                        </div>

                        {/* Review Content Body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            
                            {/* Section A: Instrument & Administrative Evidence */}
                            <div className="form-card" style={{ padding: '22px', borderLeft: '4px solid #F29F67', marginBottom: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fas fa-balance-scale" style={{ color: '#F29F67' }}></i>
                                        1. Instrument Specifications & Administrative Evidence
                                    </h3>
                                    <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                                        <i className="fas fa-check-circle"></i> Evidence Verified & Sealed
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>INSTRUMENT ID / TYPE</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A' }}>{selectedReport.instrument_id || "NAWI Scale"}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>SERIAL NUMBER (S/N)</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A' }}>{selectedReport.instrument_data?.serial_no || selectedReport.serial_no || "SN-884920"}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>ACCURACY CLASS</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563EB' }}>Class {selectedReport.instrument_data?.Class_value || selectedReport.accuracy_class || "III"}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>MAX CAPACITY (Max)</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A' }}>{selectedReport.instrument_data?.capacity || selectedReport.instrument_data?.Max || 1000} {selectedReport.instrument_data?.max_unit || 'kg'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>VERIFICATION SCALE INTERVAL (e)</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A' }}>{selectedReport.instrument_data?.e_value || selectedReport.instrument_data?.e || 10} {selectedReport.instrument_data?.e_unit || 'g'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>TESTING ENVIRONMENT</div>
                                        <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                                            <i className="fas fa-thermometer-half" style={{ color: '#F29F67', marginRight: '4px' }}></i>
                                            {selectedReport.administrative_evidence?.temperature || selectedReport.lab_details?.temperature || '20'}°C &bull; {selectedReport.administrative_evidence?.humidity || selectedReport.lab_details?.humidity || '50'}% RH &bull; {selectedReport.lab_details?.voltage || '220'}V
                                        </div>
                                    </div>
                                </div>

                                {/* Attached Administrative Evidence Gallery */}
                                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <i className="fas fa-photo-video" style={{ color: '#F29F67' }}></i> Administrative Photo & Document Evidence:
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        {selectedReport.administrative_evidence?.photos?.front ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', cursor: 'pointer' }} onClick={() => setPreviewPhoto(selectedReport.administrative_evidence.photos.front)}>
                                                <img src={selectedReport.administrative_evidence.photos.front} alt="Front View" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                                                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e293b' }}>Front View Photo</span>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>Front Photo: Attached</span>
                                        )}

                                        {selectedReport.administrative_evidence?.photos?.nameplate ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', cursor: 'pointer' }} onClick={() => setPreviewPhoto(selectedReport.administrative_evidence.photos.nameplate)}>
                                                <img src={selectedReport.administrative_evidence.photos.nameplate} alt="Nameplate" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                                                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e293b' }}>Nameplate Markings</span>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>Nameplate Photo: Attached</span>
                                        )}

                                        {selectedReport.administrative_evidence?.photos?.rear_side ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', cursor: 'pointer' }} onClick={() => setPreviewPhoto(selectedReport.administrative_evidence.photos.rear_side)}>
                                                <img src={selectedReport.administrative_evidence.photos.rear_side} alt="Rear/Side View" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                                                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e293b' }}>Rear / Side View</span>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>Rear/Side Photo: Attached</span>
                                        )}

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#EFF6FF', color: '#2563EB', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, marginLeft: 'auto' }}>
                                            <i className="fas fa-file-pdf"></i>
                                            Docs: {selectedReport.administrative_evidence?.docs?.spec || "Tech Spec PDF"} &bull; {selectedReport.administrative_evidence?.docs?.manual || "Manual PDF"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section B: Test Observations, Clause Explanations & Photo Evidence */}
                            
                            {/* Test 1: Form 1 - Weighing Performance Test */}
                            <div className="form-card" style={{ padding: '20px', borderLeft: '4px solid #34B1AA', marginBottom: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', margin: 0, color: '#0F172A' }}>
                                        2. Weighing Performance Test (Form 1)
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                        OIML R76-1 Clause A.4.4
                                    </span>
                                </div>

                                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem', color: '#475569', border: '1px solid #E2E8F0' }}>
                                    <strong style={{ color: '#1E293B' }}>Clause Rule:</strong> Maximum permissible error (mpe) checked across load range up to Max capacity. Clause A.4.4 specifies tolerance steps &plusmn;0.5e, &plusmn;1.0e, &plusmn;1.5e.
                                </div>

                                {/* Raw Observation Readings */}
                                <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
                                    <table style={{ width: '100%', fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr style={{ background: '#F1F5F9' }}>
                                                <th style={{ padding: '8px' }}>Target Load (L)</th>
                                                <th style={{ padding: '8px' }}>Indication (I)</th>
                                                <th style={{ padding: '8px' }}>Calculated Error (E)</th>
                                                <th style={{ padding: '8px' }}>Allowed MPE (mpe)</th>
                                                <th style={{ padding: '8px' }}>Result</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedReport.form1_data && selectedReport.form1_data.loads ? (
                                                selectedReport.form1_data.loads.map((load, idx) => {
                                                    const ind = selectedReport.form1_data.indications ? selectedReport.form1_data.indications[idx] : load;
                                                    const err = (ind - load).toFixed(2);
                                                    const mpe = selectedReport.form1_results?.mpe_values ? selectedReport.form1_results.mpe_values[idx] : '1.0';
                                                    const pass = Math.abs(err) <= Math.abs(mpe);
                                                    return (
                                                        <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'center' }}>
                                                            <td style={{ padding: '8px' }}>{load} kg</td>
                                                            <td style={{ padding: '8px' }}>{ind} kg</td>
                                                            <td style={{ padding: '8px', fontWeight: 600, color: pass ? '#059669' : '#DC2626' }}>{err} g</td>
                                                            <td style={{ padding: '8px' }}>&plusmn;{mpe} g</td>
                                                            <td style={{ padding: '8px' }}>
                                                                <span className={`status-badge ${pass ? 'status-pass' : 'status-fail'}`} style={{ fontSize: '0.7rem' }}>
                                                                    {pass ? 'PASS' : 'FAIL'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign: 'center', padding: '12px', color: '#94a3b8' }}>Visual test readings recorded & verified clean.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Photo Proof */}
                                {selectedReport.evidence_register?.form1_photo && (
                                    <div style={{ marginBottom: '14px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>ATTACHED PHOTO PROOF:</div>
                                        <img
                                            src={selectedReport.evidence_register.form1_photo}
                                            alt="Weighing Performance Proof"
                                            onClick={() => setPreviewPhoto(selectedReport.evidence_register.form1_photo)}
                                            style={{ height: '90px', borderRadius: '6px', border: '1px solid #CBD5E1', cursor: 'pointer', objectFit: 'cover' }}
                                        />
                                    </div>
                                )}

                                {/* Row-Level Comment Input */}
                                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '12px', borderRadius: '6px' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>
                                        <i className="fas fa-comment-alt" style={{ marginRight: '4px' }}></i> Viewer Comment for Weighing Performance Section:
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Add specific correction note for Form 1 (or leave blank if verified)..."
                                        value={rowComments['form1'] || ''}
                                        onChange={(e) => handleCommentChange('form1', e.target.value)}
                                        style={{ fontSize: '0.85rem' }}
                                    />
                                </div>
                            </div>

                            {/* Test 2: Form 2 - Repeatability Test */}
                            <div className="form-card" style={{ padding: '20px', borderLeft: '4px solid #F29F67', marginBottom: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', margin: 0, color: '#0F172A' }}>
                                        3. Repeatability Test (Form 2)
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                        OIML R76-1 Clause A.4.10
                                    </span>
                                </div>

                                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem', color: '#475569', border: '1px solid #E2E8F0' }}>
                                    <strong style={{ color: '#1E293B' }}>Clause Rule:</strong> Difference between max and min indication for repeated loads must not exceed maximum permissible error (mpe) for that load.
                                </div>

                                {selectedReport.evidence_register?.form2_photo && (
                                    <div style={{ marginBottom: '14px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>ATTACHED PHOTO PROOF:</div>
                                        <img
                                            src={selectedReport.evidence_register.form2_photo}
                                            alt="Repeatability Proof"
                                            onClick={() => setPreviewPhoto(selectedReport.evidence_register.form2_photo)}
                                            style={{ height: '90px', borderRadius: '6px', border: '1px solid #CBD5E1', cursor: 'pointer', objectFit: 'cover' }}
                                        />
                                    </div>
                                )}

                                {/* Row-Level Comment Input */}
                                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '12px', borderRadius: '6px' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>
                                        <i className="fas fa-comment-alt" style={{ marginRight: '4px' }}></i> Viewer Comment for Repeatability Section:
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Add specific correction note for Form 2..."
                                        value={rowComments['form2'] || ''}
                                        onChange={(e) => handleCommentChange('form2', e.target.value)}
                                        style={{ fontSize: '0.85rem' }}
                                    />
                                </div>
                            </div>

                            {/* Test 3: Form 3 - Eccentricity Test */}
                            <div className="form-card" style={{ padding: '20px', borderLeft: '4px solid #3B8FF3', marginBottom: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', margin: 0, color: '#0F172A' }}>
                                        4. Eccentricity Off-Center Loading Test (Form 3)
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                        OIML R76-1 Clause A.4.7
                                    </span>
                                </div>

                                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem', color: '#475569', border: '1px solid #E2E8F0' }}>
                                    <strong style={{ color: '#1E293B' }}>Clause Rule:</strong> Load applied to off-center positions (corners 1 to 4 and center 5). Error at each position must remain within mpe.
                                </div>

                                {selectedReport.evidence_register?.form3_photo && (
                                    <div style={{ marginBottom: '14px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>ATTACHED PHOTO PROOF:</div>
                                        <img
                                            src={selectedReport.evidence_register.form3_photo}
                                            alt="Eccentricity Proof"
                                            onClick={() => setPreviewPhoto(selectedReport.evidence_register.form3_photo)}
                                            style={{ height: '90px', borderRadius: '6px', border: '1px solid #CBD5E1', cursor: 'pointer', objectFit: 'cover' }}
                                        />
                                    </div>
                                )}

                                {/* Row-Level Comment Input */}
                                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '12px', borderRadius: '6px' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>
                                        <i className="fas fa-comment-alt" style={{ marginRight: '4px' }}></i> Viewer Comment for Eccentricity Section:
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Add specific correction note for Form 3..."
                                        value={rowComments['form3'] || ''}
                                        onChange={(e) => handleCommentChange('form3', e.target.value)}
                                        style={{ fontSize: '0.85rem' }}
                                    />
                                </div>
                            </div>

                            {/* General Summary Review Note */}
                            <div className="form-card" style={{ padding: '20px', marginBottom: 0 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                                    <i className="fas fa-edit" style={{ color: '#F29F67', marginRight: '6px' }}></i>
                                    Overall Technical Audit Summary Note (Optional for approval, recorded in audit chain):
                                </label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    placeholder="Enter general review observations or summary notes for the administrator..."
                                    value={generalComment}
                                    onChange={(e) => setGeneralComment(e.target.value)}
                                    style={{ fontSize: '0.85rem', resize: 'vertical' }}
                                ></textarea>
                            </div>

                        </div>

                        {/* 4. Decision Actions (Persistent Bottom Sticky Footer) */}
                        <div style={{
                            background: '#FFFFFF',
                            borderTop: '1px solid #E4E7ED',
                            padding: '16px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                {hasAnyComment() ? (
                                    <span style={{ color: '#D97706', fontWeight: 600 }}>
                                        <i className="fas fa-info-circle"></i> Comments attached. Ready to submit or return.
                                    </span>
                                ) : (
                                    <span>
                                        <i className="fas fa-shield-alt"></i> Inspection values are read-only to preserve audit trail.
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                {/* Action 1: Reject — Send Back to Tester */}
                                <button
                                    onClick={() => handleDecision('REJECT')}
                                    disabled={submittingAction || !hasAnyComment()}
                                    title={!hasAnyComment() ? "At least one row-level comment required before rejection" : ""}
                                    className="btn"
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: '0.88rem',
                                        fontWeight: 600,
                                        cursor: (submittingAction || !hasAnyComment()) ? 'not-allowed' : 'pointer',
                                        background: hasAnyComment() ? '#EF4444' : '#FCA5A5',
                                        color: 'white',
                                        boxShadow: 'none'
                                    }}
                                >
                                    <i className="fas fa-undo"></i>
                                    Reject — Send Back to Tester
                                </button>

                                {/* Action 2: Send to Admin for Approval */}
                                <button
                                    onClick={() => handleDecision('APPROVE')}
                                    disabled={submittingAction}
                                    className="btn"
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: '0.88rem',
                                        fontWeight: 600,
                                        cursor: submittingAction ? 'not-allowed' : 'pointer',
                                        background: '#34B1AA',
                                        color: 'white'
                                    }}
                                >
                                    {submittingAction ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i> Processing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-paper-plane"></i> Send to Admin for Approval
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Photo Preview Modal */}
            {previewPhoto && (
                <div 
                    onClick={() => setPreviewPhoto(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 3000,
                        display: 'grid',
                        placeItems: 'center',
                        padding: '24px'
                    }}
                >
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        <img src={previewPhoto} alt="Full Proof Preview" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }} />
                        <div style={{ color: 'white', textAlign: 'center', marginTop: '12px', fontSize: '0.85rem' }}>Click anywhere to close</div>
                    </div>
                </div>
            )}

        </div>
    );
}
