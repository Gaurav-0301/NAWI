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
        capacity: "",
        max_unit: "kg",
        min_capacity: "",
        min_unit: "g",
        e_value: "",
        e_unit: "g",
        manufacturer: "",
        model: "",
        serial_no: "",
        lab_name: "",
        lab_location: "",
        temperature: "",
        humidity: "",
        voltage: ""
    });

    const [files, setFiles] = useState({
        photo_front: null,
        photo_nameplate: null,
        photo_rear_side: null,
        doc_tech_spec: null,
        doc_operating_manual: null,
        doc_drawing: null
    });

    const [previews, setPreviews] = useState({
        photo_front: null,
        photo_nameplate: null,
        photo_rear_side: null
    });

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/rules/active`)
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
            const selectedFile = e.target.files[0];
            setFiles(prev => ({ ...prev, [field]: selectedFile }));

            if (field.startsWith('photo_')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviews(prev => ({ ...prev, [field]: reader.result }));
                };
                reader.readAsDataURL(selectedFile);
            }
        }
    };

    const removePhoto = (field) => {
        setFiles(prev => ({ ...prev, [field]: null }));
        setPreviews(prev => ({ ...prev, [field]: null }));
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

        const {
            capacity, min_capacity, e_value, manufacturer, model, serial_no,
            lab_name, lab_location, temperature, humidity, voltage
        } = formData;

        if (
            !capacity || !min_capacity || !e_value || !manufacturer || !model ||
            !serial_no || !lab_name || !lab_location || !temperature || !humidity || !voltage
        ) {
            alert("Please fill in all required instrument specifications and laboratory conditions before proceeding.");
            return;
        }

        if (!files.photo_front || !files.photo_nameplate || !files.photo_rear_side || !files.doc_tech_spec) {
            alert("Please upload all required Instrument Photographs (Front View, Nameplate, Rear/Side View) and Technical Spec Document.");
            return;
        }

        const maxKg = Number(capacity);
        const eG = Number(e_value);

        if (isNaN(maxKg) || maxKg <= 0 || isNaN(eG) || eG <= 0) {
            alert("Please enter valid positive numbers for Max Capacity and Verification Interval (e).");
            return;
        }

        const minG = Number(min_capacity) > 0 ? Number(min_capacity) : (20 * eG);

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
            },
            temperature: formData.temperature,
            humidity: formData.humidity,
            voltage: formData.voltage,
            lab_name: formData.lab_name,
            lab_location: formData.lab_location
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

                    {/* Page Header */}
                    <div style={{ marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '1.6rem', margin: '0 0 6px 0', fontFamily: 'Outfit, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            AUTOMATIC TEST PLANNER SETUP
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                            Configure instrument parameters & upload required OIML administrative evidence for automated evaluation.
                        </p>

                        <div style={{ marginTop: '14px', padding: '12px 18px', background: '#FEF0E6', border: '1.5px solid #2563EB', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ background: '#086e0dff', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px' }}>
                                        <i className="fas fa-check-circle"></i> ACTIVE GOVERNING RULESET
                                    </span>
                                    <span style={{ fontWeight: 700, color: '#1E1E2C', fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif' }}>
                                        {activeRule}
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: '#000000ff', fontWeight: 600 }}>
                                    OIML R-76-1:2006 (E) Metrological Tolerance Engine
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="form-card">
                        <form onSubmit={handleSubmit}>
                            {/* Section 1: Instrument Specifications */}
                            <h3 style={{ marginTop: 0, paddingBottom: '10px', borderBottom: '1px solid #E4E7ED', color: '#2563EB', fontFamily: 'Outfit, sans-serif', fontSize: '1.15rem' }}>
                                1. Instrument Specifications & Metrological Parameters
                            </h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginTop: '20px' }}>
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
                                    <label>Max Capacity (Max)</label>
                                    <div className="form-input-group">
                                        <input type="number" step="any" name="capacity" placeholder="e.g. 1000" className="form-input" value={formData.capacity} onChange={handleChange} required />
                                        <select name="max_unit" value={formData.max_unit} onChange={handleChange}>
                                            <option value="kg">kg</option>
                                            <option value="g">g</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Min Capacity (Min)</label>
                                    <div className="form-input-group">
                                        <input type="number" step="any" name="min_capacity" placeholder="e.g. 20" className="form-input" value={formData.min_capacity} onChange={handleChange} required />
                                        <select name="min_unit" value={formData.min_unit} onChange={handleChange}>
                                            <option value="g">g</option>
                                            <option value="kg">kg</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Verification Scale Interval (e)</label>
                                    <div className="form-input-group">
                                        <input type="number" step="any" name="e_value" placeholder="e.g. 10" className="form-input" value={formData.e_value} onChange={handleChange} required />
                                        <select name="e_unit" value={formData.e_unit} onChange={handleChange}>
                                            <option value="g">g</option>
                                            <option value="mg">mg</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Machine Make / Manufacturer</label>
                                    <input type="text" name="manufacturer" placeholder="e.g. Mettler Toledo" className="form-input" value={formData.manufacturer} onChange={handleChange} required />
                                </div>

                                <div className="form-group">
                                    <label>Model Name / Series</label>
                                    <input type="text" name="model" placeholder="e.g. IND570" className="form-input" value={formData.model} onChange={handleChange} required />
                                </div>

                                <div className="form-group">
                                    <label>Serial Number (S/N)</label>
                                    <input type="text" name="serial_no" placeholder="e.g. SN-987654321" className="form-input" value={formData.serial_no} onChange={handleChange} required />
                                </div>
                            </div>

                            {/* Section 2: ENHANCED Instrument & Administrative Evidence Uploads */}
                            <div style={{ marginTop: '28px', padding: '22px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: '#1E1E2C', fontSize: '1.05rem', fontFamily: 'Outfit, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <i className="fas fa-camera-retro" style={{ color: '#2563EB' }}></i> Instrument & Administrative Evidence Uploads
                                        </h4>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                                            Attach verified photographs & technical compliance documents required for certification trail.
                                        </p>
                                    </div>
                                    <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                                        <i className="fas fa-shield-alt"></i> OIML R-76 §A.3 Evidence Vault
                                    </span>
                                </div>

                                {/* Photographed Evidence Upload Cards with Instant Live Thumbnails */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'block' }}>
                                        <i className="fas fa-images" style={{ color: '#2563EB', marginRight: '6px' }}></i>
                                        1. Instrument Photographs (Visual Proof)
                                    </label>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                                        
                                        {/* Front View Card */}
                                        <div style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '14px', position: 'relative' }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>Front View Photo <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span></span>
                                                {previews.photo_front ? (
                                                    <span style={{ color: '#10B981', fontSize: '0.75rem' }}><i className="fas fa-check-circle"></i> Uploaded</span>
                                                ) : (
                                                    <span style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 700 }}>Required</span>
                                                )}
                                            </div>

                                            {previews.photo_front ? (
                                                <div style={{ position: 'relative', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                                                    <img src={previews.photo_front} alt="Front View" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <button type="button" onClick={() => removePhoto('photo_front')} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '0.8rem' }}>&times;</button>
                                                </div>
                                            ) : (
                                                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '18px 12px', background: '#FCFBF7', border: '1.5px dashed #CBD5E1', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                    <i className="fas fa-cloud-upload-alt" style={{ fontSize: '1.4rem', color: '#2563EB', marginBottom: '6px' }}></i>
                                                    <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Select Front View Photo</span>
                                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>PNG, JPG or WEBP</span>
                                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'photo_front')} />
                                                </label>
                                            )}
                                        </div>

                                        {/* Nameplate Card */}
                                        <div style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '14px', position: 'relative' }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>Nameplate / Markings <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span></span>
                                                {previews.photo_nameplate ? (
                                                    <span style={{ color: '#10B981', fontSize: '0.75rem' }}><i className="fas fa-check-circle"></i> Uploaded</span>
                                                ) : (
                                                    <span style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 700 }}>Required</span>
                                                )}
                                            </div>

                                            {previews.photo_nameplate ? (
                                                <div style={{ position: 'relative', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                                                    <img src={previews.photo_nameplate} alt="Nameplate" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <button type="button" onClick={() => removePhoto('photo_nameplate')} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '0.8rem' }}>&times;</button>
                                                </div>
                                            ) : (
                                                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '18px 12px', background: '#FCFBF7', border: '1.5px dashed #CBD5E1', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                    <i className="fas fa-id-card" style={{ fontSize: '1.4rem', color: '#2563EB', marginBottom: '6px' }}></i>
                                                    <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Select Nameplate Photo</span>
                                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Shows Max, e, Serial No</span>
                                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'photo_nameplate')} />
                                                </label>
                                            )}
                                        </div>

                                        {/* Rear / Side View Card */}
                                        <div style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '14px', position: 'relative' }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>Rear / Side View <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span></span>
                                                {previews.photo_rear_side ? (
                                                    <span style={{ color: '#10B981', fontSize: '0.75rem' }}><i className="fas fa-check-circle"></i> Uploaded</span>
                                                ) : (
                                                    <span style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 700 }}>Required</span>
                                                )}
                                            </div>

                                            {previews.photo_rear_side ? (
                                                <div style={{ position: 'relative', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                                                    <img src={previews.photo_rear_side} alt="Rear/Side View" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <button type="button" onClick={() => removePhoto('photo_rear_side')} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '0.8rem' }}>&times;</button>
                                                </div>
                                            ) : (
                                                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '18px 12px', background: '#FCFBF7', border: '1.5px dashed #CBD5E1', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                    <i className="fas fa-camera" style={{ fontSize: '1.4rem', color: '#2563EB', marginBottom: '6px' }}></i>
                                                    <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Select Rear/Side Photo</span>
                                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Seals & Connection Ports</span>
                                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'photo_rear_side')} />
                                                </label>
                                            )}
                                        </div>

                                    </div>
                                </div>

                                {/* Supporting Technical Documents Dropzone Cards */}
                                <div>
                                    <label style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'block' }}>
                                        <i className="fas fa-file-contract" style={{ color: '#3B8FF3', marginRight: '6px' }}></i>
                                        2. Supporting Compliance Documents
                                    </label>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                                        
                                        {/* Technical Spec */}
                                        <div style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '14px' }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Technical Specification Sheet <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span></span>
                                            </div>
                                            <label style={{ display: 'block', cursor: 'pointer' }}>
                                                <div style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.8rem', color: files.doc_tech_spec ? '#047857' : '#64748b', fontWeight: 600 }}>
                                                    <i className={files.doc_tech_spec ? "fas fa-file-pdf text-emerald-600" : "fas fa-paperclip"} style={{ marginRight: '6px' }}></i>
                                                    {files.doc_tech_spec ? files.doc_tech_spec.name : "Attach Tech Spec (PDF) *"}
                                                </div>
                                                <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'doc_tech_spec')} />
                                            </label>
                                        </div>

                                        {/* Operating Manual */}
                                        <div style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '14px' }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>Operating & Instruction Manual</div>
                                            <label style={{ display: 'block', cursor: 'pointer' }}>
                                                <div style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.8rem', color: files.doc_operating_manual ? '#047857' : '#64748b', fontWeight: 600 }}>
                                                    <i className={files.doc_operating_manual ? "fas fa-file-pdf text-emerald-600" : "fas fa-paperclip"} style={{ marginRight: '6px' }}></i>
                                                    {files.doc_operating_manual ? files.doc_operating_manual.name : "Attach Manual (PDF)"}
                                                </div>
                                                <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'doc_operating_manual')} />
                                            </label>
                                        </div>

                                        {/* Drawing */}
                                        <div style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '14px' }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>Dimensional Drawing / Schematic</div>
                                            <label style={{ display: 'block', cursor: 'pointer' }}>
                                                <div style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.8rem', color: files.doc_drawing ? '#047857' : '#64748b', fontWeight: 600 }}>
                                                    <i className={files.doc_drawing ? "fas fa-file-pdf text-emerald-600" : "fas fa-paperclip"} style={{ marginRight: '6px' }}></i>
                                                    {files.doc_drawing ? files.doc_drawing.name : "Attach Drawing / Schematic"}
                                                </div>
                                                <input type="file" accept=".pdf,.doc,.docx,image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'doc_drawing')} />
                                            </label>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Laboratory & Environmental Details */}
                            <h3 style={{ marginTop: '30px', marginBottom: '16px', borderBottom: '1px solid #E4E7ED', paddingBottom: '10px', color: '#2563EB', fontFamily: 'Outfit, sans-serif', fontSize: '1.15rem' }}>
                                3. Laboratory & Environmental Test Conditions
                            </h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '18px' }}>
                                <div className="form-group">
                                    <label>Testing Laboratory Name</label>
                                    <input type="text" name="lab_name" placeholder="e.g. National Metrology Lab" className="form-input" value={formData.lab_name} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Laboratory Location / State</label>
                                    <input type="text" name="lab_location" placeholder="e.g. New Delhi, Delhi" className="form-input" value={formData.lab_location} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Testing Ambient Conditions</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="number" name="temperature" placeholder="Temp (°C)" className="form-input" value={formData.temperature} onChange={handleChange} required />
                                        <input type="number" name="humidity" placeholder="Humidity (%)" className="form-input" value={formData.humidity} onChange={handleChange} required />
                                        <input type="number" name="voltage" placeholder="Supply (V)" className="form-input" value={formData.voltage} onChange={handleChange} required />
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '32px', textAlign: 'right' }}>
                                <button type="submit" className="btn" style={{ padding: '12px 32px', fontSize: '0.95rem' }}>
                                    Generate Test Plan &rarr;
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
