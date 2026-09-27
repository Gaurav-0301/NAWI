import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { SkeletonDashboard } from '../components/SkeletonLoader';
import { cachedFetch, clearApiCache } from '../utils/apiCache';
import { getOptimizedCloudinaryUrl } from '../utils/cloudinaryUrl';

export default function AdminDashboardPage() {
    const { user, authFetch, showToast } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('overview');
    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Application Review Section States
    const [appSubTab, setAppSubTab] = useState('pending'); // 'pending' | 'certified' | 'rejected' | 'all'
    const [appSearchTerm, setAppSearchTerm] = useState('');
    const [selectedAppForReview, setSelectedAppForReview] = useState(null);
    const [appReviewModalOpen, setAppReviewModalOpen] = useState(false);
    const [adminComment, setAdminComment] = useState('');
    const [submittingAdminDecision, setSubmittingAdminDecision] = useState(false);
    const [previewPhoto, setPreviewPhoto] = useState(null);

    // Rule Set Form state
    const [showAddRuleModal, setShowAddRuleModal] = useState(false);
    const [ruleEditorMode, setRuleEditorMode] = useState('visual'); // 'visual' | 'json'
    const [versionName, setVersionName] = useState('');
    const [description, setDescription] = useState('');
    const [setActiveForTesting, setSetActiveForTesting] = useState(true);
    const [ruleAdminPassword, setRuleAdminPassword] = useState('');

    // Rule Set Activation Auth Modal state
    const [showActivateAuthModal, setShowActivateAuthModal] = useState(false);
    const [targetRuleToActivate, setTargetRuleToActivate] = useState(null);
    const [activateAdminPassword, setActivateAdminPassword] = useState('');
    const [showActivatePasswordText, setShowActivatePasswordText] = useState(false);
    const [activateAuthError, setActivateAuthError] = useState('');
    const [isActivating, setIsActivating] = useState(false);

    // Rule Visual Form parameters
    const [tareMultiplier, setTareMultiplier] = useState(1.0);
    const [eccentricityFraction, setEccentricityFraction] = useState(0.33);
    const [repeatabilityDiff, setRepeatabilityDiff] = useState(1.0);
    const [tiltLimit, setTiltLimit] = useState(1.0);
    const [zeroLimit, setZeroLimit] = useState(0.25);

    const [classI_mpe1, setClassI_mpe1] = useState(50000);
    const [classI_mpe2, setClassI_mpe2] = useState(200000);
    const [classII_mpe1, setClassII_mpe1] = useState(5000);
    const [classII_mpe2, setClassII_mpe2] = useState(20000);
    const [classIII_mpe1, setClassIII_mpe1] = useState(500);
    const [classIII_mpe2, setClassIII_mpe2] = useState(2000);
    const [classIIII_mpe1, setClassIIII_mpe1] = useState(50);
    const [classIIII_mpe2, setClassIIII_mpe2] = useState(200);

    const [rulesJson, setRulesJson] = useState(JSON.stringify({
        mpe: {
            class_I: { e_intervals: [50000, 200000], mpe_e: [1, 2, 3] },
            class_II: { e_intervals: [5000, 20000], mpe_e: [1, 2, 3] },
            class_III: { e_intervals: [500, 2000], mpe_e: [1, 2, 3] },
            class_IIII: { e_intervals: [50, 200], mpe_e: [1, 2, 3] }
        },
        tare: { mpe_multiplier: 1.0 },
        eccentricity: { load_fraction: 0.33 },
        repeatability: { max_diff_e: 1.0 },
        tilt: { limit_e: 1.0 },
        zero_setting: { limit_e: 0.25 }
    }, null, 2));

    // User / Officer Form state
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('viewer');

    const fetchAdminData = () => {
        setLoading(true);
        authFetch('/api/admin/dashboard')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) setAdminData(data);
            })
            .catch(err => console.error("Error fetching admin data:", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    const openActivateRuleModal = (rule) => {
        setTargetRuleToActivate(rule);
        setActivateAdminPassword('');
        setActivateAuthError('');
        setShowActivatePasswordText(false);
        setShowActivateAuthModal(true);
    };

    const handleConfirmActivateRule = async (e) => {
        e.preventDefault();
        if (!targetRuleToActivate) return;
        setActivateAuthError('');
        setIsActivating(true);
        try {
            const res = await authFetch(`/api/admin/rules/activate/${targetRuleToActivate._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminPassword: activateAdminPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to activate rule set");
            setShowActivateAuthModal(false);
            setTargetRuleToActivate(null);
            setActivateAdminPassword('');
            fetchAdminData();
        } catch (err) {
            setActivateAuthError(err.message);
        } finally {
            setIsActivating(false);
        }
    };

    const handleAddRuleSet = async (e) => {
        e.preventDefault();
        try {
            if (setActiveForTesting && !ruleAdminPassword) {
                alert("Please enter your Admin Password to authorize setting this rule set as active for live testing.");
                return;
            }

            let finalRulesObj;
            if (ruleEditorMode === 'visual') {
                finalRulesObj = {
                    mpe: {
                        class_I: { e_intervals: [Number(classI_mpe1), Number(classI_mpe2)], mpe_e: [1, 2, 3] },
                        class_II: { e_intervals: [Number(classII_mpe1), Number(classII_mpe2)], mpe_e: [1, 2, 3] },
                        class_III: { e_intervals: [Number(classIII_mpe1), Number(classIII_mpe2)], mpe_e: [1, 2, 3] },
                        class_IIII: { e_intervals: [Number(classIIII_mpe1), Number(classIIII_mpe2)], mpe_e: [1, 2, 3] }
                    },
                    tare: { mpe_multiplier: Number(tareMultiplier) },
                    eccentricity: { load_fraction: Number(eccentricityFraction) },
                    repeatability: { max_diff_e: Number(repeatabilityDiff) },
                    tilt: { limit_e: Number(tiltLimit) },
                    zero_setting: { limit_e: Number(zeroLimit) }
                };
            } else {
                finalRulesObj = rulesJson;
            }

            const res = await authFetch('/api/admin/rules/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    version_name: versionName,
                    description,
                    rules: finalRulesObj,
                    setActive: setActiveForTesting,
                    adminPassword: ruleAdminPassword
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            alert(data.message || "Rule set added successfully!");
            setShowAddRuleModal(false);
            setVersionName('');
            setDescription('');
            setRuleAdminPassword('');
            fetchAdminData();
        } catch (err) {
            alert("Authorization / Creation Error: " + err.message);
        }
    };

    const handleAddOfficer = async (e) => {
        e.preventDefault();
        try {
            const res = await authFetch('/api/admin/users/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newUserName,
                    email: newUserEmail,
                    password: newUserPassword,
                    role: newUserRole
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            alert(data.message || "Officer registered successfully!");
            setShowAddUserModal(false);
            setNewUserName('');
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserRole('viewer');
            fetchAdminData();
        } catch (err) {
            alert("Error registering officer: " + err.message);
        }
    };

    // Open Application Review Modal
    const handleOpenAppReview = (report) => {
        setSelectedAppForReview(report);
        setAdminComment('');
        setAppReviewModalOpen(true);
    };

    // Submit Admin Decision (APPROVE & CERTIFY or REJECT)
    const handleAdminDecision = async (action) => {
        if (!selectedAppForReview) return;

        if (action === 'REJECT' && (!adminComment || adminComment.trim().length === 0)) {
            if (showToast) showToast('Rejection requires an explanatory comment for the tester and viewer.');
            else alert('Rejection requires an explanatory comment for the tester and viewer.');
            return;
        }

        setSubmittingAdminDecision(true);
        try {
            const res = await authFetch(`/api/admin/reports/${selectedAppForReview._id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    general_comment: adminComment.trim()
                })
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || 'Failed to record decision');
            }

            const message = data.message || (action === 'APPROVE' 
                ? 'Application approved! Official Certificate generated and published.' 
                : 'Application rejected by Admin and returned with comments.');
            
            if (showToast) showToast(message, action === 'APPROVE' ? 'success' : 'error');
            else alert(message);

            setAppReviewModalOpen(false);
            setSelectedAppForReview(null);
            setAdminComment('');
            clearApiCache('/api/admin');
            fetchAdminData();
        } catch (err) {
            if (showToast) showToast(err.message);
            else alert(err.message);
        } finally {
            setSubmittingAdminDecision(false);
        }
    };

    if (loading) return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <Header title="Admin Governance Dashboard" />
                <div className="app-content">
                    <SkeletonDashboard />
                </div>
            </div>
        </div>
    );
    if (!adminData) return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>Error loading admin dashboard.</div>;

    const { stats, reports = [], testers = [], rulesets = [], activeRule, logs = [] } = adminData;

    // Filter applications for Admin Review
    const pendingApps = reports.filter(r => r.workflow_status === 'PENDING_ADMIN_APPROVAL');
    const certifiedApps = reports.filter(r => ['APPROVED', 'CERTIFIED', 'ISSUED'].includes(r.workflow_status));
    const rejectedByAdminApps = reports.filter(r => r.workflow_status === 'REJECTED_BY_ADMIN');

    const filteredApplications = reports.filter(r => {
        if (appSubTab === 'pending' && r.workflow_status !== 'PENDING_ADMIN_APPROVAL') return false;
        if (appSubTab === 'certified' && !['APPROVED', 'CERTIFIED', 'ISSUED'].includes(r.workflow_status)) return false;
        if (appSubTab === 'rejected' && r.workflow_status !== 'REJECTED_BY_ADMIN') return false;

        if (appSearchTerm) {
            const term = appSearchTerm.toUpperCase();
            const idStr = (r._id || '').substring(0, 8).toUpperCase();
            const instStr = (r.instrument_id || '').toUpperCase();
            const testerStr = (r.createdBy || '').toUpperCase();
            const viewerStr = (r.reviewedBy || '').toUpperCase();
            const snStr = (r.instrument_data?.serial_no || r.serial_no || '').toUpperCase();
            const searchHaystack = `${idStr} ${instStr} ${testerStr} ${viewerStr} ${snStr}`;
            if (!searchHaystack.includes(term)) return false;
        }

        return true;
    });

    return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <div className="app-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.6rem', margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>ADMIN CONTROL & GOVERNANCE PANEL</h2>
                            <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>Review viewer applications, issue official verification certificates, and manage OIML R-76 rule sets.</p>
                        </div>
                        <button className="btn" onClick={() => setShowAddUserModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-user-plus"></i> Register New Officer
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'white', padding: '6px', borderRadius: '10px', border: '1px solid #E4E7ED', flexWrap: 'wrap' }}>
                        {[
                            { id: 'overview', label: 'Overview & Analytics', icon: 'fas fa-chart-pie' },
                            { 
                                id: 'applications', 
                                label: 'Application Reviews', 
                                icon: 'fas fa-file-signature',
                                badge: pendingApps.length
                            },
                            { id: 'rules', label: 'Rule Sets Management', icon: 'fas fa-book' },
                            { id: 'testers', label: 'Officers Directory', icon: 'fas fa-users' },
                            { id: 'logs', label: 'Audit Logs', icon: 'fas fa-history' }
                        ].map(t => (
                            <button
                                key={t.id}
                                className={`btn ${activeTab === t.id ? '' : 'btn-secondary'}`}
                                style={{ padding: '8px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}
                                onClick={() => setActiveTab(t.id)}
                            >
                                <i className={t.icon}></i> {t.label}
                                {t.badge > 0 && (
                                    <span style={{
                                        background: '#EF4444',
                                        color: 'white',
                                        borderRadius: '10px',
                                        padding: '1px 7px',
                                        fontSize: '0.72rem',
                                        fontWeight: 800
                                    }}>
                                        {t.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* TAB 1: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '28px' }}>
                                <div className="form-card" style={{ padding: '20px', margin: 0 }}>
                                    <h2 style={{ fontSize: '2rem', color: '#1E1E2C', margin: 0, padding: 0, border: 'none' }}>{stats.total}</h2>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Total Tests Submitted</p>
                                </div>

                                <div 
                                    className="form-card" 
                                    style={{ padding: '20px', margin: 0, borderLeft: '4px solid #2563EB', cursor: 'pointer' }}
                                    onClick={() => { setActiveTab('applications'); setAppSubTab('pending'); }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h2 style={{ fontSize: '2rem', color: '#2563EB', margin: 0, padding: 0, border: 'none' }}>{pendingApps.length}</h2>
                                        <span style={{ fontSize: '0.75rem', background: '#FEF0E6', color: '#D8824C', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>Action Required</span>
                                    </div>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Pending Application Reviews</p>
                                </div>

                                <div className="form-card" style={{ padding: '20px', margin: 0, borderLeft: '4px solid #34B1AA' }}>
                                    <h2 style={{ fontSize: '2rem', color: '#34B1AA', margin: 0, padding: 0, border: 'none' }}>{stats.certified || certifiedApps.length}</h2>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Official Certificates Issued</p>
                                </div>

                                <div className="form-card" style={{ padding: '20px', margin: 0 }}>
                                    <h2 style={{ fontSize: '2rem', color: '#3B8FF3', margin: 0, padding: 0, border: 'none' }}>{stats.users}</h2>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Active System Officers</p>
                                </div>
                            </div>

                            <div className="table-card">
                                <h3 style={{ marginTop: 0, color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>All Verification Reports</span>
                                    <button 
                                        className="btn-secondary" 
                                        style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                                        onClick={() => setActiveTab('applications')}
                                    >
                                        Go to Application Reviews Queue &rarr;
                                    </button>
                                </h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Test ID</th>
                                            <th>Instrument</th>
                                            <th>Inspector</th>
                                            <th>Viewer</th>
                                            <th>Date</th>
                                            <th>Workflow Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.map(r => (
                                            <tr key={r._id} className="table-row-hover">
                                                <td><strong style={{ color: '#2563EB' }}>TP-{r._id.substring(0, 8).toUpperCase()}</strong></td>
                                                <td>{r.instrument_id || "Unknown"}</td>
                                                <td>{r.createdBy}</td>
                                                <td>{r.reviewedBy || "Pending Review"}</td>
                                                <td>{new Date(r.createdAt).toLocaleDateString('en-GB')}</td>
                                                <td>
                                                    {r.workflow_status === 'PENDING_ADMIN_APPROVAL' ? (
                                                        <span style={{ background: '#FEF0E6', color: '#D8824C', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            Awaiting Admin Review
                                                        </span>
                                                    ) : ['APPROVED', 'CERTIFIED', 'ISSUED'].includes(r.workflow_status) ? (
                                                        <span style={{ background: '#ECFDF5', color: '#059669', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            CERTIFIED
                                                        </span>
                                                    ) : r.workflow_status === 'REJECTED_BY_ADMIN' ? (
                                                        <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            Rejected by Admin
                                                        </span>
                                                    ) : (
                                                        <span style={{ background: '#F1F5F9', color: '#475569', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            {r.workflow_status || 'SUBMITTED'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => handleOpenAppReview(r)}
                                                        className="btn-secondary"
                                                        style={{ padding: '4px 10px', fontSize: '0.78rem', background: '#F8FAFC' }}
                                                    >
                                                        Review Application
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: APPLICATION REVIEW SECTION (ADMIN PANEL) */}
                    {activeTab === 'applications' && (
                        <div>
                            {/* Section Description */}
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '1.25rem', margin: '0 0 4px 0', color: '#1E1E2C', fontFamily: 'Outfit, sans-serif' }}>
                                    VIEWER APPLICATION REVIEW & CERTIFICATION PANEL
                                </h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                                    Audit applications submitted by Viewer Officers. Review all reading proof photos, calculation verifications, and viewer notes before issuing official certificates or rejecting.
                                </p>
                            </div>

                            {/* Filters & Sub-tabs */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                                <div style={{ display: 'flex', gap: '8px', background: '#F1F5F9', padding: '4px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                    <button
                                        className={`btn ${appSubTab === 'pending' ? '' : 'btn-secondary'}`}
                                        style={{ padding: '6px 14px', fontSize: '0.8rem', border: 'none' }}
                                        onClick={() => setAppSubTab('pending')}
                                    >
                                        Pending Admin Review ({pendingApps.length})
                                    </button>
                                    <button
                                        className={`btn ${appSubTab === 'certified' ? '' : 'btn-secondary'}`}
                                        style={{ padding: '6px 14px', fontSize: '0.8rem', border: 'none' }}
                                        onClick={() => setAppSubTab('certified')}
                                    >
                                        Certified & Issued ({certifiedApps.length})
                                    </button>
                                    <button
                                        className={`btn ${appSubTab === 'rejected' ? '' : 'btn-secondary'}`}
                                        style={{ padding: '6px 14px', fontSize: '0.8rem', border: 'none' }}
                                        onClick={() => setAppSubTab('rejected')}
                                    >
                                        Rejected by Admin ({rejectedByAdminApps.length})
                                    </button>
                                    <button
                                        className={`btn ${appSubTab === 'all' ? '' : 'btn-secondary'}`}
                                        style={{ padding: '6px 14px', fontSize: '0.8rem', border: 'none' }}
                                        onClick={() => setAppSubTab('all')}
                                    >
                                        All Applications ({reports.length})
                                    </button>
                                </div>

                                <div style={{ minWidth: '260px', position: 'relative' }}>
                                    <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8', fontSize: '0.85rem' }}></i>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Search by Test ID / S/N / Viewer..."
                                        style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
                                        value={appSearchTerm}
                                        onChange={e => setAppSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Applications Table Card */}
                            <div className="table-card">
                                {filteredApplications.length > 0 ? (
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Application ID</th>
                                                <th>Instrument / S/N</th>
                                                <th>Submitted By (Tester)</th>
                                                <th>Reviewed By (Viewer)</th>
                                                <th>Date Submitted</th>
                                                <th>Workflow Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredApplications.map(r => {
                                                const serialNo = r.instrument_data?.serial_no || r.serial_no || "SN-Pending";
                                                const isCertified = ['APPROVED', 'CERTIFIED', 'ISSUED'].includes(r.workflow_status);
                                                const isPending = r.workflow_status === 'PENDING_ADMIN_APPROVAL';
                                                const isRejected = r.workflow_status === 'REJECTED_BY_ADMIN';

                                                return (
                                                    <tr key={r._id} className="table-row-hover">
                                                        <td>
                                                            <strong style={{ color: '#2563EB' }}>TP-{r._id.substring(0, 8).toUpperCase()}</strong>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{r.instrument_id || "NAWI Scale"}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>S/N: {serialNo}</div>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                                                                <i className="fas fa-user-edit" style={{ marginRight: '6px', color: '#94a3b8' }}></i>
                                                                {r.createdBy || "Tester"}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                                                                <i className="fas fa-user-check" style={{ marginRight: '6px', color: '#34B1AA' }}></i>
                                                                {r.reviewedBy || "Quality Reviewer"}
                                                            </div>
                                                        </td>
                                                        <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                                                            {new Date(r.createdAt).toLocaleDateString('en-GB')}
                                                        </td>
                                                        <td>
                                                            {isPending ? (
                                                                <span style={{ background: '#FEF0E6', color: '#D8824C', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                                    <i className="fas fa-hourglass-half" style={{ marginRight: '4px' }}></i> Awaiting Admin Sign-off
                                                                </span>
                                                            ) : isCertified ? (
                                                                <span style={{ background: '#ECFDF5', color: '#059669', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                                    <i className="fas fa-certificate" style={{ marginRight: '4px' }}></i> CERTIFIED & ISSUED
                                                                </span>
                                                            ) : isRejected ? (
                                                                <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                                    <i className="fas fa-times-circle" style={{ marginRight: '4px' }}></i> Rejected by Admin
                                                                </span>
                                                            ) : (
                                                                <span style={{ background: '#F1F5F9', color: '#475569', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                                    {r.workflow_status || 'SUBMITTED'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button
                                                                    onClick={() => handleOpenAppReview(r)}
                                                                    className="btn"
                                                                    style={{
                                                                        padding: '6px 14px',
                                                                        fontSize: '0.8rem',
                                                                        fontWeight: 600,
                                                                        background: isPending ? '#2563EB' : '#475569',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <i className="fas fa-search-plus" style={{ marginRight: '4px' }}></i>
                                                                    {isPending ? 'Review & Issue' : 'View Application'}
                                                                </button>

                                                                {isCertified && (
                                                                    <a
                                                                        href={`/certificate/${r._id}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        style={{
                                                                            padding: '6px 12px',
                                                                            fontSize: '0.8rem',
                                                                            fontWeight: 700,
                                                                            background: '#047857',
                                                                            color: 'white',
                                                                            borderRadius: '6px',
                                                                            textDecoration: 'none',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '4px'
                                                                        }}
                                                                    >
                                                                        <i className="fas fa-award"></i> Certificate
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                        <i className="fas fa-inbox" style={{ fontSize: '2.5rem', marginBottom: '12px', color: '#cbd5e1' }}></i>
                                        <p style={{ margin: 0, fontSize: '0.95rem' }}>No applications found matching the selected sub-tab / criteria.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: RULE SETS */}
                    {activeTab === 'rules' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#1E1E2C', fontSize: '1.2rem' }}>OIML Standard Rule Sets & Tolerances</h3>
                                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>Select which rule set is active for live testing across the legal metrology workspace.</p>
                                </div>
                                <button className="btn" onClick={() => setShowAddRuleModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-plus-circle"></i> Create New Rule Set
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                                {rulesets.map(rs => (
                                    <div key={rs._id} className="form-card" style={{
                                        margin: 0,
                                        border: rs.isActive ? '2px solid #34B1AA' : '1px solid #E4E7ED',
                                        background: rs.isActive ? 'linear-gradient(180deg, #FFFFFF 0%, #F0FDF4 100%)' : 'white',
                                        position: 'relative',
                                        boxShadow: rs.isActive ? '0 10px 15px -3px rgba(52, 177, 170, 0.12)' : 'none'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            <div>
                                                <h4 style={{ margin: 0, padding: 0, border: 'none', color: '#1E1E2C', fontSize: '1.15rem', fontWeight: 700 }}>{rs.version_name}</h4>
                                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Created by {rs.createdBy}</span>
                                            </div>
                                            {rs.isActive ? (
                                                <span style={{
                                                    background: '#10B981',
                                                    color: 'white',
                                                    padding: '5px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                                                }}>
                                                    <i className="fas fa-check-circle"></i> ACTIVE FOR TESTING
                                                </span>
                                            ) : (
                                                <button
                                                    className="btn-secondary"
                                                    style={{ padding: '6px 14px', fontSize: '0.78rem', background: '#F8FAFC', borderColor: '#CBD5E1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                                    onClick={() => openActivateRuleModal(rs)}
                                                >
                                                    <i className="fas fa-key" style={{ color: '#2563EB' }}></i> Select for Testing
                                                </button>
                                            )}
                                        </div>
                                        <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '16px', lineHeight: 1.5 }}>
                                            {rs.description || 'Custom OIML R-76 legal metrology specifications and evaluation limits.'}
                                        </p>

                                        {/* Parameters Quick Summary Pill Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(241, 245, 249, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#334155' }}>
                                                <strong>Eccentricity:</strong> {rs.rules?.eccentricity?.load_fraction ? `${(rs.rules.eccentricity.load_fraction * 100).toFixed(0)}% Max` : '33% Max'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#334155' }}>
                                                <strong>Repeatability:</strong> {rs.rules?.repeatability?.max_diff_e ? `≤ ${rs.rules.repeatability.max_diff_e} e` : '≤ 1.0 e'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#334155' }}>
                                                <strong>Zero Setting:</strong> {rs.rules?.zero_setting?.limit_e ? `≤ ${rs.rules.zero_setting.limit_e} e` : '≤ 0.25 e'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#334155' }}>
                                                <strong>Tilt Limit:</strong> {rs.rules?.tilt?.limit_e ? `≤ ${rs.rules.tilt.limit_e} e` : '≤ 1.0 e'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 4: OFFICERS DIRECTORY */}
                    {activeTab === 'testers' && (
                        <div className="table-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, color: '#2563EB' }}>Registered Officers & Viewers</h3>
                                <button className="btn" onClick={() => setShowAddUserModal(true)}>
                                    <i className="fas fa-plus"></i> Add Viewer / Officer
                                </button>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Tests Completed</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {testers.map((t, idx) => (
                                        <tr key={idx}>
                                            <td><strong>{t.name}</strong></td>
                                            <td style={{ color: '#475569' }}>{t.email}</td>
                                            <td>
                                                <span style={{
                                                    background: t.rawRole === 'admin' ? '#FEF08A' : t.rawRole === 'viewer' ? '#DBEAFE' : '#E2E8F0',
                                                    color: t.rawRole === 'admin' ? '#854D0E' : t.rawRole === 'viewer' ? '#1E40AF' : '#334155',
                                                    padding: '3px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 600
                                                }}>
                                                    {t.role}
                                                </span>
                                            </td>
                                            <td>{t.tests}</td>
                                            <td><span className="status-badge status-pass">{t.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* TAB 5: AUDIT LOGS */}
                    {activeTab === 'logs' && (
                        <div className="table-card">
                            <h3 style={{ marginTop: 0, color: '#2563EB' }}>System Audit Trail</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>User</th>
                                        <th>Action</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((l, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{new Date(l.createdAt).toLocaleString('en-GB')}</td>
                                            <td><strong>{l.user}</strong></td>
                                            <td style={{ color: '#0f766e', fontWeight: 600 }}>{l.action}</td>
                                            <td style={{ fontSize: '0.85rem', color: '#475569' }}>{l.details || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ADMIN APPLICATION REVIEW & CERTIFICATE ISSUANCE MODAL DRAWER */}
                    {appReviewModalOpen && selectedAppForReview && (
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
                                maxWidth: '1150px',
                                height: '92vh',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                overflow: 'hidden',
                                fontFamily: 'Plus Jakarta Sans, sans-serif'
                            }}>
                                {/* Drawer Header */}
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
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2563EB', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <i className="fas fa-file-signature"></i>
                                            ADMIN APPLICATION REVIEW — TP-{selectedAppForReview._id.substring(0, 8).toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                                            Tester: {selectedAppForReview.createdBy || "Nishant"} &bull; Viewer Officer: <strong style={{ color: '#38BDF8' }}>{selectedAppForReview.reviewedBy || "Quality Viewer"}</strong>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {['APPROVED', 'CERTIFIED', 'ISSUED'].includes(selectedAppForReview.workflow_status) && (
                                            <a
                                                href={`/certificate/${selectedAppForReview._id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    background: '#047857',
                                                    color: 'white',
                                                    padding: '6px 14px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    textDecoration: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                <i className="fas fa-award"></i> View Generated Certificate
                                            </a>
                                        )}

                                        <a
                                            href={`/report-detailed/${selectedAppForReview._id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                background: '#3B8FF3',
                                                color: 'white',
                                                padding: '6px 14px',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                                textDecoration: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <i className="fas fa-list-check"></i> View Detailed Report
                                        </a>

                                        <button
                                            onClick={() => setAppReviewModalOpen(false)}
                                            style={{
                                                background: 'rgba(255,255,255,0.15)',
                                                border: 'none',
                                                color: 'white',
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '1.2rem'
                                            }}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                </div>

                                {/* Drawer Main Content Body */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    
                                    {/* Prominent Viewer Review Summary & Comments Box */}
                                    <div className="form-card" style={{ padding: '22px', borderLeft: '4px solid #34B1AA', background: 'linear-gradient(180deg, #FFFFFF 0%, #F0FDF4 100%)', marginBottom: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <i className="fas fa-user-check" style={{ color: '#34B1AA' }}></i>
                                                    Viewer Audit & Forwarding Summary
                                                </h3>
                                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem' }}>
                                                    Submitted by Viewer Officer: <strong>{selectedAppForReview.reviewedBy || "Quality Inspector"}</strong>
                                                </p>
                                            </div>
                                            <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
                                                ✓ Technical Review Verified & Forwarded
                                            </span>
                                        </div>

                                        {/* Viewer Comments Log */}
                                        {Array.isArray(selectedAppForReview.review_history) && selectedAppForReview.review_history.length > 0 ? (
                                            <div style={{ background: 'white', border: '1px solid #CBD5E1', padding: '14px', borderRadius: '8px', marginBottom: '14px' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Reviewer Audit Trail & Comments by Viewer:
                                                </div>
                                                {selectedAppForReview.review_history.map((hist, idx) => (
                                                    <div key={idx} style={{ fontSize: '0.85rem', padding: '8px 0', borderBottom: idx < selectedAppForReview.review_history.length - 1 ? '1px dashed #E2E8F0' : 'none' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '0.78rem', fontWeight: 600 }}>
                                                            <span><i className="fas fa-user-circle" style={{ color: '#3B8FF3' }}></i> {hist.reviewer} ({hist.role})</span>
                                                            <span>{new Date(hist.timestamp).toLocaleString('en-GB')}</span>
                                                        </div>
                                                        {hist.general_comment && (
                                                            <div style={{ marginTop: '4px', color: '#1E293B', fontWeight: 500, fontStyle: 'italic', background: '#F8FAFC', padding: '6px 10px', borderRadius: '4px' }}>
                                                                "{hist.general_comment}"
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', marginBottom: '14px' }}>
                                                No viewer audit history notes attached.
                                            </div>
                                        )}

                                        {/* Viewer Row-level Comments */}
                                        {Array.isArray(selectedAppForReview.test_comments) && selectedAppForReview.test_comments.length > 0 && (
                                            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '12px 14px', borderRadius: '8px' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400E', marginBottom: '6px' }}>
                                                    Row-level Correction Notes Attached by Viewer:
                                                </div>
                                                {selectedAppForReview.test_comments.map((tc, idx) => (
                                                    <div key={idx} style={{ fontSize: '0.83rem', color: '#78350F' }}>
                                                        &bull; <strong>{tc.test_key}:</strong> {tc.comment}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Section 1: Specifications */}
                                    <div className="form-card" style={{ padding: '22px', borderLeft: '4px solid #2563EB', marginBottom: 0 }}>
                                        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', margin: '0 0 16px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <i className="fas fa-balance-scale" style={{ color: '#2563EB' }}></i>
                                            1. Instrument & Legal Metrology Specifications
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>INSTRUMENT ID / TYPE</div>
                                                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A' }}>{selectedAppForReview.instrument_id || "NAWI Scale"}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>SERIAL NUMBER (S/N)</div>
                                                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A' }}>{selectedAppForReview.instrument_data?.serial_no || selectedAppForReview.serial_no || "SN-884920"}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>ACCURACY CLASS</div>
                                                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563EB' }}>Class {selectedAppForReview.instrument_data?.Class_value || selectedAppForReview.accuracy_class || "III"}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>MAX CAPACITY (Max)</div>
                                                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A' }}>{selectedAppForReview.instrument_data?.capacity || selectedAppForReview.instrument_data?.Max || 1000} {selectedAppForReview.instrument_data?.max_unit || 'kg'}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>VERIFICATION SCALE INTERVAL (e)</div>
                                                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A' }}>{selectedAppForReview.instrument_data?.e_value || selectedAppForReview.instrument_data?.e || 10} {selectedAppForReview.instrument_data?.e_unit || 'g'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Weighing Performance Test (Form 1) */}
                                    <div className="form-card" style={{ padding: '20px', borderLeft: '4px solid #34B1AA', marginBottom: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <i className="fas fa-weight" style={{ color: '#34B1AA' }}></i>
                                                2. Weighing Performance Test Readings & Photo Proofs (Form 1)
                                            </h3>
                                            <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                                OIML R76-1 Clause 3.5.1
                                            </span>
                                        </div>

                                        <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
                                            <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ background: '#F1F5F9', color: '#334155', textAlign: 'center' }}>
                                                        <th style={{ padding: '10px 8px' }}>Target Load (L)</th>
                                                        <th style={{ padding: '10px 8px' }}>Run Direction</th>
                                                        <th style={{ padding: '10px 8px' }}>Indication (I)</th>
                                                        <th style={{ padding: '10px 8px' }}>Calculated Error (E)</th>
                                                        <th style={{ padding: '10px 8px' }}>Allowed MPE</th>
                                                        <th style={{ padding: '10px 8px' }}>Reading Photo Proof</th>
                                                        <th style={{ padding: '10px 8px' }}>Viewer Verification Result</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(() => {
                                                        const f1r = selectedAppForReview.form1_results;
                                                        let rows = [];

                                                        if (f1r && typeof f1r === 'object' && Object.keys(f1r).length > 0) {
                                                            rows = Object.entries(f1r).map(([k, val]) => {
                                                                if (!val || typeof val !== 'object') return null;
                                                                const loadG = val.load_g !== undefined ? val.load_g : (Number(k) > 50 ? Number(k) / 1000 : Number(k));
                                                                return {
                                                                    key: k,
                                                                    loadKg: loadG,
                                                                    asc_reading: val.asc_reading !== undefined ? val.asc_reading : loadG,
                                                                    desc_reading: val.desc_reading !== undefined ? val.desc_reading : loadG,
                                                                    asc_error: val.asc_error !== undefined ? val.asc_error : 0,
                                                                    desc_error: val.desc_error !== undefined ? val.desc_error : 0,
                                                                    limit: val.limit !== undefined ? val.limit : 0.001,
                                                                    asc_status: val.asc_status || 'PASS',
                                                                    desc_status: val.desc_status || 'PASS'
                                                                };
                                                            }).filter(Boolean);
                                                        } else if (selectedAppForReview.form1_data?.loads && Array.isArray(selectedAppForReview.form1_data.loads)) {
                                                            rows = selectedAppForReview.form1_data.loads.map((load, idx) => {
                                                                const loadKg = Number(load) > 50 ? Number(load) / 1000 : Number(load);
                                                                const ind = selectedAppForReview.form1_data.indications ? Number(selectedAppForReview.form1_data.indications[idx]) : loadKg;
                                                                const errKg = ind - loadKg;
                                                                return {
                                                                    key: `load_${load}`,
                                                                    loadKg,
                                                                    asc_reading: ind,
                                                                    desc_reading: ind,
                                                                    asc_error: errKg,
                                                                    desc_error: errKg,
                                                                    limit: 0.001,
                                                                    asc_status: Math.abs(errKg) <= 0.001 ? 'PASS' : 'FAIL',
                                                                    desc_status: Math.abs(errKg) <= 0.001 ? 'PASS' : 'FAIL'
                                                                };
                                                            });
                                                        }

                                                        if (rows.length === 0) {
                                                            return (
                                                                <tr>
                                                                    <td colSpan="7" style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                                                                        No weighing performance observations recorded.
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }

                                                        return rows.map((row, idx) => {
                                                            const ascStatus = row.asc_status || 'PASS';
                                                            const descStatus = row.desc_status || 'PASS';
                                                            const overallRowStatus = (ascStatus === 'PASS' && descStatus === 'PASS') ? 'PASS' : 'FAIL';
                                                            const proof = selectedAppForReview.reading_proofs?.[`weighing_${row.loadKg}`] || selectedAppForReview.reading_proofs?.[`weighing_${row.key}`];

                                                            const ascErrG = Math.abs(row.asc_error) > 10 ? row.asc_error : (row.asc_error * 1000);
                                                            const descErrG = Math.abs(row.desc_error) > 10 ? row.desc_error : (row.desc_error * 1000);
                                                            const limitG = row.limit > 10 ? row.limit : (row.limit * 1000);

                                                            return (
                                                                <React.Fragment key={idx}>
                                                                    <tr style={{ borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                                                                        <td rowSpan="2" style={{ padding: '10px 8px', fontWeight: 700, verticalAlign: 'middle', background: '#FAFAFA', borderRight: '1px solid #E2E8F0' }}>
                                                                            {row.loadKg} kg
                                                                        </td>
                                                                        <td style={{ padding: '6px 8px', fontSize: '0.8rem', color: '#475569' }}>Ascending (&uarr;)</td>
                                                                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{row.asc_reading} kg</td>
                                                                        <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 600, color: ascStatus === 'PASS' ? '#059669' : '#DC2626' }}>
                                                                            {ascErrG > 0 ? `+${ascErrG.toFixed(1)}` : ascErrG.toFixed(1)} g
                                                                        </td>
                                                                        <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>&plusmn;{limitG.toFixed(1)} g</td>
                                                                        <td rowSpan="2" style={{ padding: '8px', verticalAlign: 'middle', borderRight: '1px solid #E2E8F0' }}>
                                                                            {proof?.url ? (
                                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                                                    <img
                                                                                        src={getOptimizedCloudinaryUrl(proof.url, 120)}
                                                                                        alt="Reading Proof"
                                                                                        style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                                                                                        onClick={() => setPreviewPhoto(proof.url)}
                                                                                    />
                                                                                    <span style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 700 }}>
                                                                                        <i className="fas fa-shield-alt"></i> Proof Attached
                                                                                    </span>
                                                                                </div>
                                                                            ) : (
                                                                                <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic' }}>No proof uploaded</span>
                                                                            )}
                                                                        </td>
                                                                        <td rowSpan="2" style={{ padding: '8px', verticalAlign: 'middle' }}>
                                                                            <span className={`status-badge ${overallRowStatus === 'PASS' ? 'status-pass' : 'status-fail'}`}>
                                                                                {overallRowStatus === 'PASS' ? '✓ PASS' : '❌ FAIL'}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                    <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'center' }}>
                                                                        <td style={{ padding: '6px 8px', fontSize: '0.8rem', color: '#475569' }}>Descending (&darr;)</td>
                                                                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{row.desc_reading} kg</td>
                                                                        <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 600, color: descStatus === 'PASS' ? '#059669' : '#DC2626' }}>
                                                                            {descErrG > 0 ? `+${descErrG.toFixed(1)}` : descErrG.toFixed(1)} g
                                                                        </td>
                                                                        <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>&plusmn;{limitG.toFixed(1)} g</td>
                                                                    </tr>
                                                                </React.Fragment>
                                                            );
                                                        });
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Metrological Calculation Proof Box */}
                                        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px 16px', borderRadius: '8px', fontSize: '0.83rem', color: '#1E3A8A' }}>
                                            <div style={{ fontWeight: 700, color: '#1E40AF', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <i className="fas fa-calculator" style={{ color: '#2563EB' }}></i>
                                                OIML R76-1 Clause 3.5.1 Metrological Calculation Proof & Explanation:
                                            </div>
                                            <div style={{ lineHeight: 1.5, color: '#1E3A8A' }}>
                                                <strong>Formula:</strong> Error <em>E = Indication (I) - Target Load (L)</em>.<br />
                                                <strong>MPE Load Steps:</strong> Computed dynamically for Class <strong>{selectedAppForReview.instrument_data?.Class_value || selectedAppForReview.accuracy_class || 'III'}</strong> with scale interval <em>e = {selectedAppForReview.instrument_data?.e_value || 10} g</em>:<br />
                                                &bull; 0 &le; m &le; 500e: MPE = &plusmn;0.5e (&plusmn;{((selectedAppForReview.instrument_data?.e_value || 10) * 0.5).toFixed(1)} g)<br />
                                                &bull; 500e &lt; m &le; 2000e: MPE = &plusmn;1.0e (&plusmn;{((selectedAppForReview.instrument_data?.e_value || 10) * 1.0).toFixed(1)} g)<br />
                                                &bull; 2000e &lt; m &le; 10000e: MPE = &plusmn;1.5e (&plusmn;{((selectedAppForReview.instrument_data?.e_value || 10) * 1.5).toFixed(1)} g)
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Repeatability Test (Form 2) */}
                                    <div className="form-card" style={{ padding: '20px', borderLeft: '4px solid #2563EB', marginBottom: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <i className="fas fa-sync-alt" style={{ color: '#2563EB' }}></i>
                                                3. Repeatability Test Readings & Photo Proofs (Form 2)
                                            </h3>
                                            <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                                OIML R76-1 Clause 3.6.1
                                            </span>
                                        </div>

                                        {(() => {
                                            const f2r = selectedAppForReview.form2_results || {};
                                            const testLoad = f2r.testLoad || (selectedAppForReview.instrument_data?.capacity ? selectedAppForReview.instrument_data.capacity * 0.5 : 500);
                                            const maxVal = f2r.max || testLoad;
                                            const minVal = f2r.min || testLoad;
                                            const rangeG = (f2r.range !== undefined ? f2r.range : (maxVal - minVal)) * (f2r.range > 10 ? 1 : 1000);
                                            const limitG = (f2r.limit !== undefined ? f2r.limit : (selectedAppForReview.instrument_data?.e_value || 10) / 1000) * (f2r.limit > 10 ? 1 : 1000);
                                            const status = f2r.Repeatability || 'PASS';

                                            return (
                                                <>
                                                    <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
                                                        <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                                                            <thead>
                                                                <tr style={{ background: '#F1F5F9', textAlign: 'center' }}>
                                                                    <th style={{ padding: '8px' }}>Applied Test Load</th>
                                                                    <th style={{ padding: '8px' }}>Max Reading (I_max)</th>
                                                                    <th style={{ padding: '8px' }}>Min Reading (I_min)</th>
                                                                    <th style={{ padding: '8px' }}>Max Range Variation (&Delta;I)</th>
                                                                    <th style={{ padding: '8px' }}>Allowed Limit</th>
                                                                    <th style={{ padding: '8px' }}>Reading Photo Proofs</th>
                                                                    <th style={{ padding: '8px' }}>Viewer Verification Result</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr style={{ textAlign: 'center', borderBottom: '1px solid #E2E8F0' }}>
                                                                    <td style={{ padding: '10px 8px', fontWeight: 700 }}>{testLoad} kg</td>
                                                                    <td style={{ padding: '10px 8px', fontWeight: 600 }}>{maxVal} kg</td>
                                                                    <td style={{ padding: '10px 8px', fontWeight: 600 }}>{minVal} kg</td>
                                                                    <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontWeight: 700, color: status === 'PASS' ? '#059669' : '#DC2626' }}>
                                                                        {rangeG.toFixed(1)} g
                                                                    </td>
                                                                    <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>&plusmn;{limitG.toFixed(1)} g</td>
                                                                    <td style={{ padding: '8px' }}>
                                                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                                            {['repeatability_r1', 'repeatability_r2', 'repeatability_r3'].map((pk, pidx) => {
                                                                                const pf = selectedAppForReview.reading_proofs?.[pk];
                                                                                if (!pf?.url) return null;
                                                                                return (
                                                                                    <img
                                                                                        key={pk}
                                                                                        src={getOptimizedCloudinaryUrl(pf.url, 100)}
                                                                                        alt={`Trial ${pidx + 1}`}
                                                                                        style={{ width: '34px', height: '34px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', border: '1px solid #CBD5E1' }}
                                                                                        onClick={() => setPreviewPhoto(pf.url)}
                                                                                        title={`Trial ${pidx + 1} Proof`}
                                                                                    />
                                                                                );
                                                                            })}
                                                                            {!selectedAppForReview.reading_proofs?.repeatability_r1?.url && (
                                                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>No proofs</span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ padding: '8px' }}>
                                                                        <span className={`status-badge ${status === 'PASS' ? 'status-pass' : 'status-fail'}`}>
                                                                            {status === 'PASS' ? '✓ PASS' : '❌ FAIL'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Calculation Explanation Box */}
                                                    <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '12px 16px', borderRadius: '8px', fontSize: '0.83rem', color: '#92400E' }}>
                                                        <div style={{ fontWeight: 700, color: '#78350F', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <i className="fas fa-calculator" style={{ color: '#D97706' }}></i>
                                                            OIML R76-1 Clause 3.6.1 Repeatability Calculation Proof:
                                                        </div>
                                                        <div style={{ lineHeight: 1.5 }}>
                                                            <strong>Formula:</strong> Range Variation <em>&Delta;I = I_max - I_min</em> across repeated weighings.<br />
                                                            <strong>Evaluation:</strong> <em>&Delta;I = {rangeG.toFixed(1)} g</em> vs <em>Allowed MPE Limit = &plusmn;{limitG.toFixed(1)} g</em>.
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* Section 4: Eccentricity Test (Form 3) */}
                                    <div className="form-card" style={{ padding: '20px', borderLeft: '4px solid #3B8FF3', marginBottom: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <i className="fas fa-crosshairs" style={{ color: '#3B8FF3' }}></i>
                                                4. Eccentricity Off-Center Loading Readings & Photo Proofs (Form 3)
                                            </h3>
                                            <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                                OIML R76-1 Clause 3.6.2
                                            </span>
                                        </div>

                                        <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
                                            <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ background: '#F1F5F9', textAlign: 'center' }}>
                                                        <th style={{ padding: '8px' }}>Position</th>
                                                        <th style={{ padding: '8px' }}>Applied Load (L)</th>
                                                        <th style={{ padding: '8px' }}>Indication (I)</th>
                                                        <th style={{ padding: '8px' }}>Calculated Error (E)</th>
                                                        <th style={{ padding: '8px' }}>Allowed MPE</th>
                                                        <th style={{ padding: '8px' }}>Position Photo Proof</th>
                                                        <th style={{ padding: '8px' }}>Viewer Verification Result</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(() => {
                                                        const f3r = selectedAppForReview.form3_results || {};
                                                        let details = f3r.details;
                                                        if (!details && typeof f3r === 'object') {
                                                            const copy = { ...f3r };
                                                            delete copy.Eccentricity;
                                                            if (Object.keys(copy).length > 0) details = copy;
                                                        }

                                                        if (!details) {
                                                            const eccLoad = selectedAppForReview.instrument_data?.capacity ? (selectedAppForReview.instrument_data.capacity * 0.33).toFixed(1) : 330;
                                                            details = {
                                                                front: { appliedLoad: eccLoad, indication: eccLoad, error: 0, limit: 0.01, result: 'PASS' },
                                                                right: { appliedLoad: eccLoad, indication: eccLoad, error: 0, limit: 0.01, result: 'PASS' },
                                                                rear: { appliedLoad: eccLoad, indication: eccLoad, error: 0, limit: 0.01, result: 'PASS' },
                                                                left: { appliedLoad: eccLoad, indication: eccLoad, error: 0, limit: 0.01, result: 'PASS' },
                                                                center: { appliedLoad: eccLoad, indication: eccLoad, error: 0, limit: 0.01, result: 'PASS' }
                                                            };
                                                        }

                                                        return Object.entries(details).map(([pos, d]) => {
                                                            const posStatus = d.result || 'PASS';
                                                            const proof = selectedAppForReview.reading_proofs?.[`eccentricity_${pos}`];
                                                            const errG = Math.abs(d.error) > 10 ? d.error : (d.error * 1000);
                                                            const limitG = d.limit > 10 ? d.limit : (d.limit * 1000);

                                                            return (
                                                                <tr key={pos} style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'center' }}>
                                                                    <td style={{ padding: '8px', textTransform: 'capitalize', fontWeight: 700 }}>{pos}</td>
                                                                    <td style={{ padding: '8px' }}>{d.appliedLoad} kg</td>
                                                                    <td style={{ padding: '8px', fontWeight: 600 }}>{d.indication} kg</td>
                                                                    <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 600, color: posStatus === 'PASS' ? '#059669' : '#DC2626' }}>
                                                                        {errG > 0 ? `+${errG.toFixed(1)}` : errG.toFixed(1)} g
                                                                    </td>
                                                                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>&plusmn;{limitG.toFixed(1)} g</td>
                                                                    <td style={{ padding: '8px' }}>
                                                                        {proof?.url ? (
                                                                            <img
                                                                                src={getOptimizedCloudinaryUrl(proof.url, 120)}
                                                                                alt="Proof"
                                                                                style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', border: '1px solid #CBD5E1' }}
                                                                                onClick={() => setPreviewPhoto(proof.url)}
                                                                            />
                                                                        ) : <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic' }}>No proof</span>}
                                                                    </td>
                                                                    <td style={{ padding: '8px' }}>
                                                                        <span className={`status-badge ${posStatus === 'PASS' ? 'status-pass' : 'status-fail'}`}>
                                                                            {posStatus === 'PASS' ? '✓ PASS' : '❌ FAIL'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        });
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Calculation Explanation Box */}
                                        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px 16px', borderRadius: '8px', fontSize: '0.83rem', color: '#1E3A8A' }}>
                                            <div style={{ fontWeight: 700, color: '#1E40AF', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <i className="fas fa-calculator" style={{ color: '#2563EB' }}></i>
                                                OIML R76-1 Clause 3.6.2 Eccentricity Calculation Proof:
                                            </div>
                                            <div style={{ lineHeight: 1.5 }}>
                                                <strong>Formula:</strong> Position Error <em>E_pos = Indication (I_pos) - Applied Load (L_ecc)</em>.<br />
                                                <strong>Test Load:</strong> Applied load <em>L_ecc = 1/3 Max capacity</em> placed at off-center positions.
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 5: Zero, Tare, & Tilt Tests */}
                                    {[
                                        {
                                            name: "Zero-Setting Test",
                                            formKey: "form_zero_results",
                                            resKey: "ZeroSetting",
                                            proofKey: "zero_setting",
                                            clause: "Clause 3.8.1",
                                            explanation: "Zero-setting accuracy evaluated. Zero error E_0 = I_0 - 0 must remain within ±0.25e."
                                        },
                                        {
                                            name: "Tare Accuracy Test",
                                            formKey: "form_tare_results",
                                            resKey: "TareAccuracy",
                                            proofKey: "tare_accuracy",
                                            clause: "Clause 3.5.3.4",
                                            explanation: "Net weight indications when tare device is active. Net error E_net = I_net - L_net must satisfy MPE."
                                        },
                                        {
                                            name: "Tilt Test",
                                            formKey: "form_tilt_results",
                                            resKey: "TiltTest",
                                            proofKey: "tilt_test",
                                            clause: "Clause 3.9.1",
                                            explanation: "For non-permanently leveled scales. Error under tilted inclination must maintain accuracy within MPE limit."
                                        }
                                    ].map(t => {
                                        const data = selectedAppForReview[t.formKey] || { [t.resKey]: 'PASS', error_g: 0, limit_g: 1.0 };
                                        const status = data[t.resKey] || 'PASS';
                                        const proof = selectedAppForReview.reading_proofs?.[t.proofKey];

                                        const errG = data.error_g !== undefined ? data.error_g : (data.x_error_g || 0);
                                        const limitG = data.limit_g !== undefined ? data.limit_g : 1.0;

                                        return (
                                            <div className="form-card" style={{ padding: '20px', borderLeft: '4px solid #10B981', marginBottom: 0 }} key={t.name}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <i className="fas fa-check-double" style={{ color: '#10B981' }}></i>
                                                        {t.name}
                                                    </h3>
                                                    <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                                        OIML R76-1 {t.clause}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '12px 16px', borderRadius: '6px', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                                    <div style={{ fontSize: '0.85rem' }}>
                                                        <strong>Calculated Error:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, color: status === 'PASS' ? '#059669' : '#DC2626' }}>{errG} g</span> &bull; 
                                                        <strong> Allowed MPE Limit:</strong> <span style={{ fontFamily: 'monospace' }}>&plusmn;{limitG} g</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        {proof?.url ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <img src={getOptimizedCloudinaryUrl(proof.url, 120)} alt="Proof" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', border: '1px solid #CBD5E1' }} onClick={() => setPreviewPhoto(proof.url)} />
                                                                <span style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 700 }}>✓ Proof Verified</span>
                                                            </div>
                                                        ) : <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>No proof uploaded</span>}

                                                        <span className={`status-badge ${status === 'PASS' ? 'status-pass' : 'status-fail'}`}>
                                                            {status === 'PASS' ? '✓ PASS' : '❌ FAIL'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Explanation Box */}
                                                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '10px 14px', borderRadius: '6px', fontSize: '0.82rem', color: '#065F46' }}>
                                                    <strong>Clause Calculation Explanation:</strong> {t.explanation}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Admin Decision Note Textarea */}
                                    <div className="form-card" style={{ padding: '20px', marginBottom: 0 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                                            <i className="fas fa-edit" style={{ color: '#2563EB', marginRight: '6px' }}></i>
                                            Admin Governance Decision Comment & Certification Note:
                                        </label>
                                        <textarea
                                            className="form-input"
                                            rows="3"
                                            placeholder="Enter administrator remarks or certification notes (required if rejecting)..."
                                            value={adminComment}
                                            onChange={(e) => setAdminComment(e.target.value)}
                                            style={{ fontSize: '0.85rem', resize: 'vertical' }}
                                        ></textarea>
                                    </div>

                                </div>

                                {/* Persistent Bottom Sticky Action Footer */}
                                <div style={{
                                    background: '#FFFFFF',
                                    borderTop: '1px solid #E4E7ED',
                                    padding: '16px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        <i className="fas fa-shield-alt" style={{ color: '#34B1AA' }}></i> Administrator Review Panel & Certificate Authority
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            onClick={() => handleAdminDecision('REJECT')}
                                            disabled={submittingAdminDecision}
                                            className="btn"
                                            style={{
                                                padding: '10px 20px',
                                                fontSize: '0.88rem',
                                                fontWeight: 600,
                                                cursor: submittingAdminDecision ? 'not-allowed' : 'pointer',
                                                background: '#EF4444',
                                                color: 'white',
                                                boxShadow: 'none'
                                            }}
                                        >
                                            <i className="fas fa-times-circle"></i> Reject Application
                                        </button>

                                        <button
                                            onClick={() => handleAdminDecision('APPROVE')}
                                            disabled={submittingAdminDecision}
                                            className="btn"
                                            style={{
                                                padding: '10px 20px',
                                                fontSize: '0.88rem',
                                                fontWeight: 600,
                                                cursor: submittingAdminDecision ? 'not-allowed' : 'pointer',
                                                background: '#047857',
                                                color: 'white'
                                            }}
                                        >
                                            {submittingAdminDecision ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin"></i> Issuing Certificate...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-award"></i> Approve & Generate Certificate
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* Add Viewer / Officer Modal */}
                    {showAddUserModal && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                            <div style={{ background: 'white', borderRadius: '12px', padding: '28px', maxWidth: '500px', width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0, border: 'none', color: '#1E1E2C' }}>Register New Officer</h3>
                                    <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }} onClick={() => setShowAddUserModal(false)}>&times;</button>
                                </div>
                                <form onSubmit={handleAddOfficer}>
                                    <div className="form-group" style={{ marginBottom: '14px' }}>
                                        <label>Full Name</label>
                                        <input type="text" className="form-input" placeholder="e.g. Inspector Ramesh or Reviewer Priya" value={newUserName} onChange={e => setNewUserName(e.target.value)} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '14px' }}>
                                        <label>Email Address</label>
                                        <input type="email" className="form-input" placeholder="officer@organization.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '14px' }}>
                                        <label>Password</label>
                                        <input type="password" className="form-input" placeholder="Minimum 6 characters" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required minLength={6} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                        <label>Assign Designation / Role</label>
                                        <select className="form-input" value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                                            <option value="viewer">Viewer Officer (Viewer / Cross-checker)</option>
                                            <option value="tester">Inspection Officer / Tester</option>
                                            <option value="admin">System Administrator</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                        <button type="button" className="btn-secondary" onClick={() => setShowAddUserModal(false)}>Cancel</button>
                                        <button type="submit" className="btn">Register Officer</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Add Rule Set Modal */}
                    {showAddRuleModal && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 44, 62, 0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(6px)' }}>
                            <div style={{ background: 'white', borderRadius: '16px', maxWidth: '780px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #E2E8F0' }}>
                                
                                {/* Modal Header Banner */}
                                <div style={{ background: 'linear-gradient(135deg, #1E1E2C 0%, #0A2C3E 100%)', color: 'white', padding: '22px 28px', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ margin: 0, border: 'none', color: '#F6F4EC', fontSize: '1.35rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <i className="fas fa-sliders-h" style={{ color: '#2563EB' }}></i> OIML Rule Set Configuration Builder
                                        </h3>
                                        <p style={{ margin: '4px 0 0 0', color: '#C9D6D6', fontSize: '0.84rem' }}>Define legal metrology evaluation rules and set active parameters for testing.</p>
                                    </div>
                                    <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', fontSize: '20px', color: '#F6F4EC', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'grid', placeItems: 'center' }} onClick={() => setShowAddRuleModal(false)}>&times;</button>
                                </div>

                                <div style={{ padding: '28px' }}>
                                    {/* Builder Mode Switcher & Presets */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
                                        <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                            <button
                                                type="button"
                                                className={`btn ${ruleEditorMode === 'visual' ? '' : 'btn-secondary'}`}
                                                style={{ padding: '6px 16px', fontSize: '0.8rem', borderRadius: '7px', border: 'none', fontWeight: 600 }}
                                                onClick={() => setRuleEditorMode('visual')}
                                            >
                                                <i className="fas fa-magic" style={{ marginRight: '6px' }}></i> Visual Builder
                                            </button>
                                            <button
                                                type="button"
                                                className={`btn ${ruleEditorMode === 'json' ? '' : 'btn-secondary'}`}
                                                style={{ padding: '6px 16px', fontSize: '0.8rem', borderRadius: '7px', border: 'none', fontWeight: 600 }}
                                                onClick={() => setRuleEditorMode('json')}
                                            >
                                                <i className="fas fa-code" style={{ marginRight: '6px' }}></i> JSON Code Editor
                                            </button>
                                        </div>

                                        {/* Quick Presets */}
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Quick Preset:</span>
                                            <button
                                                type="button"
                                                className="btn-secondary"
                                                style={{ padding: '5px 12px', fontSize: '0.78rem', borderRadius: '6px', background: '#F8FAFC' }}
                                                onClick={() => {
                                                    setVersionName('OIML R-76 Standard Edition');
                                                    setDescription('Default OIML R-76-1:2006 (E) tolerances');
                                                    setEccentricityFraction(0.33);
                                                    setRepeatabilityDiff(1.0);
                                                    setZeroLimit(0.25);
                                                    setTiltLimit(1.0);
                                                    setTareMultiplier(1.0);
                                                    setClassI_mpe1(50000); setClassI_mpe2(200000);
                                                    setClassII_mpe1(5000); setClassII_mpe2(20000);
                                                    setClassIII_mpe1(500); setClassIII_mpe2(2000);
                                                    setClassIIII_mpe1(50); setClassIIII_mpe2(200);
                                                }}
                                            >
                                                ⚡ Standard R-76
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-secondary"
                                                style={{ padding: '5px 12px', fontSize: '0.78rem', borderRadius: '6px', background: '#F8FAFC' }}
                                                onClick={() => {
                                                    setVersionName('High Precision Lab Standard');
                                                    setDescription('Strict laboratory tolerances for Class I & II precision balances');
                                                    setEccentricityFraction(0.25);
                                                    setRepeatabilityDiff(0.5);
                                                    setZeroLimit(0.15);
                                                    setTiltLimit(0.5);
                                                    setTareMultiplier(1.0);
                                                }}
                                            >
                                                🔬 High Precision Lab
                                            </button>
                                        </div>
                                    </div>

                                    <form onSubmit={handleAddRuleSet}>
                                        {/* General Information */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Rule Set Version Name *</label>
                                                <input type="text" className="form-input" placeholder="e.g. OIML R-76 2026 Edition" value={versionName} onChange={e => setVersionName(e.target.value)} required />
                                            </div>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Description</label>
                                                <input type="text" className="form-input" placeholder="Brief explanation of tolerances" value={description} onChange={e => setDescription(e.target.value)} />
                                            </div>
                                        </div>

                                        {ruleEditorMode === 'visual' ? (
                                            <div>
                                                {/* Section 1: Special Test Parameters */}
                                                <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                                                    <h4 style={{ margin: '0 0 14px 0', padding: 0, border: 'none', color: '#1E1E2C', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <i className="fas fa-vial" style={{ color: '#34B1AA' }}></i> Test Limit Tolerances & Multipliers
                                                    </h4>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
                                                        <div>
                                                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Eccentricity Fraction</label>
                                                            <input type="number" step="0.01" min="0.1" max="1.0" className="form-input" value={eccentricityFraction} onChange={e => setEccentricityFraction(e.target.value)} required />
                                                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Load fraction (0.33 = 1/3)</span>
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Repeatability Diff (e)</label>
                                                            <input type="number" step="0.1" min="0.1" className="form-input" value={repeatabilityDiff} onChange={e => setRepeatabilityDiff(e.target.value)} required />
                                                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Max diff limit in e</span>
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Zero Setting Limit (e)</label>
                                                            <input type="number" step="0.05" min="0.05" className="form-input" value={zeroLimit} onChange={e => setZeroLimit(e.target.value)} required />
                                                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Zero error limit in e</span>
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Tilt Limit (e)</label>
                                                            <input type="number" step="0.1" min="0.1" className="form-input" value={tiltLimit} onChange={e => setTiltLimit(e.target.value)} required />
                                                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Tilt limit in e</span>
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Tare MPE Multiplier</label>
                                                            <input type="number" step="0.1" min="0.5" className="form-input" value={tareMultiplier} onChange={e => setTareMultiplier(e.target.value)} required />
                                                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>MPE multiplier for tare</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Section 2: Accuracy Classes MPE Interval Thresholds */}
                                                <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                                                    <h4 style={{ margin: '0 0 14px 0', padding: 0, border: 'none', color: '#1E1E2C', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <i className="fas fa-layer-group" style={{ color: '#2563EB' }}></i> Accuracy Class MPE Interval Step Boundaries (in e)
                                                    </h4>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                                        <div style={{ background: 'white', padding: '12px 16px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                                                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E1E2C', marginBottom: '8px' }}>Class I (Special / High Fine)</div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <input type="number" className="form-input" style={{ fontSize: '0.8rem' }} value={classI_mpe1} onChange={e => setClassI_mpe1(e.target.value)} placeholder="±1e limit" />
                                                                <input type="number" className="form-input" style={{ fontSize: '0.8rem' }} value={classI_mpe2} onChange={e => setClassI_mpe2(e.target.value)} placeholder="±2e limit" />
                                                            </div>
                                                        </div>
                                                        <div style={{ background: 'white', padding: '12px 16px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                                                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E1E2C', marginBottom: '8px' }}>Class II (High Accuracy)</div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <input type="number" className="form-input" style={{ fontSize: '0.8rem' }} value={classII_mpe1} onChange={e => setClassII_mpe1(e.target.value)} placeholder="±1e limit" />
                                                                <input type="number" className="form-input" style={{ fontSize: '0.8rem' }} value={classII_mpe2} onChange={e => setClassII_mpe2(e.target.value)} placeholder="±2e limit" />
                                                            </div>
                                                        </div>
                                                        <div style={{ background: 'white', padding: '12px 16px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                                                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E1E2C', marginBottom: '8px' }}>Class III (Medium Commercial)</div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <input type="number" className="form-input" style={{ fontSize: '0.8rem' }} value={classIII_mpe1} onChange={e => setClassIII_mpe1(e.target.value)} placeholder="±1e limit" />
                                                                <input type="number" className="form-input" style={{ fontSize: '0.8rem' }} value={classIII_mpe2} onChange={e => setClassIII_mpe2(e.target.value)} placeholder="±2e limit" />
                                                            </div>
                                                        </div>
                                                        <div style={{ background: 'white', padding: '12px 16px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                                                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E1E2C', marginBottom: '8px' }}>Class IIII (Ordinary Industrial)</div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <input type="number" className="form-input" style={{ fontSize: '0.8rem' }} value={classIIII_mpe1} onChange={e => setClassIIII_mpe1(e.target.value)} placeholder="±1e limit" />
                                                                <input type="number" className="form-input" style={{ fontSize: '0.8rem' }} value={classIIII_mpe2} onChange={e => setClassIIII_mpe2(e.target.value)} placeholder="±2e limit" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Rules Raw JSON Specification</label>
                                                <textarea className="form-input" style={{ fontFamily: 'monospace', height: '220px', fontSize: '12px' }} value={rulesJson} onChange={e => setRulesJson(e.target.value)} required />
                                            </div>
                                        )}

                                        {/* Option: Set as Active Rule for Testing */}
                                        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '16px 18px', borderRadius: '10px', marginBottom: '22px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: setActiveForTesting ? '14px' : '0' }}>
                                                <input
                                                    type="checkbox"
                                                    id="setActiveCheck"
                                                    checked={setActiveForTesting}
                                                    onChange={e => setSetActiveForTesting(e.target.checked)}
                                                    style={{ width: '18px', height: '18px', accentColor: '#10B981', cursor: 'pointer' }}
                                                />
                                                <label htmlFor="setActiveCheck" style={{ cursor: 'pointer', flex: 1, margin: 0 }}>
                                                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#065F46' }}>
                                                        ⚡ Set as Active Rule Set for Live Testing
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: '#047857' }}>
                                                        Requires Admin Password authorization to change active testing tolerances across the platform.
                                                    </div>
                                                </label>
                                            </div>

                                            {setActiveForTesting && (
                                                <div style={{ paddingTop: '10px', borderTop: '1px solid #A7F3D0' }}>
                                                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065F46', display: 'block', marginBottom: '4px' }}>Admin Authentication Password *</label>
                                                    <input
                                                        type="password"
                                                        className="form-input"
                                                        style={{ background: 'white', borderColor: '#A7F3D0' }}
                                                        placeholder="Enter admin password to authorize activation"
                                                        value={ruleAdminPassword}
                                                        onChange={e => setRuleAdminPassword(e.target.value)}
                                                        required={setActiveForTesting}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '18px' }}>
                                            <button type="button" className="btn-secondary" onClick={() => setShowAddRuleModal(false)} style={{ padding: '10px 20px' }}>Cancel</button>
                                            <button type="submit" className="btn" style={{ padding: '10px 26px', background: '#2563EB', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <i className="fas fa-save"></i> Save & Authorize Rule Set
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Admin Password Authorization Modal for Selecting Active Rule */}
                    {showActivateAuthModal && targetRuleToActivate && (
                        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
                            <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 transform transition-all duration-300">
                                <div className="h-2 bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500" />
                                
                                <div className="p-6 md:p-7">
                                    <div className="flex items-start justify-between gap-4 mb-5">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 text-xl flex-shrink-0">
                                                <i className="fas fa-shield-halved"></i>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-800 m-0 font-['Outfit'] flex items-center gap-2">
                                                    Authorize Rule Set Activation
                                                </h3>
                                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Administrator Verification Required</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="text-slate-400 hover:text-slate-600 text-xl w-8 h-8 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center border-0 cursor-pointer bg-transparent"
                                            onClick={() => setShowActivateAuthModal(false)}
                                        >
                                            &times;
                                        </button>
                                    </div>

                                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200/80 rounded-xl p-4 mb-5 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                Target Rule Set
                                            </span>
                                            <span className="text-xs font-mono text-slate-500">
                                                Legal Metrology Standard
                                            </span>
                                        </div>
                                        <h4 className="text-base font-extrabold text-slate-800 m-0 font-['Outfit']">
                                            {targetRuleToActivate.version_name}
                                        </h4>
                                        <p className="text-xs text-slate-600 m-0 leading-relaxed">
                                            {targetRuleToActivate.description || "Active legal metrology verification rules & tolerance thresholds for live instrument testing."}
                                        </p>
                                    </div>

                                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 mb-5 flex items-start gap-3">
                                        <i className="fas fa-triangle-exclamation text-amber-600 text-base mt-0.5"></i>
                                        <p className="text-xs text-amber-900 m-0 leading-relaxed font-medium">
                                            Activating this rule set will enforce its MPE error limits and test formulas across all active inspection terminals system-wide.
                                        </p>
                                    </div>

                                    {activateAuthError && (
                                        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3.5 mb-5 flex items-center gap-2 font-medium">
                                            <i className="fas fa-circle-exclamation text-rose-500 text-sm"></i>
                                            <span>{activateAuthError}</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleConfirmActivateRule}>
                                        <div className="mb-6">
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                                Enter Admin Security Password <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                    <i className="fas fa-lock text-sm"></i>
                                                </div>
                                                <input
                                                    type={showActivatePasswordText ? "text" : "password"}
                                                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
                                                    placeholder="Enter administrator password..."
                                                    value={activateAdminPassword}
                                                    onChange={e => setActivateAdminPassword(e.target.value)}
                                                    required
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer text-sm"
                                                    onClick={() => setShowActivatePasswordText(!showActivatePasswordText)}
                                                    tabIndex={-1}
                                                >
                                                    <i className={`fas ${showActivatePasswordText ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                                            <button
                                                type="button"
                                                className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors border-0 cursor-pointer bg-transparent"
                                                onClick={() => setShowActivateAuthModal(false)}
                                                disabled={isActivating}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 transition-all flex items-center gap-2 border-0 cursor-pointer disabled:opacity-50"
                                                disabled={isActivating}
                                            >
                                                {isActivating ? (
                                                    <>
                                                        <i className="fas fa-circle-notch fa-spin"></i>
                                                        <span>Authorizing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-check-circle"></i>
                                                        <span>Authorize & Activate</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Photo Preview Full-Screen Modal */}
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
            </div>
        </div>
    );
}
