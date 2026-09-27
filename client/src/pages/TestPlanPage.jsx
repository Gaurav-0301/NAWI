import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { generateTestPlan } from '../utils/r76engine';

export default function TestPlanPage() {
    const navigate = useNavigate();

    const [testPlan, setTestPlan] = useState([]);
    const [instrument, setInstrument] = useState({});
    const [ruleSetVersion, setRuleSetVersion] = useState("OIML R-76 V1");
    const [selectedModalTest, setSelectedModalTest] = useState(null);

    useEffect(() => {
        const rawInst = localStorage.getItem("InstrumentData");
        if (!rawInst) {
            navigate('/new-test');
            return;
        }

        const instData = JSON.parse(rawInst);
        setInstrument(instData);

        const version = localStorage.getItem("RuleSetVersion") || "OIML R-76 V1";
        setRuleSetVersion(version);

        let activeRules = {};
        try {
            activeRules = JSON.parse(localStorage.getItem("RuleSetRules") || "{}");
        } catch (e) {}

        const maxKg = Number(localStorage.getItem("Capacity")) || Number(instData.capacity) || 1000;
        const eG = Number(localStorage.getItem("eValue")) || Number(instData.e_value) || 10;
        const cls = localStorage.getItem("ClassValue") || instData.Class_value || "class III";
        const minG = Number(localStorage.getItem("minCapacity")) || (20 * eG);

        const isMobile = localStorage.getItem("isMobile") === "true";
        const hasTare = localStorage.getItem("hasTare") !== "false";
        const hasMultiPosition = localStorage.getItem("hasMultiPosition") !== "false";

        const plan = generateTestPlan({
            max_g: maxKg * 1000,
            min_g: minG,
            e_g: eG,
            cls,
            isMobile,
            hasTare,
            hasMultiPosition
        }, activeRules);

        setTestPlan(plan);
        localStorage.setItem("testPlan", JSON.stringify(plan));
        if (plan[1] && plan[1].testPoints) {
            localStorage.setItem("testPoints_g", JSON.stringify(plan[1].testPoints));
        }
    }, [navigate]);

    const requiredCount = testPlan.filter(t => t.status === "REQUIRED").length;
    const optionalCount = testPlan.filter(t => t.status === "IF_APPLICABLE").length;
    const loadPointsCount = (testPlan[1] && testPlan[1].testPoints) ? testPlan[1].testPoints.length : 0;

    const handleConfirm = () => {
        localStorage.setItem("confirmedTestPlan", JSON.stringify(testPlan));
        navigate('/tests');
    };

    return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <Header title="Dynamic Test Planner" />
                <div className="app-content">
                    {/* Summary Card */}
                    <div className="form-card" style={{ background: 'linear-gradient(135deg, #1E1E2C 0%, #0F172A 100%)', color: 'white', border: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h2 style={{ color: '#2563EB', margin: 0, padding: 0, border: 'none' }}>AUTOMATIC TEST PLAN</h2>
                            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                                TP-NEW
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 16px 0' }}>
                            <span style={{ background: 'rgba(242, 159, 103, 0.15)', color: '#2563EB', border: '1px solid rgba(242, 159, 103, 0.3)', padding: '4px 12px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700 }}>
                                <i className="fas fa-book"></i> Active Rule Set: {ruleSetVersion}
                            </span>
                        </div>

                        <div style={{ fontSize: '1rem', color: '#cbd5e1', marginBottom: '16px' }}>
                            <strong>{instrument.manufacturer} {instrument.model}</strong> &bull; Serial: {instrument.serial_no} &bull; Class: {instrument.Class_value} &bull; Max: {instrument.capacity} kg (e = {instrument.e_value} g)
                        </div>

                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', fontSize: '0.85rem' }}>
                            <span style={{ color: '#2563EB', fontWeight: 700 }}>{requiredCount} Required</span>
                            <span style={{ color: '#E0B50F', fontWeight: 700 }}>{optionalCount} Optional</span>
                            <span style={{ color: '#38bdf8', fontWeight: 700 }}>{loadPointsCount} Load Points</span>
                            <span style={{ color: '#94a3b8' }}>Est. ~15 min</span>
                        </div>
                    </div>

                    {/* Test List */}
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1E1E2C' }}>TEST PLAN GENERATED</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {testPlan.map((t) => (
                                <div key={t.id} className="form-card" style={{ margin: 0, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '40px', height: '40px', background: t.status === 'REQUIRED' ? 'rgba(242, 159, 103, 0.15)' : '#f1f5f9', color: t.status === 'REQUIRED' ? '#2563EB' : '#94a3b8', borderRadius: '10px', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
                                            <i className={t.icon}></i>
                                        </div>
                                        <div>
                                            <h4 style={{ margin: '0 0 4px 0', border: 'none', padding: 0, fontSize: '1rem' }}>
                                                {t.id}. {t.name}
                                            </h4>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{t.note}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span className={`status-badge ${t.status === 'REQUIRED' ? 'status-pass' : t.status === 'IF_APPLICABLE' ? 'status-pending' : 'status-fail'}`} style={{
                                            background: t.status === 'REQUIRED' ? '#f0fdf4' : t.status === 'IF_APPLICABLE' ? '#fffbe6' : '#f8fafc',
                                            color: t.status === 'REQUIRED' ? '#166534' : t.status === 'IF_APPLICABLE' ? '#b45309' : '#94a3b8',
                                            borderColor: t.status === 'REQUIRED' ? '#bbf7d0' : t.status === 'IF_APPLICABLE' ? '#fef08a' : '#cbd5e1'
                                        }}>
                                            {t.status}
                                        </span>
                                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setSelectedModalTest(t)}>
                                            <i className="fas fa-info-circle"></i> Info
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '16px 24px', borderRadius: '12px', border: '1px solid #E4E7ED' }}>
                        <div style={{ color: '#0f766e', fontSize: '0.9rem', fontWeight: 600 }}>
                            <i className="fas fa-info-circle"></i> {requiredCount} required tests will be executed
                        </div>
                        <button className="btn" style={{ padding: '12px 28px', background: '#3B8FF3' }} onClick={handleConfirm}>
                            Confirm Plan & Start <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>

                    {/* Modal */}
                    {selectedModalTest && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedModalTest(null)}>
                            <div style={{ background: 'white', borderRadius: '12px', padding: '28px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ margin: 0, border: 'none', color: '#1E1E2C' }}>{selectedModalTest.name} Details</h3>
                                    <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setSelectedModalTest(null)}>&times;</button>
                                </div>
                                <p style={{ color: '#475569', fontSize: '0.92rem', marginBottom: '16px' }}>{selectedModalTest.note}</p>
                                
                                {selectedModalTest.testPoints && (
                                    <div>
                                        <strong style={{ fontSize: '0.85rem', color: '#334155' }}>Generated Load Test Points (grams):</strong>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                                            {selectedModalTest.testPoints.map((p, idx) => (
                                                <span key={idx} style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                                    {p >= 1000 ? `${p/1000} kg` : `${p} g`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
