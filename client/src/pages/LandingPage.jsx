import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
    const { user } = useAuth();

    return (
        <div style={{ background: '#F4F5F7', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#1E1E2C' }}>
            <Navbar />

            {/* 1. HERO SECTION */}
            <header style={{
                padding: '70px 32px 50px',
                maxWidth: '1000px',
                margin: '0 auto',
                textAlign: 'center'
            }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(52, 177, 170, 0.1)',
                    color: '#0f766e',
                    border: '1px solid rgba(52, 177, 170, 0.3)',
                    padding: '4px 14px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    marginBottom: '20px'
                }}>
                    <i className="fas fa-shield-alt"></i> Legal Metrology Compliance Engine
                </div>

                <h1 style={{
                    fontSize: '2.8rem',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: '#1E1E2C',
                    marginBottom: '18px',
                    letterSpacing: '-0.5px'
                }}>
                    Every certificate, fully explained and independently verified.
                </h1>

                <p style={{
                    fontSize: '1.1rem',
                    color: '#475569',
                    maxWidth: '780px',
                    margin: '0 auto 32px',
                    lineHeight: 1.6
                }}>
                    Compliance-grade legal metrology system for Non-Automatic Weighing Instruments — delivering process integrity, dynamic tolerance bounds, and verifiable audit trails instead of generic form-filling.
                </p>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <Link to={user ? (user.role === 'admin' ? '/admin' : '/home') : '/login'} className="btn" style={{ padding: '14px 36px', fontSize: '1rem' }}>
                        {user ? 'Go to Dashboard' : 'Login'} <i className="fas fa-arrow-right"></i>
                    </Link>
                    <a href="#how-it-works" className="btn-secondary" style={{ padding: '14px 28px', fontSize: '1rem', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}>
                        How It Works
                    </a>
                </div>
            </header>

            {/* 2. HOW IT WORKS SECTION */}
            <section id="how-it-works" style={{ background: 'white', padding: '64px 32px', borderTop: '1px solid #E4E7ED', borderBottom: '1px solid #E4E7ED' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '8px', border: 'none', padding: 0 }}>How It Works</h2>
                        <p style={{ color: '#64748b', fontSize: '0.98rem' }}>Multi-role process integrity workflow from initial observation to public hash verification.</p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '24px'
                    }}>
                        {/* Step 1 */}
                        <div style={{ background: '#F8FAFC', padding: '26px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ width: '42px', height: '42px', background: 'rgba(242, 159, 103, 0.15)', color: '#2563EB', borderRadius: '10px', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
                                    <i className="fas fa-edit"></i>
                                </div>
                                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#94a3b8' }}>01</span>
                            </div>
                            <h3 style={{ fontSize: '1.1rem', margin: '0 0 8px 0', border: 'none', padding: 0, color: '#1E1E2C' }}>
                                1. Tester runs the test
                            </h3>
                            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
                                Instrument registered, observations entered per OIML R-76 procedure, mandatory photo proof attached.
                            </p>
                            <div style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FEF08A', padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                                <i className="fas fa-info-circle"></i> Full observation logging with mandatory administrative & photo evidence.
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div style={{ background: '#F8FAFC', padding: '26px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ width: '42px', height: '42px', background: 'rgba(59, 143, 243, 0.15)', color: '#3B8FF3', borderRadius: '10px', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
                                    <i className="fas fa-user-check"></i>
                                </div>
                                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#94a3b8' }}>02</span>
                            </div>
                            <h3 style={{ fontSize: '1.1rem', margin: '0 0 8px 0', border: 'none', padding: 0, color: '#1E1E2C' }}>
                                2. Viewer cross-checks
                            </h3>
                            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
                                Independent review before anything moves forward, with the power to send back with specific comments.
                            </p>
                            <div style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                                <i className="fas fa-eye"></i> No report reaches certification without a second set of eyes.
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div style={{ background: '#F8FAFC', padding: '26px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ width: '42px', height: '42px', background: 'rgba(52, 177, 170, 0.15)', color: '#34B1AA', borderRadius: '10px', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
                                    <i className="fas fa-stamp"></i>
                                </div>
                                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#94a3b8' }}>03</span>
                            </div>
                            <h3 style={{ fontSize: '1.1rem', margin: '0 0 8px 0', border: 'none', padding: 0, color: '#1E1E2C' }}>
                                3. Admin final approval
                            </h3>
                            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
                                Reviews the full chain, applies a SHA-256 seal, and issues the official verification certificate.
                            </p>
                            <div style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                                <i className="fas fa-shield-alt"></i> Multi-level authorization chain ensures tamper-evident final signoff.
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div style={{ background: '#F8FAFC', padding: '26px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ width: '42px', height: '42px', background: 'rgba(224, 181, 15, 0.15)', color: '#E0B50F', borderRadius: '10px', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
                                    <i className="fas fa-qrcode"></i>
                                </div>
                                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#94a3b8' }}>04</span>
                            </div>
                            <h3 style={{ fontSize: '1.1rem', margin: '0 0 8px 0', border: 'none', padding: 0, color: '#1E1E2C' }}>
                                4. Anyone can verify
                            </h3>
                            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
                                QR code on every certificate links to a public page confirming the hash hasn't been tampered with.
                            </p>
                            <div style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                                <i className="fas fa-check-circle"></i> Public hash verification guarantees document authenticity anywhere.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. WHY WE'RE DIFFERENT COMPARISON SECTION */}
            <section style={{ padding: '64px 32px', maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '44px' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '8px', border: 'none', padding: 0 }}>Why We're Different</h2>
                    <p style={{ color: '#64748b', fontSize: '0.98rem' }}>How our compliance-grade process compares to basic digital tools.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                    {/* Column 1: Typical Tools */}
                    <div style={{ background: 'white', border: '1px solid #E4E7ED', borderRadius: '14px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '14px', borderBottom: '2px solid #F1F5F9' }}>
                            <i className="fas fa-times-circle" style={{ color: '#E74C3C', fontSize: '20px' }}></i>
                            <h3 style={{ margin: 0, border: 'none', padding: 0, color: '#64748b', fontSize: '1.1rem' }}>Typical Digital NAWI Tools</h3>
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                "Shows PASS/FAIL with no explanation",
                                "Single-step submission → instant certificate",
                                "No record of what changed before approval",
                                "Static rule logic",
                                "Certificate is just a plain PDF"
                            ].map((text, idx) => (
                                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
                                    <i className="fas fa-minus-circle" style={{ color: '#CBD5E1', marginTop: '3px' }}></i>
                                    <span>{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 2: This System */}
                    <div style={{ background: 'white', border: '2px solid #2563EB', borderRadius: '14px', padding: '28px', boxShadow: '0 8px 24px rgba(242, 159, 103, 0.12)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '14px', borderBottom: '2px solid #FEF0E6' }}>
                            <i className="fas fa-check-circle" style={{ color: '#34B1AA', fontSize: '20px' }}></i>
                            <h3 style={{ margin: 0, border: 'none', padding: 0, color: '#1E1E2C', fontSize: '1.1rem' }}>This System (Schrödinger’s Incident)</h3>
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                "Every result cites the exact OIML R-76 clause and shows the calculated margin",
                                "Independent maker-checker-approver review chain before certification",
                                "Full revision history — every rejection, comment, and resubmission is logged",
                                "Versioned rule engine — old certificates stay valid under the rules they were issued under, even after OIML updates the standard",
                                "Certificate carries a visible SHA-256 seal + public hash-verification page"
                            ].map((text, idx) => (
                                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '0.92rem', color: '#1E1E2C', fontWeight: 500, lineHeight: 1.5 }}>
                                    <i className="fas fa-check" style={{ color: '#34B1AA', marginTop: '3px' }}></i>
                                    <span>{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* 4. BUILT ON THE STANDARD TRUST SECTION */}
            <section style={{ background: 'white', padding: '54px 32px', borderTop: '1px solid #E4E7ED' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.6rem', marginBottom: '14px', border: 'none', padding: 0 }}>Built Directly on Standards</h2>
                    <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
                        This system is engineered directly against OIML R-76-1 (metrological and technical requirements / test procedures) and OIML R-76-2 (standardized test report format), operating in accordance with India's Legal Metrology Act 2009.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '24px' }}>
                        <span style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '6px 14px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                            OIML R-76-1:2006 (E)
                        </span>
                        <span style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '6px 14px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                            OIML R-76-2:2007 (E)
                        </span>
                        <span style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '6px 14px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                            Legal Metrology Act 2009
                        </span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                        Scope: For Type Evaluation / Model Approval testing at designated legal metrology laboratories.
                    </p>
                </div>
            </section>

            {/* 5. FOOTER */}
            <footer style={{ marginTop: 'auto', background: '#1E1E2C', color: '#94a3b8', padding: '32px 32px', textAlign: 'center', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px' }}>
                    <Link to="/login" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>Login</Link>
                    <a href="#how-it-works" style={{ color: '#cbd5e1', textDecoration: 'none' }}>How It Works</a>
                    <a href="#why-different" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Why We're Different</a>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Prototype built for Smart India Hackathon 2026 — Schrödinger’s Incident — not an official government system.
                </p>
            </footer>
        </div>
    );
}
