import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { getMPE } from '../utils/r76engine';

export default function TestExecutionPage() {
    const navigate = useNavigate();
    const { authFetch } = useAuth();

    const [testsToRun, setTestsToRun] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [saving, setSaving] = useState(false);

    // Instrument parameters
    const maxKg = Number(localStorage.getItem("Capacity")) || 1000;
    const eG = Number(localStorage.getItem("eValue")) || 10;
    const cls = localStorage.getItem("ClassValue") || "class III";

    // Test form states
    const [form0, setForm0] = useState({
        marking: true, construction: true, display: true, keyboard: true, sealing: true, levelling: true
    });

    const [weighingReadings, setWeighingReadings] = useState({});
    const [repeatabilityReadings, setRepeatabilityReadings] = useState({});
    const [eccentricityReadings, setEccentricityReadings] = useState({
        front: '', right: '', rear: '', left: '', center: ''
    });
    const [zeroReading, setZeroReading] = useState({ indication: '0.000' });
    const [tareReading, setTareReading] = useState({ tare_load: '10.0', net_indication: '10.000' });
    const [tiltReading, setTiltReading] = useState({ ref: '10.000', tilt_x: '10.000', tilt_y: '10.000' });

    // Evidence Register
    const [evidenceList, setEvidenceList] = useState([]);

    useEffect(() => {
        const rawPlan = localStorage.getItem("confirmedTestPlan") || localStorage.getItem("testPlan");
        if (!rawPlan) {
            navigate('/test-plan');
            return;
        }

        const fullPlan = JSON.parse(rawPlan);
        const req = fullPlan.filter(t => t.status === "REQUIRED");
        if (req.length === 0) {
            navigate('/test-plan');
            return;
        }
        setTestsToRun(req);

        // Pre-fill weighing test points
        const test2 = req.find(t => t.id === 2);
        if (test2 && test2.testPoints) {
            const initial = {};
            test2.testPoints.filter(p => p > 0).forEach(p => {
                const loadKg = p / 1000;
                initial[p] = {
                    asc: loadKg.toString(),
                    desc: loadKg.toString()
                };
            });
            setWeighingReadings(initial);
        }

        // Pre-fill repeatability
        const test3 = req.find(t => t.id === 3);
        if (test3) {
            const loadKg = (test3.load / 1000).toString();
            const initRep = {};
            for (let i = 1; i <= test3.readings; i++) {
                initRep[`Value_${i}`] = loadKg;
            }
            setRepeatabilityReadings(initRep);
        }

        // Pre-fill eccentricity load
        const test4 = req.find(t => t.id === 4);
        if (test4) {
            const eccKg = (test4.load / 1000).toString();
            setEccentricityReadings({
                front: eccKg, right: eccKg, rear: eccKg, left: eccKg, center: eccKg
            });
        }
    }, [navigate]);

    if (testsToRun.length === 0) return null;

    const currentTest = testsToRun[currentIdx];
    const isLastTest = currentIdx === testsToRun.length - 1;

    const calculateWeighingResults = () => {
        const results = {};
        let activeRules = {};
        try { activeRules = JSON.parse(localStorage.getItem("RuleSetRules") || "{}"); } catch(e){}

        for (let loadG in weighingReadings) {
            const loadGNum = Number(loadG);
            const loadKg = loadGNum / 1000;
            const item = weighingReadings[loadG];

            const ascReading = Number(item.asc || loadKg);
            const descReading = Number(item.desc || loadKg);

            const ascErrorKg = ascReading - loadKg;
            const descErrorKg = descReading - loadKg;

            const mpeG = getMPE(loadGNum, eG, cls, activeRules);
            const limitKg = mpeG / 1000;

            const ascPass = Math.abs(ascErrorKg) <= limitKg;
            const descPass = Math.abs(descErrorKg) <= limitKg;
            const overallPass = ascPass && descPass;

            results[loadG] = {
                load_g: loadKg,
                asc_reading: ascReading,
                desc_reading: descReading,
                asc_error: Number(ascErrorKg.toFixed(4)),
                desc_error: Number(descErrorKg.toFixed(4)),
                asc_status: ascPass ? "PASS" : "FAIL",
                desc_status: descPass ? "PASS" : "FAIL",
                limit: Number(limitKg.toFixed(4)),
                result: overallPass ? "PASS" : "FAIL"
            };
        }
        return results;
    };

    const calculateRepeatabilityResults = () => {
        let activeRules = {};
        try { activeRules = JSON.parse(localStorage.getItem("RuleSetRules") || "{}"); } catch(e){}
        const test3 = testsToRun.find(t => t.id === 3);
        const testLoadKg = test3 ? (test3.load / 1000) : (maxKg / 2);

        const vals = Object.values(repeatabilityReadings).map(Number).filter(v => !isNaN(v));
        if (vals.length === 0) return {};

        const maxVal = Math.max(...vals);
        const minVal = Math.min(...vals);
        const rangeKg = maxVal - minVal;

        const repMaxDiffE = (activeRules?.repeatability?.max_diff_e) ? activeRules.repeatability.max_diff_e : 1.0;
        const limitKg = (repMaxDiffE * eG) / 1000;

        const isPass = rangeKg <= limitKg;

        return {
            testLoad: testLoadKg,
            max: maxVal,
            min: minVal,
            range: Number(rangeKg.toFixed(4)),
            limit: Number(limitKg.toFixed(4)),
            Repeatability: isPass ? "PASS" : "FAIL"
        };
    };

    const calculateEccentricityResults = () => {
        let activeRules = {};
        try { activeRules = JSON.parse(localStorage.getItem("RuleSetRules") || "{}"); } catch(e){}
        const test4 = testsToRun.find(t => t.id === 4);
        const eccLoadG = test4 ? test4.load : (maxKg * 1000 * 0.33);
        const eccLoadKg = eccLoadG / 1000;
        const mpeG = getMPE(eccLoadG, eG, cls, activeRules);
        const limitKg = mpeG / 1000;

        const details = {};
        let overallPass = true;

        for (let pos in eccentricityReadings) {
            const ind = Number(eccentricityReadings[pos] || eccLoadKg);
            const err = ind - eccLoadKg;
            const pass = Math.abs(err) <= limitKg;
            if (!pass) overallPass = false;

            details[pos] = {
                appliedLoad: eccLoadKg,
                indication: ind,
                error: Number(err.toFixed(4)),
                limit: Number(limitKg.toFixed(4)),
                result: pass ? "PASS" : "FAIL"
            };
        }

        return {
            details,
            Eccentricity: overallPass ? "PASS" : "FAIL"
        };
    };

    const calculateZeroResults = () => {
        const ind = Number(zeroReading.indication || 0);
        const errG = ind * 1000;
        const limitG = 0.25 * eG;
        const pass = Math.abs(errG) <= limitG;

        return {
            zero_indication: ind,
            error_g: Number(errG.toFixed(2)),
            limit_g: Number(limitG.toFixed(2)),
            ZeroSetting: pass ? "PASS" : "FAIL"
        };
    };

    const calculateTareResults = () => {
        const tareLoad = Number(tareReading.tare_load || 10);
        const netInd = Number(tareReading.net_indication || 10);
        const errG = (netInd - tareLoad) * 1000;
        const mpeG = getMPE(tareLoad * 1000, eG, cls);
        const pass = Math.abs(errG) <= mpeG;

        return {
            tare_load: tareLoad,
            tare_error_g: Number(errG.toFixed(2)),
            limit_g: Number(mpeG.toFixed(2)),
            TareAccuracy: pass ? "PASS" : "FAIL"
        };
    };

    const calculateTiltResults = () => {
        const ref = Number(tiltReading.ref || 10);
        const x = Number(tiltReading.tilt_x || 10);
        const y = Number(tiltReading.tilt_y || 10);

        const xErrG = Math.abs(x - ref) * 1000;
        const yErrG = Math.abs(y - ref) * 1000;
        const limitG = 1.0 * eG;

        const pass = xErrG <= limitG && yErrG <= limitG;

        return {
            tilt_ref: ref,
            x_error_g: Number(xErrG.toFixed(2)),
            y_error_g: Number(yErrG.toFixed(2)),
            limit_g: Number(limitG.toFixed(2)),
            TiltTest: pass ? "PASS" : "FAIL"
        };
    };

    const handleSaveReport = async () => {
        setSaving(true);
        try {
            const instData = JSON.parse(localStorage.getItem("InstrumentData") || "{}");
            const labDetails = JSON.parse(localStorage.getItem("LabDetails") || "{}");
            const adminEvidence = JSON.parse(localStorage.getItem("AdministrativeEvidence") || "{}");
            const photo = localStorage.getItem("InstrumentPhoto") || "";
            const ruleVer = localStorage.getItem("RuleSetVersion") || "OIML R-76 V1";
            const fullPlan = JSON.parse(localStorage.getItem("confirmedTestPlan") || localStorage.getItem("testPlan") || "[]");

            const f0Res = { visual: true };
            const f1Res = calculateWeighingResults();
            const f2Res = calculateRepeatabilityResults();
            const f3Res = calculateEccentricityResults();
            const fZeroRes = calculateZeroResults();
            const fTareRes = calculateTareResults();
            const fTiltRes = calculateTiltResults();

            const body = {
                instrument: instData,
                testPlan: fullPlan,
                form0,
                form0_results: f0Res,
                form1: weighingReadings,
                form1_results: f1Res,
                form2: repeatabilityReadings,
                form2_results: f2Res,
                form3: eccentricityReadings,
                form3_results: f3Res,
                form_zero: zeroReading,
                form_zero_results: fZeroRes,
                form_tare: tareReading,
                form_tare_results: fTareRes,
                form_tilt: tiltReading,
                form_tilt_results: fTiltRes,
                lab_details: labDetails,
                instrument_photo: photo,
                administrative_evidence: adminEvidence,
                evidence_register: evidenceList,
                rule_set_version: ruleVer
            };

            const res = await authFetch('/api/save-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Save failed");

            localStorage.removeItem("InstrumentData");
            localStorage.removeItem("confirmedTestPlan");

            navigate(`/report/${data.id}`);
        } catch (err) {
            alert("Failed to save report: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <Header title={`Guided Test Execution — ${currentTest.name}`} />
                <div className="app-content">
                    {/* Progress Bar */}
                    <div className="form-card" style={{ padding: '16px 24px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                            <span>Step {currentIdx + 1} of {testsToRun.length}: {currentTest.name}</span>
                            <span>{Math.round(((currentIdx + 1) / testsToRun.length) * 100)}% Completed</span>
                        </div>
                        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${((currentIdx + 1) / testsToRun.length) * 100}%`, background: '#F29F67', transition: 'width 0.3s' }}></div>
                        </div>
                    </div>

                    {/* Active Test Card */}
                    <div className="form-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                            <div style={{ width: '44px', height: '44px', background: 'rgba(242, 159, 103, 0.15)', color: '#F29F67', borderRadius: '10px', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
                                <i className={currentTest.icon}></i>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, padding: 0, border: 'none', color: '#1E1E2C' }}>
                                    {currentTest.id}. {currentTest.name}
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>{currentTest.note}</p>
                            </div>
                        </div>

                        {/* TEST 1: Visual Inspection */}
                        {currentTest.id === 1 && (
                            <div>
                                <h4 style={{ color: '#F29F67' }}>Checklist Observations</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '16px' }}>
                                    {[
                                        { key: 'marking', label: 'Markings complete, indelible & legible' },
                                        { key: 'construction', label: 'Mechanical construction satisfactory' },
                                        { key: 'display', label: 'Display & indication fully functional' },
                                        { key: 'keyboard', label: 'Switches and keys operational' },
                                        { key: 'sealing', label: 'Sealing & verification marks intact' },
                                        { key: 'levelling', label: 'Instrument stable and levelled' }
                                    ].map(item => (
                                        <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={form0[item.key]}
                                                onChange={e => setForm0(prev => ({ ...prev, [item.key]: e.target.checked }))}
                                                style={{ width: '18px', height: '18px', accentColor: '#F29F67' }}
                                            />
                                            <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>{item.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TEST 2: Weighing Performance */}
                        {currentTest.id === 2 && (
                            <div>
                                <h4 style={{ color: '#F29F67' }}>Ascending & Descending Readings</h4>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Load</th>
                                            <th>Ascending (kg)</th>
                                            <th>Descending (kg)</th>
                                            <th>Error Asc (g)</th>
                                            <th>Error Desc (g)</th>
                                            <th>MPE Limit</th>
                                            <th>Result</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(weighingReadings).map(loadG => {
                                            const res = calculateWeighingResults()[loadG] || {};
                                            const loadKg = Number(loadG) / 1000;
                                            return (
                                                <tr key={loadG}>
                                                    <td><strong>{loadKg >= 1 ? `${loadKg} kg` : `${loadG} g`}</strong></td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            style={{ width: '100px', padding: '6px' }}
                                                            value={weighingReadings[loadG].asc}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                setWeighingReadings(prev => ({
                                                                    ...prev,
                                                                    [loadG]: { ...prev[loadG], asc: val }
                                                                }));
                                                            }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            style={{ width: '100px', padding: '6px' }}
                                                            value={weighingReadings[loadG].desc}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                setWeighingReadings(prev => ({
                                                                    ...prev,
                                                                    [loadG]: { ...prev[loadG], desc: val }
                                                                }));
                                                            }}
                                                        />
                                                    </td>
                                                    <td style={{ fontFamily: 'monospace' }}>{res.asc_error !== undefined ? (res.asc_error * 1000).toFixed(1) : 0} g</td>
                                                    <td style={{ fontFamily: 'monospace' }}>{res.desc_error !== undefined ? (res.desc_error * 1000).toFixed(1) : 0} g</td>
                                                    <td style={{ fontFamily: 'monospace' }}>±{res.limit !== undefined ? (res.limit * 1000).toFixed(1) : 0} g</td>
                                                    <td>
                                                        <span className={`status-badge ${res.result === 'PASS' ? 'status-pass' : 'status-fail'}`}>
                                                            {res.result}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* TEST 3: Repeatability */}
                        {currentTest.id === 3 && (
                            <div>
                                <h4 style={{ color: '#F29F67' }}>Repeatability Test Readings</h4>
                                <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
                                    Test Load: <strong>{(currentTest.load / 1000).toFixed(3)} kg</strong> &bull; Permissible Max Diff: <strong>±{(currentTest.max_diff_e * eG).toFixed(2)} g</strong>
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', margin: '20px 0' }}>
                                    {Object.keys(repeatabilityReadings).map((key, i) => (
                                        <div key={key} className="form-group">
                                            <label>Reading {i + 1} (kg)</label>
                                            <input
                                                type="number"
                                                step="any"
                                                className="form-input"
                                                value={repeatabilityReadings[key]}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setRepeatabilityReadings(prev => ({ ...prev, [key]: val }));
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {(() => {
                                    const repRes = calculateRepeatabilityResults();
                                    return (
                                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                            <div>Max: <strong>{repRes.max} kg</strong></div>
                                            <div>Min: <strong>{repRes.min} kg</strong></div>
                                            <div>Max Diff: <strong>{((repRes.range || 0) * 1000).toFixed(1)} g</strong></div>
                                            <div>MPE Limit: <strong>±{((repRes.limit || 0) * 1000).toFixed(1)} g</strong></div>
                                            <div>Status: <span className={`status-badge ${repRes.Repeatability === 'PASS' ? 'status-pass' : 'status-fail'}`}>{repRes.Repeatability}</span></div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* TEST 4: Eccentricity */}
                        {currentTest.id === 4 && (
                            <div>
                                <h4 style={{ color: '#F29F67' }}>Eccentricity Off-Center Loading</h4>
                                <p style={{ fontSize: '0.88rem', color: '#64748b' }}>Applied Test Load: <strong>{(currentTest.load / 1000).toFixed(3)} kg</strong></p>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', margin: '20px 0' }}>
                                    {['front', 'right', 'rear', 'left', 'center'].map(pos => (
                                        <div key={pos} className="form-group">
                                            <label style={{ textTransform: 'capitalize' }}>{pos} Position (kg)</label>
                                            <input
                                                type="number"
                                                step="any"
                                                className="form-input"
                                                value={eccentricityReadings[pos]}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setEccentricityReadings(prev => ({ ...prev, [pos]: val }));
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TEST 5: Zero Setting */}
                        {currentTest.id === 5 && (
                            <div>
                                <h4 style={{ color: '#F29F67' }}>Zero-Setting / Zero Tracking</h4>
                                <div style={{ maxWidth: '300px', margin: '20px 0' }}>
                                    <div className="form-group">
                                        <label>Zero Indication Reading (kg)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="form-input"
                                            value={zeroReading.indication}
                                            onChange={e => setZeroReading({ indication: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TEST 6: Tare Accuracy */}
                        {currentTest.id === 6 && (
                            <div>
                                <h4 style={{ color: '#F29F67' }}>Tare Accuracy Test</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', margin: '20px 0' }}>
                                    <div className="form-group">
                                        <label>Tare Load Applied (kg)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="form-input"
                                            value={tareReading.tare_load}
                                            onChange={e => setTareReading(prev => ({ ...prev, tare_load: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Net Indication After Tare (kg)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="form-input"
                                            value={tareReading.net_indication}
                                            onChange={e => setTareReading(prev => ({ ...prev, net_indication: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TEST 8: Tilt Test */}
                        {currentTest.id === 8 && (
                            <div>
                                <h4 style={{ color: '#F29F67' }}>Tilt Test Observations</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', margin: '20px 0' }}>
                                    <div className="form-group">
                                        <label>Level Reference (kg)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="form-input"
                                            value={tiltReading.ref}
                                            onChange={e => setTiltReading(prev => ({ ...prev, ref: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>X-Axis Tilt Reading (kg)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="form-input"
                                            value={tiltReading.tilt_x}
                                            onChange={e => setTiltReading(prev => ({ ...prev, tilt_x: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Y-Axis Tilt Reading (kg)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="form-input"
                                            value={tiltReading.tilt_y}
                                            onChange={e => setTiltReading(prev => ({ ...prev, tilt_y: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step Navigation Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                        <button
                            className="btn-secondary"
                            disabled={currentIdx === 0}
                            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                            style={{ opacity: currentIdx === 0 ? 0.5 : 1 }}
                        >
                            &larr; Previous Test
                        </button>

                        {isLastTest ? (
                            <button
                                className="btn"
                                style={{ background: '#34B1AA', padding: '12px 32px' }}
                                disabled={saving}
                                onClick={handleSaveReport}
                            >
                                {saving ? 'Saving Report...' : 'Save & Finish Verification Report'} <i className="fas fa-check"></i>
                            </button>
                        ) : (
                            <button
                                className="btn"
                                onClick={() => setCurrentIdx(prev => Math.min(testsToRun.length - 1, prev + 1))}
                            >
                                Next Test &rarr;
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
