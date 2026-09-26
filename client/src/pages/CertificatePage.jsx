import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { SkeletonReportPage } from '../components/SkeletonLoader';

export default function CertificatePage() {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/report/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) setReport(data);
                else setReport(null);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div style={{ maxWidth: '900px', margin: '40px auto', padding: '24px' }}>
            <SkeletonReportPage />
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

    const inst = report.instrument_data || {};
    const lab = report.lab_details || {};
    const dateStr = new Date(report.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const reportIdStr = `TP-${report._id.substring(0, 8).toUpperCase()}`;
    const certUrl = `${window.location.origin}/verify/${report._id}`;

    return (
        <div style={{ background: '#dfe3e8', minHeight: '100vh', padding: '30px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Screen Print Button */}
            <button
                onClick={() => window.print()}
                style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: '#1E1E2C',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    zIndex: 1000,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                <i className="fas fa-print"></i> Print Verification Certificate
            </button>

            {/* A4 Sheet Container */}
            <div style={{
                width: '210mm',
                minHeight: '297mm',
                background: 'white',
                boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
                position: 'relative',
                boxSizing: 'border-box',
                fontFamily: 'Georgia, serif',
                color: '#1E1E2C',
                padding: '20mm 16mm 16mm'
            }}>
                {/* Frame border */}
                <div style={{
                    position: 'absolute',
                    inset: '8mm',
                    border: '2px solid #1E1E2C',
                    pointerEvents: 'none'
                }}>
                    <div style={{ position: 'absolute', inset: '4px', border: '1px solid #E0B50F' }}></div>
                </div>

                {/* Watermark */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-32deg)',
                    fontFamily: 'Playfair Display, serif',
                    fontSize: '80px',
                    fontWeight: 700,
                    color: 'rgba(30, 30, 44, 0.04)',
                    letterSpacing: '6px',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none'
                }}>
                    VERIFIED OIML R-76
                </div>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px double #1E1E2C', paddingBottom: '14px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #1E1E2C, #F29F67)', display: 'grid', placeItems: 'center', color: 'white', fontSize: '22px' }}>
                            <i className="fas fa-balance-scale-right"></i>
                        </div>
                        <div>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#6C757D', fontWeight: 600 }}>
                                National Legal Metrology Authority
                            </div>
                            <h1 style={{ margin: '2px 0 0 0', fontSize: '22px', color: '#1E1E2C', fontFamily: 'Playfair Display, serif' }}>
                                VERIFICATION CERTIFICATE
                            </h1>
                            <div style={{ fontSize: '11px', color: '#6C757D', fontWeight: 600 }}>OIML R-76-1:2006 (E) Compliance Assessment</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F4F5F7', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E4E7ED' }}>
                        <QRCodeSVG value={certUrl} size={54} />
                        <div style={{ fontSize: '9px', lineHeight: '1.3' }}>
                            <div style={{ fontWeight: 700, color: '#F29F67', fontSize: '11px' }}>{reportIdStr}</div>
                            <div style={{ color: '#6C757D' }}>Date: {dateStr}</div>
                            <div style={{ color: '#34B1AA', fontWeight: 700, marginTop: '2px' }}>✓ Authentic Log</div>
                        </div>
                    </div>
                </div>

                {/* Status Banner */}
                <div style={{ background: '#F4F5F7', padding: '10px 18px', borderLeft: '4px solid #E0B50F', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#6C757D', fontWeight: 600 }}>
                        Verification Status
                    </span>
                    <span style={{ background: overallPass ? '#34B1AA' : '#E74C3C', color: 'white', fontWeight: 700, padding: '4px 14px', borderRadius: '4px', fontSize: '12px', letterSpacing: '1px' }}>
                        {overallPass ? 'CONFORMS — PASS' : 'NON-CONFORMING — FAIL'}
                    </span>
                </div>

                {/* Instrument Specs Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '11px', marginBottom: '16px' }}>
                    <div style={{ background: '#FAFBFD', padding: '12px', border: '1px solid #E4E7ED', borderRadius: '4px' }}>
                        <h4 style={{ margin: '0 0 8px 0', borderBottom: '1px solid #E4E7ED', paddingBottom: '4px', color: '#1E1E2C', fontSize: '12px' }}>Instrument Identification</h4>
                        <div><strong>Manufacturer:</strong> {inst.manufacturer || 'N/A'}</div>
                        <div><strong>Model:</strong> {inst.model || 'N/A'}</div>
                        <div><strong>Serial No:</strong> {inst.serial_no || 'N/A'}</div>
                        <div><strong>Accuracy Class:</strong> {inst.Class_value || 'N/A'}</div>
                    </div>
                    <div style={{ background: '#FAFBFD', padding: '12px', border: '1px solid #E4E7ED', borderRadius: '4px' }}>
                        <h4 style={{ margin: '0 0 8px 0', borderBottom: '1px solid #E4E7ED', paddingBottom: '4px', color: '#1E1E2C', fontSize: '12px' }}>Technical Parameters</h4>
                        <div><strong>Max Capacity (Max):</strong> {inst.capacity || 'N/A'} kg</div>
                        <div><strong>Verification Scale (e):</strong> {inst.e_value || 'N/A'} g</div>
                        <div><strong>Laboratory:</strong> {lab.name || 'Metrology Lab'} ({lab.location || 'HQ'})</div>
                        <div><strong>Environment:</strong> {lab.temperature || 20}°C, {lab.humidity || 50}% RH, {lab.voltage || 220}V</div>
                    </div>
                </div>

                {/* Test Results Summary Table */}
                <h4 style={{ margin: '16px 0 8px 0', fontSize: '13px', color: '#1E1E2C' }}>Summary of Evaluation Modules</h4>
                <table style={{ width: '100%', fontSize: '10.5px', borderCollapse: 'collapse', marginBottom: '16px' }}>
                    <thead>
                        <tr style={{ background: '#1E1E2C', color: 'white' }}>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>Evaluation Module</th>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>Standard Limit / MPE</th>
                            <th style={{ padding: '6px 10px', textAlign: 'center' }}>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {report.form0_results && (
                            <tr style={{ borderBottom: '1px solid #E4E7ED' }}>
                                <td style={{ padding: '6px 10px' }}>1. Visual & Construction Inspection</td>
                                <td style={{ padding: '6px 10px' }}>Markings, sealing, display legible & intact</td>
                                <td style={{ padding: '6px 10px', textAlign: 'center', color: '#34B1AA', fontWeight: 700 }}>PASS</td>
                            </tr>
                        )}
                        {report.form1_results && (
                            <tr style={{ borderBottom: '1px solid #E4E7ED' }}>
                                <td style={{ padding: '6px 10px' }}>2. Weighing Performance (Asc & Desc)</td>
                                <td style={{ padding: '6px 10px' }}>OIML R-76 Table 1 MPE Tier Boundaries</td>
                                <td style={{ padding: '6px 10px', textAlign: 'center', color: testStatus.weighing === 'PASS' ? '#34B1AA' : '#E74C3C', fontWeight: 700 }}>{testStatus.weighing}</td>
                            </tr>
                        )}
                        {report.form2_results && (
                            <tr style={{ borderBottom: '1px solid #E4E7ED' }}>
                                <td style={{ padding: '6px 10px' }}>3. Repeatability Test</td>
                                <td style={{ padding: '6px 10px' }}>Max diff ≤ 1.0 e at ½ Max Load</td>
                                <td style={{ padding: '6px 10px', textAlign: 'center', color: testStatus.repeatability === 'PASS' ? '#34B1AA' : '#E74C3C', fontWeight: 700 }}>{testStatus.repeatability}</td>
                            </tr>
                        )}
                        {report.form3_results && (
                            <tr style={{ borderBottom: '1px solid #E4E7ED' }}>
                                <td style={{ padding: '6px 10px' }}>4. Eccentricity Off-Center Test</td>
                                <td style={{ padding: '6px 10px' }}>5 loading positions ≤ MPE</td>
                                <td style={{ padding: '6px 10px', textAlign: 'center', color: testStatus.eccentricity === 'PASS' ? '#34B1AA' : '#E74C3C', fontWeight: 700 }}>{testStatus.eccentricity}</td>
                            </tr>
                        )}
                        {report.form_zero_results && (
                            <tr style={{ borderBottom: '1px solid #E4E7ED' }}>
                                <td style={{ padding: '6px 10px' }}>5. Zero-Setting Accuracy</td>
                                <td style={{ padding: '6px 10px' }}>Limit: ±0.25 e</td>
                                <td style={{ padding: '6px 10px', textAlign: 'center', color: testStatus.zero === 'PASS' ? '#34B1AA' : '#E74C3C', fontWeight: 700 }}>{testStatus.zero}</td>
                            </tr>
                        )}
                        {report.form_tare_results && (
                            <tr style={{ borderBottom: '1px solid #E4E7ED' }}>
                                <td style={{ padding: '6px 10px' }}>6. Tare Accuracy Test</td>
                                <td style={{ padding: '6px 10px' }}>Tolerance: 1.0 × MPE</td>
                                <td style={{ padding: '6px 10px', textAlign: 'center', color: testStatus.tare === 'PASS' ? '#34B1AA' : '#E74C3C', fontWeight: 700 }}>{testStatus.tare}</td>
                            </tr>
                        )}
                        {report.form_tilt_results && (
                            <tr style={{ borderBottom: '1px solid #E4E7ED' }}>
                                <td style={{ padding: '6px 10px' }}>8. Tilt Test</td>
                                <td style={{ padding: '6px 10px' }}>Limit: 1.0 e</td>
                                <td style={{ padding: '6px 10px', textAlign: 'center', color: testStatus.tilt === 'PASS' ? '#34B1AA' : '#E74C3C', fontWeight: 700 }}>{testStatus.tilt}</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Signatures */}
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', paddingTop: '24px', borderTop: '1px solid #E4E7ED', fontSize: '11px' }}>
                    <div>
                        <div style={{ height: '32px', borderBottom: '1px solid #1E1E2C', width: '180px', marginBottom: '4px' }}></div>
                        <div><strong>Verification Officer / Tester</strong></div>
                        <div style={{ color: '#6C757D' }}>Name: {report.createdBy || 'Nishant'}</div>
                    </div>
                    <div>
                        <div style={{ height: '32px', borderBottom: '1px solid #1E1E2C', width: '180px', marginBottom: '4px' }}></div>
                        <div><strong>Approving Authority / Seal</strong></div>
                        <div style={{ color: '#6C757D' }}>Legal Metrology Department</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
