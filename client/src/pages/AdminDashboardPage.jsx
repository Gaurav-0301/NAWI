import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { SkeletonDashboard } from '../components/SkeletonLoader';
import { cachedFetch, clearApiCache } from '../utils/apiCache';

export default function AdminDashboardPage() {
    const { user, authFetch } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('overview');
    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const { stats, reports, testers, rulesets, activeRule, logs } = adminData;

    return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <div className="app-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.6rem', margin: '0 0 4px 0' }}>ADMIN CONTROL PANEL</h2>
                            <p style={{ color: '#64748b' }}>Manage OIML R-76 rule sets, system logs, and registered officers.</p>
                        </div>
                        <button className="btn" onClick={() => setShowAddUserModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-user-plus"></i> Register New Officer
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'white', padding: '6px', borderRadius: '10px', border: '1px solid #E4E7ED', width: 'fit-content' }}>
                        {[
                            { id: 'overview', label: 'Overview & Reports', icon: 'fas fa-chart-pie' },
                            { id: 'rules', label: 'Rule Sets Management', icon: 'fas fa-book' },
                            { id: 'testers', label: 'Officers Directory', icon: 'fas fa-users' },
                            { id: 'logs', label: 'Audit Logs', icon: 'fas fa-history' }
                        ].map(t => (
                            <button
                                key={t.id}
                                className={`btn ${activeTab === t.id ? '' : 'btn-secondary'}`}
                                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                                onClick={() => setActiveTab(t.id)}
                            >
                                <i className={t.icon}></i> {t.label}
                            </button>
                        ))}
                    </div>

                    {/* TAB 1: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '28px' }}>
                                <div className="form-card" style={{ padding: '20px', margin: 0 }}>
                                    <h2 style={{ fontSize: '2rem', color: '#1E1E2C', margin: 0, padding: 0, border: 'none' }}>{stats.total}</h2>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Total Tests Completed</p>
                                </div>
                                <div className="form-card" style={{ padding: '20px', margin: 0 }}>
                                    <h2 style={{ fontSize: '2rem', color: '#34B1AA', margin: 0, padding: 0, border: 'none' }}>{stats.passed}</h2>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Conforming (PASS)</p>
                                </div>
                                <div className="form-card" style={{ padding: '20px', margin: 0 }}>
                                    <h2 style={{ fontSize: '2rem', color: '#E74C3C', margin: 0, padding: 0, border: 'none' }}>{stats.failed}</h2>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Non-Conforming (FAIL)</p>
                                </div>
                                <div className="form-card" style={{ padding: '20px', margin: 0 }}>
                                    <h2 style={{ fontSize: '2rem', color: '#3B8FF3', margin: 0, padding: 0, border: 'none' }}>{stats.users}</h2>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Active System Officers</p>
                                </div>
                            </div>

                            <div className="table-card">
                                <h3 style={{ marginTop: 0, color: '#F29F67' }}>All Verification Reports</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Test ID</th>
                                            <th>Instrument</th>
                                            <th>Inspector</th>
                                            <th>Date</th>
                                            <th>Rule Set</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.map(r => (
                                            <tr key={r._id} onClick={() => navigate(`/report/${r._id}`)} style={{ cursor: 'pointer' }}>
                                                <td><strong style={{ color: '#F29F67' }}>TP-{r._id.substring(0, 8).toUpperCase()}</strong></td>
                                                <td>{r.instrument_id || "Unknown"}</td>
                                                <td>{r.createdBy}</td>
                                                <td>{new Date(r.createdAt).toLocaleDateString('en-GB')}</td>
                                                <td>{r.rule_set_version || 'OIML R-76 V1'}</td>
                                                <td><span className={`status-badge ${r.status === 'PASS' ? 'status-pass' : 'status-fail'}`}>{r.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}                    {/* TAB 2: RULE SETS */}
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
                                                    <i className="fas fa-key" style={{ color: '#F29F67' }}></i> Select for Testing
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

                    {/* TAB 3: OFFICERS DIRECTORY */}
                    {activeTab === 'testers' && (
                        <div className="table-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, color: '#F29F67' }}>Registered Officers & Viewers</h3>
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

                    {/* TAB 4: AUDIT LOGS */}
                    {activeTab === 'logs' && (
                        <div className="table-card">
                            <h3 style={{ marginTop: 0, color: '#F29F67' }}>System Audit Trail</h3>
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
                                            <i className="fas fa-sliders-h" style={{ color: '#F29F67' }}></i> OIML Rule Set Configuration Builder
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
                                                        <i className="fas fa-layer-group" style={{ color: '#F29F67' }}></i> Accuracy Class MPE Interval Step Boundaries (in e)
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
                                            <button type="submit" className="btn" style={{ padding: '10px 26px', background: '#F29F67', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                {/* Modal Top Multi-gradient Accent Bar */}
                                <div className="h-2 bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500" />
                                
                                <div className="p-6 md:p-7">
                                    {/* Header */}
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

                                    {/* Targeted Rule Card Summary */}
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

                                    {/* Security Warning Notice */}
                                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 mb-5 flex items-start gap-3">
                                        <i className="fas fa-triangle-exclamation text-amber-600 text-base mt-0.5"></i>
                                        <p className="text-xs text-amber-900 m-0 leading-relaxed font-medium">
                                            Activating this rule set will enforce its MPE error limits and test formulas across all active inspection terminals system-wide.
                                        </p>
                                    </div>

                                    {/* Error Banner if Password Incorrect */}
                                    {activateAuthError && (
                                        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3.5 mb-5 flex items-center gap-2 font-medium">
                                            <i className="fas fa-circle-exclamation text-rose-500 text-sm"></i>
                                            <span>{activateAuthError}</span>
                                        </div>
                                    )}

                                    {/* Form */}
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

                                        {/* Action Buttons */}
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
                </div>
            </div>
        </div>
    );
}
