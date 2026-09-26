// NAWI — OIML R-76 Core Calculation Engine for React Frontend

export function normalizeClass(cls) {
    return (cls || "").replace(/class\s*/i, "").trim().toUpperCase();
}

/**
 * MPE Calculation (OIML R-76 Table 1)
 * @param {number} load_g  - Applied load in grams
 * @param {number} e_g     - Verification scale interval (e) in grams
 * @param {string} cls     - e.g. "class III" | "III"
 * @param {object} activeRules - Custom ruleset object from DB if active
 * @returns {number} MPE in grams
 */
export function getMPE(load_g, e_g, cls, activeRules = null) {
    const c = normalizeClass(cls);
    const m = load_g / e_g;
    let mult = 0;
    
    let intervals = [];
    if      (c === "I")    intervals = [50000, 200000];
    else if (c === "II")   intervals = [5000, 20000];
    else if (c === "III")  intervals = [500, 2000];
    else if (c === "IIII") intervals = [50, 200];

    let mpe_e = [0.5, 1.0, 1.5];

    if (activeRules && activeRules.mpe) {
        const rules = activeRules.mpe;
        const clsKey = "class_" + c;
        if (rules[clsKey]) {
            intervals = rules[clsKey].e_intervals || intervals;
            mpe_e = rules[clsKey].mpe_e || mpe_e;
        }
    }

    if (intervals.length >= 2) {
        if (m <= intervals[0]) mult = mpe_e[0];
        else if (m <= intervals[1]) mult = mpe_e[1];
        else mult = mpe_e[2] || 1.5;
    }

    return mult * e_g;
}

/**
 * MPE Tier Boundaries
 */
export function getMPETierBoundaries(cls, e_g, activeRules = null) {
    const c = normalizeClass(cls);
    let intervals = [];

    if (activeRules && activeRules.mpe) {
        const rules = activeRules.mpe;
        const clsKey = "class_" + c;
        if (rules[clsKey] && rules[clsKey].e_intervals) {
            intervals = rules[clsKey].e_intervals;
        }
    }

    if (intervals.length === 0) {
        if (c === "I")    intervals = [50000, 200000];
        else if (c === "II")   intervals = [5000, 20000];
        else if (c === "III")  intervals = [500, 2000];
        else if (c === "IIII") intervals = [50, 200];
    }

    return intervals.map(v => v * e_g);
}

/**
 * Generate test points according to OIML R-76 §3.6
 */
export function generateTestPoints(max_g, min_g, e_g, cls, activeRules = null) {
    const pts = new Set();
    pts.add(0);

    const minLoad = (min_g > 0) ? min_g : (20 * e_g);
    if (minLoad <= max_g) pts.add(minLoad);

    getMPETierBoundaries(cls, e_g, activeRules).forEach(b => {
        if (b > minLoad && b < max_g) pts.add(b);
    });

    [0.10, 0.25, 0.50, 0.75].forEach(f => {
        const r = Math.round((max_g * f) / e_g) * e_g;
        if (r > minLoad && r < max_g) pts.add(r);
    });

    pts.add(max_g);
    return Array.from(pts).filter(p => p >= 0 && p <= max_g).sort((a, b) => a - b);
}

/**
 * Number of repeatability readings (OIML R-76 §3.6.2)
 */
export function getRepeatabilityReadings(cls) {
    const c = normalizeClass(cls);
    return (c === "I" || c === "II") ? 3 : 6;
}

/**
 * Test Plan Generator
 */
export function generateTestPlan(instr, activeRules = {}) {
    const {
        max_g,
        min_g,
        e_g,
        cls,
        isMobile         = false,
        hasTare          = true,
        hasMultiPosition = true
    } = instr;

    const eccFrac     = (activeRules?.eccentricity?.load_fraction) ? activeRules.eccentricity.load_fraction : (1/3);
    const repMaxDiffE = (activeRules?.repeatability?.max_diff_e) ? activeRules.repeatability.max_diff_e : 1.0;
    const zeroLimitE  = (activeRules?.zero_setting?.limit_e) ? activeRules.zero_setting.limit_e : 0.25;
    const tiltLimitE  = (activeRules?.tilt?.limit_e) ? activeRules.tilt.limit_e : 1.0;
    const tareMult    = (activeRules?.tare?.mpe_multiplier) ? activeRules.tare.mpe_multiplier : 1.0;

    const testPoints  = generateTestPoints(max_g, min_g, e_g, cls, activeRules);
    const repeatLoad  = Math.round((max_g / 2) / e_g) * e_g;
    const eccLoad     = Math.round((max_g * eccFrac) / e_g) * e_g;
    const numReadings = getRepeatabilityReadings(cls);
    const nonZeroPts  = testPoints.filter(p => p > 0);

    return [
        {
            id: 1,
            name: "Visual Inspection",
            shortName: "Visual",
            icon: "fas fa-eye",
            status: "REQUIRED",
            note: "Markings, construction, sealing, levelling, display"
        },
        {
            id: 2,
            name: "Weighing Performance",
            shortName: "Weighing",
            icon: "fas fa-weight",
            status: "REQUIRED",
            note: `${nonZeroPts.length} loads × 2 (asc + desc) = ${nonZeroPts.length * 2} readings`,
            testPoints
        },
        {
            id: 3,
            name: "Repeatability",
            shortName: "Repeat.",
            icon: "fas fa-sync-alt",
            status: "REQUIRED",
            note: `${numReadings} readings at ${(repeatLoad/1000).toFixed(3)} kg (½ Max, max diff ≤ ${repMaxDiffE}e)`,
            load: repeatLoad,
            readings: numReadings,
            max_diff_e: repMaxDiffE
        },
        {
            id: 4,
            name: "Eccentricity",
            shortName: "Eccentric",
            icon: "fas fa-crosshairs",
            status: hasMultiPosition ? "REQUIRED" : "NOT_APPLICABLE",
            note: hasMultiPosition
                ? `5 positions at ${(eccLoad/1000).toFixed(3)} kg (~${Math.round(eccFrac * 100)}% Max)`
                : "N/A — single-point load receptor (e.g. crane/hanging scale)",
            load: eccLoad,
            positions: ["Front", "Right", "Rear", "Left", "Center"]
        },
        {
            id: 5,
            name: "Zero-Setting / Tracking",
            shortName: "Zero",
            icon: "fas fa-bullseye",
            status: "REQUIRED",
            note: `Limit: ±${zeroLimitE}e = ±${(zeroLimitE * e_g).toFixed(2)} g`,
            halfE_g: zeroLimitE * e_g,
            limit_e: zeroLimitE
        },
        {
            id: 6,
            name: "Tare Accuracy",
            shortName: "Tare",
            icon: "fas fa-balance-scale",
            status: hasTare ? "IF_APPLICABLE" : "NOT_APPLICABLE",
            note: hasTare
                ? `Include if tare device used (Tolerance: ${tareMult} × MPE)`
                : "N/A — instrument has no tare device",
            mpe_multiplier: tareMult
        },
        {
            id: 7,
            name: "Discrimination / Sensitivity",
            shortName: "Discrim.",
            icon: "fas fa-sliders-h",
            status: "NOT_APPLICABLE",
            note: "N/A for digital-indication instruments (OIML R-76 §3.7)"
        },
        {
            id: 8,
            name: "Tilt Test",
            shortName: "Tilt",
            icon: "fas fa-arrows-alt",
            status: isMobile ? "REQUIRED" : "IF_MOBILE",
            note: isMobile
                ? `Required — mobile instrument. Limit: ${tiltLimitE}e = ${(tiltLimitE * e_g).toFixed(2)} g`
                : `Include if mobile/portable (Limit: ${tiltLimitE}e)`,
            limit_g: tiltLimitE * e_g,
            limit_e: tiltLimitE
        }
    ];
}
