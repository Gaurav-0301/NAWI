require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");

const User = require("./models/User");
const Report = require("./models/Report");
const RuleSet = require("./models/RuleSet");
const AuditLog = require("./models/AuditLog");

const {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
} = require("./utils/jwt");

const { computeReportHash } = require("./utils/hashReport");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for React frontend (supports credentials for cookies/headers)
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());

// Rate limiter for public verification endpoint (protect against ID enumeration scraping)
const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes per IP
    message: { status: "ERROR", error: "Too many verification attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false
});

// Database Connection
let cachedDb = null;
const connectDB = async () => {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_DB || "mongodb://127.0.0.1:27017/nawi_test_db";
    
    if (mongoose.connection.readyState === 2) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (mongoose.connection.readyState === 1) return mongoose.connection;
    }

    const db = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 8000,
        bufferCommands: false,
    });
    cachedDb = db;
    console.log("✅ Connected to MongoDB");
    return cachedDb;
};

// Middleware: Database Connection
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
        res.status(500).json({ error: "Database Connection Error: " + err.message });
    }
});

// Middleware: Protect Routes with Access Token
const authMiddleware = async (req, res, next) => {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return res.status(401).json({ error: "Access token missing. Please log in." });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
        return res.status(401).json({ error: "Access token expired or invalid", code: "TOKEN_EXPIRED" });
    }

    req.user = decoded;
    req.username = decoded.name || (decoded.role === "admin" ? "Admin" : "Nishant");
    req.userRole = decoded.role;
    next();
};

// Middleware: Admin Only
const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Access Denied: Admin authorization required." });
    }
    next();
};

// Helper: Set Secure Auth Cookies
const setAuthCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie("role", res.req.userRole || "tester", { httpOnly: false, sameSite: "lax" });
    res.cookie("username", res.req.username || "User", { httpOnly: false, sameSite: "lax" });
};

// ── AUTHENTICATION API ROUTES ────────────────────────────────────

app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required." });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ error: "An account with this email already exists." });
        }

        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            role: ["admin", "tester", "viewer"].includes(role) ? role : "tester"
        });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save();

        req.userRole = user.role;
        req.username = user.name;
        setAuthCookies(res, accessToken, refreshToken);

        await AuditLog.create({
            user: user.name,
            action: "Registered Account",
            details: `Registered as ${user.role} (${user.email})`
        });

        res.status(201).json({
            success: true,
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const cleanEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: cleanEmail });

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save();

        req.userRole = user.role;
        req.username = user.name;
        setAuthCookies(res, accessToken, refreshToken);

        await AuditLog.create({
            user: user.name,
            action: "Logged In",
            details: `IP / Session authenticated successfully`
        });

        res.json({
            success: true,
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/auth/refresh", async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ error: "Refresh token missing. Please log in again." });
        }

        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({ error: "Invalid or expired refresh token." });
        }

        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ error: "Refresh token revoked or invalid." });
        }

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        user.refreshToken = newRefreshToken;
        await user.save();

        req.userRole = user.role;
        req.username = user.name;
        setAuthCookies(res, newAccessToken, newRefreshToken);

        res.json({
            success: true,
            accessToken: newAccessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get(["/api/auth/me", "/api/me"], async (req, res) => {
    try {
        let token = req.cookies.accessToken;

        if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.json({ authenticated: false });
        }

        const decoded = verifyAccessToken(token);
        if (!decoded) {
            return res.json({ authenticated: false, reason: "expired" });
        }

        const user = await User.findById(decoded.id).select("-password -refreshToken");
        if (!user) {
            return res.json({ authenticated: false });
        }

        res.json({
            authenticated: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            role: user.role,
            username: user.name
        });
    } catch (err) {
        res.json({ authenticated: false });
    }
});

app.post(["/api/auth/logout", "/api/logout"], async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const decoded = verifyRefreshToken(refreshToken);
            if (decoded && decoded.id) {
                await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
            }
        }
    } catch (e) {}

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.clearCookie("role");
    res.clearCookie("username");

    res.json({ success: true, message: "Logged out successfully" });
});

// ── PUBLIC UNAUTHENTICATED VERIFICATION ENDPOINT (Rate-Limited) ──

app.get("/api/verify/:reportId", verifyLimiter, async (req, res) => {
    try {
        const rawId = req.params.reportId.trim();
        
        let report = null;
        if (mongoose.Types.ObjectId.isValid(rawId)) {
            report = await Report.findById(rawId).lean();
        } else {
            // Match formatted string substring ID or instrument_id
            const cleanQuery = rawId.replace(/^TP-/i, "");
            const all = await Report.find().lean();
            report = all.find(r => r._id.toString().substring(0, 8).toUpperCase() === cleanQuery.toUpperCase());
        }

        if (!report) {
            return res.status(404).json({
                status: "NOT_FOUND",
                message: "Certificate not found. Please check the ID or QR code and try again."
            });
        }

        // Recompute SHA-256 hash to verify data integrity
        const computedHash = computeReportHash(report);
        const storedHash = report.sha256_hash || computedHash;

        const isTampered = computedHash !== storedHash;
        const status = isTampered ? "TAMPERED" : "VERIFIED";

        // Determine overall Pass/Fail status
        let isPass = true;
        const results = [report.form1_results, report.form2_results, report.form3_results, report.form_zero_results, report.form_tare_results, report.form_tilt_results];
        for (let r of results) {
            if (r && JSON.stringify(r).includes('"FAIL"')) {
                isPass = false;
                break;
            }
        }

        if (status === "TAMPERED") {
            return res.json({
                status: "TAMPERED",
                reportId: `TP-${report._id.toString().substring(0, 8).toUpperCase()}`,
                message: "Verification Failed — This record does not match its original issued content."
            });
        }

        res.json({
            status: "VERIFIED",
            reportId: `TP-${report._id.toString().substring(0, 8).toUpperCase()}`,
            rawId: report._id,
            isSuperseded: report.report_status === "SUPERSEDED",
            supersededBy: report.supersededBy || null,
            sha256Hash: storedHash,
            ruleSetVersion: report.rule_set_version || "OIML R-76-1 (2006 Edition)",
            testDate: report.createdAt,
            lab: report.lab_details || {},
            instrument: {
                manufacturer: report.instrument_data?.manufacturer || "N/A",
                model: report.instrument_data?.model || "N/A",
                serialNumber: report.instrument_data?.serial_no || "N/A",
                accuracyClass: report.instrument_data?.Class_value || "N/A",
                capacity: report.instrument_data?.capacity || "N/A"
            },
            overallResult: isPass ? "PASS" : "FAIL",
            reviewChain: [
                { name: report.createdBy || "Nishant", role: "Tester / Inspection Officer" },
                { name: report.reviewedBy || "Quality Inspector", role: "Viewer / Reviewer" },
                { name: report.approvedBy || "Admin Authority", role: "Administrator / Signing Official" }
            ]
        });
    } catch (err) {
        console.error("Verification endpoint error:", err);
        res.status(500).json({ status: "ERROR", error: "Internal verification failure" });
    }
});

// ── REPORT ROUTES (Protected) ───────────────────────────────────

app.post("/api/save-report", authMiddleware, async (req, res) => {
    try {
        const {
            instrument,
            testPlan,
            form0, form0_results,
            form1, form1_results,
            form2, form2_results,
            form3, form3_results,
            form_zero, form_zero_results,
            form_tare, form_tare_results,
            form_tilt, form_tilt_results,
            lab_details,
            instrument_photo,
            administrative_evidence,
            evidence_register,
            rule_set_version
        } = req.body;

        const instrument_id = instrument
            ? `${instrument.manufacturer || ""} ${instrument.model || ""}`.trim() || instrument.capacity
            : "Unknown";

        const newReport = new Report({
            instrument_id,
            instrument_data: instrument,
            test_plan:          testPlan,
            form0_data:         form0,
            form0_results,
            form1_data:         form1,
            form1_results,
            form2_data:         form2,
            form2_results,
            form3_data:         form3,
            form3_results,
            form_zero_data:     form_zero,
            form_zero_results,
            form_tare_data:     form_tare,
            form_tare_results,
            form_tilt_data:     form_tilt,
            form_tilt_results,
            lab_details,
            instrument_photo,
            administrative_evidence,
            evidence_register,
            rule_set_version,
            createdBy: req.username,
            report_status: "ISSUED"
        });

        // Compute SHA-256 seal for tamper verification
        newReport.sha256_hash = computeReportHash(newReport);

        const savedReport = await newReport.save();

        await AuditLog.create({
            user: req.username,
            action: `Generated report ${savedReport._id}`,
            details: `Instrument: ${instrument_id}, Hash: ${savedReport.sha256_hash.substring(0, 16)}...`
        });

        res.json({ message: "Report saved successfully!", id: savedReport._id, sha256_hash: savedReport.sha256_hash });
    } catch (err) {
        console.error("Save report error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/history", authMiddleware, async (req, res) => {
    try {
        const reports = await Report.find({}, "instrument_id instrument_data createdAt form1_results form2_results form3_results form_zero_results form_tare_results form_tilt_results createdBy rule_set_version sha256_hash report_status").sort({ createdAt: -1 }).lean();
        
        reports.forEach(r => {
            let isPass = true;
            const results = [r.form1_results, r.form2_results, r.form3_results, r.form_zero_results, r.form_tare_results, r.form_tilt_results];
            for (let res of results) {
                if (res) {
                    const str = JSON.stringify(res);
                    if (str.includes('"FAIL"')) {
                        isPass = false;
                        break;
                    }
                }
            }
            r.status = isPass ? "PASS" : "FAIL";
            r.serial_no = (r.instrument_data && r.instrument_data.serial_no) ? r.instrument_data.serial_no : "N/A";
            r.accuracy_class = (r.instrument_data && r.instrument_data.Class_value) ? r.instrument_data.Class_value : "Unknown";
            r.instrument_type = (r.instrument_data && r.instrument_data.instrument_type) ? r.instrument_data.instrument_type : "Unknown";
        });

        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/report/:id", authMiddleware, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id).lean();
        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── RULE SET & ADMIN ROUTES ──────────────────────────────────────

app.get("/api/rules/active", async (req, res) => {
    try {
        let activeRule = await RuleSet.findOne({ isActive: true });
        if (!activeRule) {
            activeRule = await RuleSet.findOne({ version_name: "OIML R-76 V1" });
        }
        res.json(activeRule || {});
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/admin/dashboard", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const allReports = await Report.find({}, 
            "instrument_id instrument_data createdBy createdAt rule_set_version form1_results form2_results form3_results form_zero_results form_tare_results form_tilt_results lab_details sha256_hash"
        ).sort({ createdAt: -1 }).lean();

        let passed = 0, failed = 0;
        const processedReports = allReports.map(r => {
            let isPass = true;
            const results = [r.form1_results, r.form2_results, r.form3_results, r.form_zero_results, r.form_tare_results, r.form_tilt_results];
            for (const res of results) {
                if (res && JSON.stringify(res).includes('"FAIL"')) { isPass = false; break; }
            }
            if (isPass) passed++; else failed++;
            return { ...r, status: isPass ? "PASS" : "FAIL" };
        });

        const users = await User.find().select("name email role createdAt").lean();
        const testers = users.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role === "admin" ? "Administrator" : u.role === "viewer" ? "Viewer Officer" : "Tester Officer",
            rawRole: u.role,
            tests: allReports.filter(r => r.createdBy === u.name).length,
            status: "Active",
            createdAt: u.createdAt
        }));

        const rulesets = await RuleSet.find().sort({ createdAt: -1 }).lean();
        const activeRule = rulesets.find(r => r.isActive) || rulesets[0] || null;
        const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(150).lean();

        const stats = {
            total: allReports.length,
            passed,
            failed,
            pending: 0,
            users: testers.length
        };

        res.json({ stats, reports: processedReports, testers, rulesets, activeRule, logs });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: "Error loading admin dashboard: " + err.message });
    }
});

app.post("/api/admin/users/add", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required." });
        }

        const validRoles = ["admin", "tester", "viewer"];
        const userRole = validRoles.includes(role) ? role : "viewer";

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ error: "An officer account with this email already exists." });
        }

        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            role: userRole
        });

        await user.save();

        await AuditLog.create({
            user: req.username,
            action: `Registered New Officer (${userRole.toUpperCase()})`,
            details: `Created account for ${user.name} <${user.email}>`
        });

        res.status(201).json({
            success: true,
            message: `Registered new ${userRole} officer successfully!`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Add user error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/admin/rules/add", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { version_name, description, rules, setActive, adminPassword } = req.body;
        let parsedRules;
        try {
            parsedRules = typeof rules === 'string' ? JSON.parse(rules) : rules;
        } catch(e) {
            return res.status(400).json({ error: "Invalid JSON in rules field." });
        }

        const isSetDefaultActive = Boolean(setActive);
        if (isSetDefaultActive) {
            if (!adminPassword) {
                return res.status(400).json({ error: "Admin password is required to set a rule set as active for testing." });
            }
            const adminUser = await User.findById(req.user.id);
            if (!adminUser || !(await adminUser.comparePassword(adminPassword))) {
                return res.status(401).json({ error: "Invalid admin password. Authorization failed." });
            }
            await RuleSet.updateMany({}, { isActive: false });
        }

        const newRule = new RuleSet({
            version_name,
            description,
            rules: parsedRules,
            isActive: isSetDefaultActive,
            createdBy: req.username
        });
        await newRule.save();

        await AuditLog.create({
            user: req.username,
            action: `Added Rule Set ${version_name}`,
            details: isSetDefaultActive ? `Status: ACTIVE (Set for testing)` : `Status: DRAFT`
        });

        res.json({
            success: true,
            message: isSetDefaultActive
                ? `Rule set '${version_name}' created and set as ACTIVE for testing!`
                : `Rule set '${version_name}' created successfully.`
        });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/admin/rules/activate/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { adminPassword } = req.body;
        if (!adminPassword) {
            return res.status(400).json({ error: "Admin password is required to activate a rule set for testing." });
        }

        const adminUser = await User.findById(req.user.id);
        if (!adminUser || !(await adminUser.comparePassword(adminPassword))) {
            return res.status(401).json({ error: "Invalid admin password. Authorization failed." });
        }

        const ruleId = (req.params.id || "").trim();
        const targetRule = await RuleSet.findById(ruleId);
        if (!targetRule) return res.status(404).json({ error: "Rule set not found" });

        const previousRule = await RuleSet.findOne({ isActive: true });
        
        await RuleSet.updateMany({}, { isActive: false });
        targetRule.isActive = true;
        await targetRule.save();

        await AuditLog.create({
            user: req.username,
            action: `Activated Rule Set ${targetRule.version_name}`,
            details: `Authorized with admin password verification. Previous: ${previousRule ? previousRule.version_name : 'None'}`
        });

        res.json({ success: true, message: `Successfully activated '${targetRule.version_name}' for testing!` });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve static React build in production
if (process.env.NODE_ENV === "production") {
    const clientDist = path.join(__dirname, "../client/dist");
    app.use(express.static(clientDist));
    app.get("*", (req, res) => {
        res.sendFile(path.join(clientDist, "index.html"));
    });
}

app.listen(PORT, () => {
    console.log(`🚀 NAWI Server (JWT + Public Verification) running on http://localhost:${PORT}`);
});
