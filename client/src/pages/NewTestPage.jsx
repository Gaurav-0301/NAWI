import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function NewTestPage() {
    const navigate = useNavigate();

    const [activeRule, setActiveRule] = useState("OIML R-76 V1");
    const [activeRuleRules, setActiveRuleRules] = useState(null);

    const [formData, setFormData] = useState({
        instrument_type: "platform",
        Class_value: "class III",
        capacity: "1000",
        max_unit: "kg",
        min_capacity: "20",
        min_unit: "g",
        e_value: "10",
        e_unit: "g",
        manufacturer: "Mettler Toledo",
        model: "IND570",
        serial_no: "SN-987654321",
        lab_name: "National Metrology & Verification Lab",
        lab_location: "New Delhi, Delhi",
        temperature: "20",
        humidity: "50",
        voltage: "220"
    });

    const [files, setFiles] = useState({
        photo_front: null,
        photo_nameplate: null,
        photo_rear_side: null,
        doc_tech_spec: null,
        doc_operating_manual: null,
        doc_drawing: null
    });

    useEffect(() => {
        fetch('/api/rules/active')
            .then(res => res.json())
            .then(data => {
                if (data && data.version_name) {
                    setActiveRule(data.version_name);
                    setActiveRuleRules(data.rules);
                }
            })
            .catch(err => console.error("Failed to fetch active rule set:", err));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, field) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [field]: e.target.files[0] }));
        }
    };

    const readFileAsBase64 = (file) => {
        if (!file) return Promise.resolve("");
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const maxKg = Number(formData.capacity);
        const eG = Number(formData.e_value);

        if (!maxKg || !eG) {
            alert("Please fill in Max Capacity and Verification Interval (e).");
            return;
        }

        const minG = Number(formData.min_capacity) > 0 ? Number(formData.min_capacity) : (20 * eG);

        const photoFrontBase64 = await readFileAsBase64(files.photo_front);
        const photoNameplateBase64 = await readFileAsBase64(files.photo_nameplate);
        const photoRearSideBase64 = await readFileAsBase64(files.photo_rear_side);

        const adminEvidence = {
            photos: {
                front: photoFrontBase64,
                nameplate: photoNameplateBase64,
                rear_side: photoRearSideBase64
            },
            docs: {
                spec: files.doc_tech_spec ? files.doc_tech_spec.name : "",
                manual: files.doc_operating_manual ? files.doc_operating_manual.name : "",
                drawing: files.doc_drawing ? files.doc_drawing.name : ""
            }
        };

        const labDetails = {
            name: formData.lab_name,
            location: formData.lab_location,
            temperature: formData.temperature,
            humidity: formData.humidity,
            voltage: formData.voltage
        };

        localStorage.setItem("InstrumentData", JSON.stringify(formData));
        localStorage.setItem("LabDetails", JSON.stringify(labDetails));
        localStorage.setItem("AdministrativeEvidence", JSON.stringify(adminEvidence));
        localStorage.setItem("InstrumentPhoto", photoFrontBase64 || photoNameplateBase64 || photoRearSideBase64 || "");
        localStorage.setItem("RuleSetVersion", activeRule);
        if (activeRuleRules) {
            localStorage.setItem("RuleSetRules", JSON.stringify(activeRuleRules));
        }

        localStorage.setItem("Capacity", maxKg);
        localStorage.setItem("eValue", eG);
        localStorage.setItem("ClassValue", formData.Class_value);
        localStorage.setItem("minCapacity", minG);

        let isMobile = false;
        let hasMultiPosition = true;

        if (formData.instrument_type === "crane") {
            hasMultiPosition = false;
        } else if (formData.instrument_type === "mobile") {
            isMobile = true;
        }

        localStorage.setItem("isMobile", isMobile ? "true" : "false");
        localStorage.setItem("hasTare", "true");
        localStorage.setItem("hasMultiPosition", hasMultiPosition ? "true" : "false");
        localStorage.setItem("instrumentType", formData.instrument_type);

        // Clear previous session data
        [
            "confirmedTestPlan", "testPlan", "testPoints_g",
            "form0", "form0_results", "form1", "form1_results",
            "form2", "form2_results", "form3", "form3_results",
            "form_zero", "form_zero_results", "form_tare", "form_tare_results",
            "form_tilt", "form_tilt_results",
            "evidence_1", "evidence_2", "evidence_3", "evidence_4", "evidence_5", "evidence_6", "evidence_8"
        ].forEach(k => localStorage.removeItem(k));

        navigate('/test-plan');
    };

    return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <Header title="Automatic Test Planner Setup" />
                <div className="app-content">
                    <div style={{ marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '1.6rem', margin: '0 0 6px 0' }}>Automatic Test Planner</h2>
                        <p style={{ color: '#64748b' }}>Generate a standards-driven test plan from your instrument specifications.</p>

                        <div style={{ marginTop: '14px', padding: '12px 18px', background: '#f0fdfa', border: '1.5px solid #F29F67', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ background: '#F29F67', color: '#1E1E2C', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '12px' }}>
                                        <i className="fas fa-check-circle"></i> ACTIVE RULE SET
                                    </span>
                                    <span style={{ fontWeight: '700', color: '#1E1E2C', fontSize: '0.95rem' }}>
                                        {activeRule}
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: '#0f766e', fontWeight: '500' }}>
                                    Governing MPE, Repeatability, Tare & Eccentricity for this test
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="form-card">
                        <form onSubmit={handleSubmit}>
                            <h3 style={{ marginTop: 0, paddingBottom: '10px', borderBottom: '1px solid #E4E7ED', color: '#F29F67' }}>
                                1. Instrument Specifications
                            </h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginTop: '20px' }}>
                                <div className="form-group">
                                    <label>Instrument Type</label>
                                    <select name="instrument_type" className="form-input" value={formData.instrument_type} onChange={handleChange} required>
                                        <option value="platform">Platform Scale</option>
                                        <option value="analytical">Analytical Balance</option>
                                        <option value="crane">Crane / Hanging Scale</option>
                                        <option value="mobile">Mobile / Portable Scale</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Accuracy Class</label>
                                    <select name="Class_value" className="form-input" value={formData.Class_value} onChange={handleChange} required>
                                        <option value="class I">Class I (Special Accuracy)</option>
                                        <option value="class II">Class II (High Accuracy)</option>
                                        <option value="class III">Class III (Medium Accuracy)</option>
                                        <option value="class IIII">Class IIII (Ordinary Accuracy)</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Max Capacity</label>
                                    <div className="form-input-group">
                                        <input type="number" step="any" name="capacity" value={formData.capacity} onChange={handleChange} required />
                                        <select name="max_unit" value={formData.max_unit} onChange={handleChange}>
                                            <option value="kg">kg</option>
                                            <option value="g">g</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Min Capacity</label>
                                    <div className="form-input-group">
                                        <input type="number" step="any" name="min_capacity" value={formData.min_capacity} onChange={handleChange} />
                                        <select name="min_unit" value={formData.min_unit} onChange={handleChange}>
                                            <option value="g">g</option>
                                            <option value="kg">kg</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Verification Scale (e)</label>
                                    <div className="form-input-group">
                                        <input type="number" step="any" name="e_value" value={formData.e_value} onChange={handleChange} required />
                                        <select name="e_unit" value={formData.e_unit} onChange={handleChange}>
                                            <option value="g">g</option>
                                            <option value="mg">mg</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Machine Make</label>
                                    <input type="text" name="manufacturer" className="form-input" value={formData.manufacturer} onChange={handleChange} required />
                                </div>

                                <div className="form-group">
                                    <label>Model Name</label>
                                    <input type="text" name="model" className="form-input" value={formData.model} onChange={handleChange} required />
                                </div>

                                <div className="form-group">
                                    <label>Serial No.</label>
                                    <input type="text" name="serial_no" className="form-input" value={formData.serial_no} onChange={handleChange} required />
                                </div>
                            </div>

                            {/* OIML R-76 Administrative Evidence */}
                            <div style={{ marginTop: '25px', padding: '18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                                <h4 style={{ margin: '0 0 6px 0', color: '#1E1E2C', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-folder-open" style={{ color: '#F29F67' }}></i> Instrument & Administrative Evidence
                                </h4>
                                <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#64748b' }}>
                                    Supporting Evidence — Attach relevant photographs and documents for the instrument.
                                </p>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#334155', marginBottom: '8px', display: 'block' }}>
                                        <i className="fas fa-camera" style={{ color: '#F29F67' }}></i> Instrument Photographs
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                        <div>
                                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Front View</span>
                                            <input type="file" accept="image/*" className="form-input" style={{ padding: '6px' }} onChange={(e) => handleFileChange(e, 'photo_front')} />
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Nameplate / Markings</span>
                                            <input type="file" accept="image/*" className="form-input" style={{ padding: '6px' }} onChange={(e) => handleFileChange(e, 'photo_nameplate')} />
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Rear / Side View</span>
                                            <input type="file" accept="image/*" className="form-input" style={{ padding: '6px' }} onChange={(e) => handleFileChange(e, 'photo_rear_side')} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#334155', marginBottom: '8px', display: 'block' }}>
                                        <i className="fas fa-file-pdf" style={{ color: '#F29F67' }}></i> Supporting Documents
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                        <div>
                                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Technical Spec</span>
                                            <input type="file" accept=".pdf,.doc,.docx" className="form-input" style={{ padding: '6px' }} onChange={(e) => handleFileChange(e, 'doc_tech_spec')} />
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Operating Manual</span>
                                            <input type="file" accept=".pdf,.doc,.docx" className="form-input" style={{ padding: '6px' }} onChange={(e) => handleFileChange(e, 'doc_operating_manual')} />
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Drawing</span>
                                            <input type="file" accept=".pdf,.doc,.docx,image/*" className="form-input" style={{ padding: '6px' }} onChange={(e) => handleFileChange(e, 'doc_drawing')} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h3 style={{ marginTop: '30px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#F29F67' }}>
                                2. Laboratory Details
                            </h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '18px' }}>
                                <div className="form-group">
                                    <label>Laboratory Name</label>
                                    <input type="text" name="lab_name" className="form-input" value={formData.lab_name} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Location / State</label>
                                    <input type="text" name="lab_location" className="form-input" value={formData.lab_location} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Testing Environment</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="number" name="temperature" placeholder="°C" className="form-input" value={formData.temperature} onChange={handleChange} required />
                                        <input type="number" name="humidity" placeholder="%" className="form-input" value={formData.humidity} onChange={handleChange} required />
                                        <input type="number" name="voltage" placeholder="V" className="form-input" value={formData.voltage} onChange={handleChange} required />
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '30px', textAlign: 'right' }}>
                                <button type="submit" className="btn" style={{ padding: '12px 32px' }}>
                                    Continue to Test Planner &rarr;
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
