const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
    instrument_id:           String,
    instrument_data:         mongoose.Schema.Types.Mixed,
    test_plan:               mongoose.Schema.Types.Mixed,   // Generated R-76 test plan
    form0_data:              mongoose.Schema.Types.Mixed,   // Visual inspection checklist
    form0_results:           mongoose.Schema.Types.Mixed,
    form1_data:              mongoose.Schema.Types.Mixed,   // Weighing performance readings
    form1_results:           mongoose.Schema.Types.Mixed,
    form2_data:              mongoose.Schema.Types.Mixed,   // Repeatability readings
    form2_results:           mongoose.Schema.Types.Mixed,
    form3_data:              mongoose.Schema.Types.Mixed,   // Eccentricity readings
    form3_results:           mongoose.Schema.Types.Mixed,
    form_zero_data:          mongoose.Schema.Types.Mixed,   // Zero-setting readings
    form_zero_results:       mongoose.Schema.Types.Mixed,
    form_tare_data:          mongoose.Schema.Types.Mixed,   // Tare accuracy readings
    form_tare_results:       mongoose.Schema.Types.Mixed,
    form_tilt_data:          mongoose.Schema.Types.Mixed,   // Tilt test readings
    form_tilt_results:       mongoose.Schema.Types.Mixed,
    
    // Administrative & Integrity Fields
    lab_details:             mongoose.Schema.Types.Mixed,
    instrument_photo:        String, // base64 (legacy fallback)
    administrative_evidence: mongoose.Schema.Types.Mixed,
    evidence_register:       mongoose.Schema.Types.Mixed,
    rule_set_version:        String, // e.g. "OIML R-76 V1"
    createdBy:               String, // username of tester
    reviewedBy:              { type: String, default: "Quality Inspector" },
    approvedBy:              { type: String, default: "Admin Authority" },
    
    // Cryptographic Seal & Status
    sha256_hash:             String,
    report_status:           { type: String, enum: ["ISSUED", "SUPERSEDED"], default: "ISSUED" },
    supersededBy:            String, // ID of replacing report if superseded

    createdAt:               { type: Date, default: Date.now }
});

const Report = mongoose.model("Report", ReportSchema);

module.exports = Report;
