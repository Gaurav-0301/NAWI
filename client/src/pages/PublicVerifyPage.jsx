import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { SkeletonReportPage } from '../components/SkeletonLoader';

export default function PublicVerifyPage() {
    const { reportId } = useParams();
    const navigate = useNavigate();

    const [searchInput, setSearchInput] = useState(reportId || '');
    const [activeId, setActiveId] = useState(reportId || '');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (reportId) {
            setSearchInput(reportId);
            setActiveId(reportId);
        } else {
            setActiveId('');
            setData(null);
            setLoading(false);
        }
    }, [reportId]);

    useEffect(() => {
        if (!activeId) return;

        setLoading(true);
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/verify/${encodeURIComponent(activeId)}`)
            .then(res => res.json())
            .then(resData => {
                setData(resData);
            })
            .catch(err => {
                console.error("Verification fetch error:", err);
                setData({ status: "NOT_FOUND", message: "Certificate not found. Please check the ID or QR code and try again." });
            })
            .finally(() => setLoading(false));
    }, [activeId]);

    const handleSearch = (e) => {
        e.preventDefault();
        const trimmed = searchInput.trim();
        if (!trimmed) return;
        setActiveId(trimmed);
        navigate(`/verify/${trimmed}`, { replace: true });
    };

    const handleCopyHash = () => {
        if (data && data.sha256Hash) {
            navigator.clipboard.writeText(data.sha256Hash);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#F4F5F7', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 16px',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
                {/* Header / Brand */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                        width: '52px',
                        height: '52px',
                        background: '#1E1E2C',
                        color: '#2563EB',
                        borderRadius: '14px',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '24px',
                        margin: '0 auto 12px',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                    }}>
                        <i className="fas fa-balance-scale-right"></i>
                    </div>
                    <h1 style={{ fontSize: '1.4rem', color: '#1E1E2C', margin: '0 0 4px 0', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                        NAWI Legal Metrology
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                        Public Certificate & Cryptographic Seal Verification Portal
                    </p>
                </div>

                {/* Main Content Card */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    border: '1px solid #E4E7ED',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
                    maxWidth: '560px',
                    width: '100%',
                    padding: '28px 24px',
                    boxSizing: 'border-box'
                }}>
                    {/* Interactive Certificate ID Search Bar */}
                    <form onSubmit={handleSearch} style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Verify Certificate / Report ID
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                placeholder="Enter Certificate ID (e.g. TP-1024 or Report ID)..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '12px 14px',
                                    border: '1.5px solid #CBD5E1',
                                    borderRadius: '8px',
                                    fontSize: '0.92rem',
                                    outline: 'none',
                                    fontFamily: 'monospace',
                                    background: '#FAFAFC',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                                onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                            />
                            <button
                                type="submit"
                                className="btn"
                                style={{ padding: '12px 20px', borderRadius: '8px', whiteSpace: 'nowrap', fontSize: '0.9rem' }}
                            >
                                <i className="fas fa-shield-alt"></i> Verify
                            </button>
                        </div>
                    </form>

                    {/* Conditional Verification States */}
                    {loading ? (
                        <div style={{ padding: '20px 0' }}>
                            <p style={{ textAlign: 'center', fontSize: '0.88rem', color: '#64748b', marginBottom: '16px' }}>
                                <i className="fas fa-shield-alt animate-pulse" style={{ color: '#2563EB', marginRight: '6px' }}></i>
                                Verifying cryptographic hash seal with blockchain ledger...
                            </p>
                            <SkeletonReportPage />
                        </div>
                    ) : !activeId ? (
                        /* IDLE INITIAL SEARCH STATE */
                        <div style={{ textAlign: 'center', padding: '28px 16px', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                            <div style={{ fontSize: '2.2rem', color: '#34B1AA', marginBottom: '12px' }}>
                                <i className="fas fa-qrcode"></i>
                            </div>
                            <h3 style={{ fontSize: '1.05rem', color: '#1E1E2C', margin: '0 0 6px 0', fontWeight: 700 }}>
                                Public Certificate Verification
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                                Enter a Certificate ID above or scan the QR code printed on an official NAWI test report to instantly verify its cryptographic SHA-256 seal and compliance record.
                            </p>
                        </div>
                    ) : data?.status === 'VERIFIED' ? (
                        /* VERIFIED STATE */
                        <div>
                            {/* Status Badge */}
                            <div style={{
                                background: '#F0FDF4',
                                border: '1.5px solid #BBF7D0',
                                borderRadius: '12px',
                                padding: '16px',
                                textAlign: 'center',
                                marginBottom: '20px'
                            }}>
                                <div style={{ fontSize: '2rem', marginBottom: '4px' }}>✅</div>
                                <h2 style={{ fontSize: '1.25rem', color: '#166534', margin: '0 0 4px 0', fontWeight: 800 }}>
                                    Certificate Verified
                                </h2>
                                <p style={{ margin: 0, fontSize: '0.82rem', color: '#15803d' }}>
                                    Authentic & Cryptographically Untampered Record
                                </p>
                            </div>

                            {/* Superseded Warning if applicable */}
                            {data.isSuperseded && (
                                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '0.85rem', color: '#92400E' }}>
                                    <i className="fas fa-exclamation-triangle"></i> <strong>Notice:</strong> This certificate has been superseded by a later revision.
                                </div>
                            )}

                            {/* Report Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #E4E7ED', marginBottom: '16px' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Certificate ID</span>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563EB', fontFamily: 'monospace' }}>{data.reportId}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Result</span>
                                    <div>
                                        <span className={`status-badge ${data.overallResult === 'PASS' ? 'status-pass' : 'status-fail'}`}>
                                            {data.overallResult}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Instrument Details */}
                            <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '16px', fontSize: '0.88rem' }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#1E1E2C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <i className="fas fa-balance-scale" style={{ color: '#2563EB' }}></i> Instrument Specifications
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: '#334155' }}>
                                    <div><strong>Make:</strong> {data.instrument.manufacturer}</div>
                                    <div><strong>Model:</strong> {data.instrument.model}</div>
                                    <div><strong>Serial:</strong> {data.instrument.serialNumber}</div>
                                    <div><strong>Class:</strong> {data.instrument.accuracyClass}</div>
                                </div>
                            </div>

                            {/* Facility & Date */}
                            <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div><strong>Testing Facility:</strong> {data.lab.name || "National Metrology Lab"} ({data.lab.location || "HQ"})</div>
                                <div><strong>Date of Testing:</strong> {new Date(data.testDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                <div><strong>Governing Standard:</strong> {data.ruleSetVersion}</div>
                            </div>

                            {/* Review Accountability Chain */}
                            <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Verification Review Chain
                                </span>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px', fontSize: '0.8rem' }}>
                                    {data.reviewChain?.map((person, idx) => (
                                        <div key={idx} style={{ background: 'white', padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                                            <strong>{person.name}</strong> <span style={{ color: '#64748b' }}>({person.role})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SHA-256 Hash Seal Box */}
                            <div style={{ background: '#0F172A', color: '#94A3B8', padding: '12px 14px', borderRadius: '8px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#38BDF8', fontWeight: 700 }}>
                                        <i className="fas fa-key"></i> SHA-256 Cryptographic Seal
                                    </span>
                                    <button
                                        onClick={handleCopyHash}
                                        style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        {copied ? '✓ Copied' : 'Copy Hash'}
                                    </button>
                                </div>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', wordBreak: 'break-all', color: '#E2E8F0' }}>
                                    {data.sha256Hash}
                                </div>
                            </div>

                            {/* Download Certificate PDF CTA */}
                            <button
                                className="btn"
                                style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                                onClick={() => window.open(`/certificate/${data.rawId}`, '_blank')}
                            >
                                <i className="fas fa-file-pdf"></i> Download Full Certificate PDF
                            </button>
                        </div>
                    ) : data?.status === 'TAMPERED' ? (
                        /* TAMPERED STATE */
                        <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <div style={{
                                background: '#FEF2F2',
                                border: '1.5px solid #FECACA',
                                borderRadius: '12px',
                                padding: '20px',
                                marginBottom: '20px'
                            }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>⚠️</div>
                                <h2 style={{ fontSize: '1.2rem', color: '#991B1B', margin: '0 0 8px 0', fontWeight: 800 }}>
                                    Verification Failed
                                </h2>
                                <p style={{ margin: 0, fontSize: '0.88rem', color: '#B91C1C', fontWeight: 600 }}>
                                    This record does not match its original issued content.
                                </p>
                            </div>
                            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                                The data associated with ID "<strong>{activeId}</strong>" does not match its original cryptographic seal. Please contact the issuing laboratory or legal metrology authority for verification.
                            </p>
                        </div>
                    ) : (
                        /* NOT FOUND STATE */
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ fontSize: '2.5rem', color: '#94A3B8', marginBottom: '12px' }}>
                                <i className="fas fa-search"></i>
                            </div>
                            <h2 style={{ fontSize: '1.2rem', color: '#1E1E2C', margin: '0 0 8px 0' }}>
                                Certificate Not Found
                            </h2>
                            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 20px 0' }}>
                                No certificate matching "<strong>{activeId}</strong>" was found in our metrology registry. Please check the ID or QR code and try again.
                            </p>
                            <button
                                onClick={() => { setActiveId(''); setSearchInput(''); setData(null); navigate('/verify', { replace: true }); }}
                                className="btn-secondary"
                                style={{ padding: '8px 18px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                                Clear Search
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Disclaimer */}
                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Prototype system — Smart India Hackathon 2026 — Schrödinger’s Incident
                </div>
            </div>
        </div>
    );
}

