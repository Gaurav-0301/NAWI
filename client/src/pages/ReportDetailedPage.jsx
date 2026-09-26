import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { SkeletonReportPage } from '../components/SkeletonLoader';

export default function ReportDetailedPage() {
    const { id } = useParams();
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
                <Header title="Detailed Analysis" />
                <div className="app-content">
                    <SkeletonReportPage />
                </div>
            </div>
        </div>
    );
    if (!report) return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>Report not found!</div>;

    const f1r = report.form1_results || {};
    const f2r = report.form2_results || {};
    const f3r = report.form3_results || {};
    const fZr = report.form_zero_results || {};
    const fTar = report.form_tare_results || {};
    const fTilr = report.form_tilt_results || {};

    let evReg = report.evidence_register || [];
    if (evReg.length === 0 && report.instrument_photo) {
        evReg = [{ id: "EV-001", type: "Photo", description: "Instrument Front Photo", related_test: "General / Administrative", file_data: report.instrument_photo }];
    }

    return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <Header title={`Detailed Analysis — TP-${report._id.substring(0, 8).toUpperCase()}`} />
                <div className="app-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.6rem', margin: '0 0 4px 0' }}>Granular Test Observations</h2>
                            <p style={{ color: '#64748b' }}>Detailed compliance breakdown across all executed OIML R-76 test modules.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn" style={{ background: '#3B8FF3' }} onClick={() => window.open(`/certificate/${report._id}`, '_blank')}>
                                <i className="fas fa-file-pdf"></i> Save as Certificate PDF
                            </button>
                            <Link to={`/report/${report._id}`} className="btn-secondary" style={{ padding: '10px 18px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}>
                                <i className="fas fa-arrow-left"></i> Summary
                            </Link>
                        </div>
                    </div>

                    {/* Weighing Performance */}
                    {Object.keys(f1r).length > 0 && (
                        <div className="table-card">
                            <h3 style={{ marginTop: 0, color: '#F29F67' }}><i className="fas fa-weight"></i> Weighing Performance</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Load (kg)</th>
                                        <th>Direction</th>
                                        <th>Reading (kg)</th>
                                        <th>Error (g)</th>
                                        <th>Expected MPE (g)</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.values(f1r).map((row, idx) => {
                                        if (row.load_g === undefined) return null;
                                        const ascFail = row.asc_status === 'FAIL';
                                        const descFail = row.desc_status === 'FAIL';
                                        return (
                                            <React.Fragment key={idx}>
                                                <tr style={{ background: ascFail ? '#fff5f5' : 'transparent' }}>
                                                    <td rowSpan="2" style={{ fontWeight: 700, borderBottom: '2px solid #E4E7ED' }}>{row.load_g}</td>
                                                    <td>Ascending</td>
                                                    <td>{row.asc_reading}</td>
                                                    <td style={{ color: ascFail ? '#e74c3c' : 'inherit', fontFamily: 'monospace' }}>{(row.asc_error * 1000).toFixed(1)} g</td>
                                                    <td style={{ fontFamily: 'monospace' }}>±{(row.limit * 1000).toFixed(1)} g</td>
                                                    <td><span className={`status-badge ${ascFail ? 'status-fail' : 'status-pass'}`}>{row.asc_status}</span></td>
                                                </tr>
                                                <tr style={{ background: descFail ? '#fff5f5' : 'transparent', borderBottom: '2px solid #E4E7ED' }}>
                                                    <td>Descending</td>
                                                    <td>{row.desc_reading}</td>
                                                    <td style={{ color: descFail ? '#e74c3c' : 'inherit', fontFamily: 'monospace' }}>{(row.desc_error * 1000).toFixed(1)} g</td>
                                                    <td style={{ fontFamily: 'monospace' }}>±{(row.limit * 1000).toFixed(1)} g</td>
                                                    <td><span className={`status-badge ${descFail ? 'status-fail' : 'status-pass'}`}>{row.desc_status}</span></td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Repeatability */}
                    {f2r.Repeatability && (
                        <div className="table-card">
                            <h3 style={{ marginTop: 0, color: '#F29F67' }}><i className="fas fa-sync-alt"></i> Repeatability</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Test Load (kg)</th>
                                        <th>Max Reading (kg)</th>
                                        <th>Min Reading (kg)</th>
                                        <th>Max Difference (g)</th>
                                        <th>MPE Limit (g)</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>{f2r.testLoad}</td>
                                        <td>{f2r.max}</td>
                                        <td>{f2r.min}</td>
                                        <td style={{ fontFamily: 'monospace' }}>{((f2r.range || 0) * 1000).toFixed(1)} g</td>
                                        <td style={{ fontFamily: 'monospace' }}>±{((f2r.limit || 0) * 1000).toFixed(1)} g</td>
                                        <td><span className={`status-badge ${f2r.Repeatability === 'PASS' ? 'status-pass' : 'status-fail'}`}>{f2r.Repeatability}</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Eccentricity */}
                    {f3r.details && (
                        <div className="table-card">
                            <h3 style={{ marginTop: 0, color: '#F29F67' }}><i className="fas fa-crosshairs"></i> Eccentricity</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Position</th>
                                        <th>Applied (kg)</th>
                                        <th>Indication (kg)</th>
                                        <th>Error (g)</th>
                                        <th>MPE (g)</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(f3r.details).map(([pos, d]) => (
                                        <tr key={pos}>
                                            <td style={{ textTransform: 'capitalize' }}><strong>{pos}</strong></td>
                                            <td>{d.appliedLoad}</td>
                                            <td>{d.indication}</td>
                                            <td style={{ fontFamily: 'monospace' }}>{(d.error * 1000).toFixed(1)} g</td>
                                            <td style={{ fontFamily: 'monospace' }}>±{(d.limit * 1000).toFixed(1)} g</td>
                                            <td><span className={`status-badge ${d.result === 'PASS' ? 'status-pass' : 'status-fail'}`}>{d.result}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Zero, Tare, Tilt */}
                    {[
                        { name: "Zero-Setting", data: fZr, resKey: "ZeroSetting" },
                        { name: "Tare Accuracy", data: fTar, resKey: "TareAccuracy" },
                        { name: "Tilt Test", data: fTilr, resKey: "TiltTest" }
                    ].map(t => {
                        if (!t.data || !t.data[t.resKey]) return null;
                        return (
                            <div className="table-card" key={t.name}>
                                <h3 style={{ marginTop: 0, color: '#F29F67' }}>{t.name}</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Parameter</th>
                                            <th>Error</th>
                                            <th>Limit</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Measured Variation</td>
                                            <td style={{ fontFamily: 'monospace' }}>{t.data.error_g !== undefined ? `${t.data.error_g} g` : `${t.data.x_error_g || 0} g`}</td>
                                            <td style={{ fontFamily: 'monospace' }}>±{t.data.limit_g !== undefined ? `${t.data.limit_g} g` : '1.0 e'}</td>
                                            <td><span className={`status-badge ${t.data[t.resKey] === 'PASS' ? 'status-pass' : 'status-fail'}`}>{t.data[t.resKey]}</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}

                    {/* Evidence Register */}
                    <div className="table-card">
                        <h3 style={{ marginTop: 0, color: '#F29F67' }}><i className="fas fa-folder-open"></i> Evidence Register (OIML R 76-2)</h3>
                        {evReg.length > 0 ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Evidence ID</th>
                                        <th>Type</th>
                                        <th>Description</th>
                                        <th>Related Test</th>
                                        <th>Attachment / Preview</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {evReg.map((item, idx) => (
                                        <tr key={idx}>
                                            <td><strong>{item.id}</strong></td>
                                            <td><span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{item.type}</span></td>
                                            <td>{item.description}</td>
                                            <td>{item.related_test}</td>
                                            <td>
                                                {item.file_data && item.file_data.startsWith("data:image") ? (
                                                    <img src={item.file_data} alt="Evidence preview" style={{ maxHeight: '48px', maxWidth: '80px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                                ) : item.filename ? (
                                                    <span style={{ color: '#0284c7', fontSize: '0.82rem' }}><i className="fas fa-paperclip"></i> {item.filename}</span>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Document Attached</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ color: '#94a3b8', padding: '12px 0' }}>No evidence items registered.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
