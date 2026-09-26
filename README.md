# NAWI Test Report Generator - SIH Problem Statement 36 (MERN Stack)

Welcome to the full MERN Stack application developed for **Smart India Hackathon (SIH)** - Problem Statement 36 (Development of a Software Program/Application for Generation of Test Reports for Non-Automatic Weighing Instruments - NAWI).

## 🚀 Team Name: Schrödinger’s Incident

## 📝 About The Project
This project is a modern **MERN Stack** web application (MongoDB, Express, React, Node.js) designed to automate the generation and management of test reports for Non-Automatic Weighing Instruments (NAWI). It streamlines testing procedures, performs automatic OIML R-76 compliant MPE calculations, and provides a centralized dashboard for managing test data, rule sets, administrative evidence, and official verification certificates.

### 🌟 Key Features
- **OIML R-76 Compliant Engine:** Automatic real-time evaluation of weighing performance, repeatability, eccentricity, zero-setting, tare accuracy, and tilt test tolerances.
- **Official Certificate Export (PDF):** Generate high-fidelity, A4 vector-based PDF calibration certificates with embedded QR codes and official watermarks using native browser print capability (`window.print()`).
- **Administrative Evidence Register:** Support for OIML R 76-2 administrative evidence (front/nameplate/side photographs and technical spec/manual documents).
- **Rule Set Version Management:** Admin portal to configure, create, and activate custom tolerance rule sets.
- **Interactive React SPA Frontend:** Single Page Application built with React and Vite for immediate UI feedback.
- **MongoDB Integration:** Full document persistence using Mongoose ODM with Audit Log history.

## 🛠️ Technology Stack
- **Frontend:** React.js, Vite, React Router, Font Awesome, Custom Vanilla CSS Design System
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Engine:** OIML R-76 Calculation Library

## ⚙️ How to Run Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed and MongoDB running (or a `MONGODB_URI` connection string).

### Setup & Run

1. **Install Server Dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Install Client Dependencies:**
   ```bash
   cd ../client
   npm install
   ```

3. **Seed Default OIML R-76 Ruleset (Optional):**
   ```bash
   npm run seed --prefix server
   ```

4. **Start Application:**
   - **Run Backend:** `npm run dev --prefix server` (runs on http://localhost:5000)
   - **Run Frontend:** `npm run dev --prefix client` (runs on http://localhost:5173)
   - Or build client and serve via express: `npm run dev`

5. **Demo Login Credentials:**
   - **Admin:** `admin@schrodingersincident.com` / `admin`
   - **Tester:** `tester@schrodingersincident.com` / `tester`

---
*Built with ❤️ by Schrödinger’s Incident*
