import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { SkeletonReportPage } from '../components/SkeletonLoader';

export default function ReportSummaryPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { authFetch } = useAuth();

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authFetch(`/api/report/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) setReport(data);
                else setReport(null);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id, authFetch]);

    if (loading) return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <Header title="Report Summary" />
                <div className="app-content">
                    <SkeletonReportPage />
                </div>
            </div>
        </div>
    );
    if (!report) return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>Report not found!</div>;

    let overallPass = true;
    let passCount = 0;
    let failCount = 0;
    let totalTests = 0;

    const checkStatus = (resultsObj) => {
        if (!resultsObj) return null;
        totalTests++;
        let isPass = true;
        if (JSON.stringify(resultsObj).includes('"FAIL"')) {
            isPass = false;
        }
        if (isPass) passCount++;
        else { failCount++; overallPass = false; }
        return isPass ? "PASS" : "FAIL";
    };

    const testStatus = {
        visual: checkStatus(report.form0_results),
        weighing: checkStatus(report.form1_results),
        repeatability: checkStatus(report.form2_results),
        eccentricity: checkStatus(report.form3_results),
        zero: checkStatus(report.form_zero_results),
        tare: checkStatus(report.form_tare_results),
        tilt: checkStatus(report.form_tilt_results)
    };

    const evCount = (report.evidence_register && report.evidence_register.length) ? report.evidence_register.length : (report.instrument_photo ? 1 : 0);

    return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <Header title={`Report Summary — TP-${report._id.substring(0, 8).toUpperCase()}`} />
                <div className="app-content">
                    <div className="form-card" style={{ maxWidth: '850px', margin: '0 auto 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #E4E7ED', paddingBottom: '16px', marginBottom: '20px' }}>
                            <div>
                                <h2 style={{ margin: 0, padding: 0, border: 'none', color: '#1E1E2C' }}>TEST RESULTS SUMMARY</h2>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                                    <i className="fas fa-book"></i> Rule Set: {report.rule_set_version || 'OIML R-76 V1'}
                                </div>
                            </div>
                            <span style={{ background: '#FEF0E6', color: '#F29F67', padding: '6px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem' }}>
                                TP-{report._id.substring(0, 8).toUpperCase()}
                            </span>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                            <h3 style={{ margin: '0 0 8px 0', border: 'none', color: '#1e293b' }}>
                                Instrument: {report.instrument_id || "Unknown"}
                            </h3>
                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.88rem', color: '#475569' }}>
                                <span><strong>Class:</strong> {report.instrument_data?.Class_value || 'N/A'}</span>
                                <span><strong>Max Capacity:</strong> {report.instrument_data?.capacity || 'N/A'} kg</span>
                                <span><strong>Verification Interval (e):</strong> {report.instrument_data?.e_value || 'N/A'} g</span>
                                <span><strong>Serial:</strong> {report.instrument_data?.serial_no || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Evidence Badge */}
                        <div style={{ margin: '16px 0 24px', padding: '12px 16px', background: '#f0fdfa', borderLeft: '4px solid #F29F67', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>
                                    <i className="fas fa-folder-open" style={{ color: '#F29F67' }}></i> OIML R 76-2 Evidence Register
                                </strong>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                                    {evCount} registered administrative photo(s), document(s) & test setup evidence items.
                                </p>
                            </div>
                            <span style={{ background: '#e2e8f0', color: '#0f172a', fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px' }}>
                                {evCount} Item(s)
                            </span>
                        </div>

                        {/* Test Rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            {Object.entries({
                                visual: { label: 'Visual Inspection', sub: 'Markings and conditions verified' },
                                weighing: { label: 'Weighing Performance', sub: 'Load observations against MPE' },
                                repeatability: { label: 'Repeatability', sub: 'Variation within permissible limits' },
                                eccentricity: { label: 'Eccentricity', sub: 'Off-center loading errors' },
                                zero: { label: 'Zero Test', sub: 'Zero-setting accuracy' },
                                tare: { label: 'Tare Accuracy', sub: 'Net weight accuracy' },
                                tilt: { label: 'Tilt Test', sub: 'Leveling variation' }
                            }).map(([key, item]) => {
                                const st = testStatus[key];
                                if (!st) return null;
                                return (
                                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 2px 0', border: 'none', padding: 0, fontSize: '0.95rem' }}>{item.label}</h4>
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.sub}</span>
                                        </div>
                                        <span className={`status-badge ${st === 'PASS' ? 'status-pass' : 'status-fail'}`}>
                                            <i className={`fas ${st === 'PASS' ? 'fa-check' : 'fa-times'}`}></i> {st}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Overall Result */}
                        <div style={{ background: overallPass ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${overallPass ? '#bbf7d0' : '#fecaca'}`, borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '24px' }}>
                            <h4 style={{ margin: '0 0 6px 0', color: overallPass ? '#166534' : '#991b1b', fontSize: '0.9rem' }}>OVERALL VERIFICATION RESULT</h4>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: overallPass ? '#166534' : '#991b1b', margin: '4px 0 8px' }}>
                                {overallPass ? '✓ PASS' : '❌ FAIL'}
                            </div>
                            <div style={{ fontSize: '0.88rem', color: overallPass ? '#15803d' : '#b91c1c' }}>
                                {passCount} / {totalTests} tests passed
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                            <Link to={`/report-detailed/${report._id}`} className="btn-secondary" style={{ padding: '12px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}>
                                <i className="fas fa-list"></i> View Detailed Results
                            </Link>
                            <button className="btn" style={{ background: '#3B8FF3', padding: '12px 24px' }} onClick={() => window.open(`/certificate/${report._id}`, '_blank')}>
                                <i className="fas fa-file-pdf"></i> Generate Certificate
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
