require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function seedUsers() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_DB || "mongodb://127.0.0.1:27017/nawi_test_db";
    try {
        await mongoose.connect(mongoUri);

        // Check if Admin exists
        const adminExisting = await User.findOne({ email: "admin@schrodingersincident.com" });
        if (!adminExisting) {
            await User.create({
                name: "Dr. Raman Kumar",
                email: "[EMAIL_ADDRESS]",
                password: "admin123", // Hashes automatically via pre-save hook
                role: "admin"
            });
            console.log("✅ Seeded Admin User: admin@schrodingersincident.com / admin123");
        } else {
            console.log("ℹ️ Admin User already exists.");
        }

        // Check if Tester exists
        const testerExisting = await User.findOne({ email: "tester@schrodingersincident.com" });
        if (!testerExisting) {
            await User.create({
                name: "Nishant",
                email: "tester@schrodingersincident.com",
                password: "tester123", // Hashes automatically via pre-save hook
                role: "tester"
            });
            console.log("✅ Seeded Tester User: tester@schrodingersincident.com / tester123");
        } else {
            console.log("ℹ️ Tester User already exists.");
        }

        // Check if Viewer exists
        const viewerExisting = await User.findOne({ email: "viewer@schrodingersincident.com" });
        if (!viewerExisting) {
            await User.create({
                name: "Quality Reviewer",
                email: "viewer@schrodingersincident.com",
                password: "viewer123", // Hashes automatically via pre-save hook
                role: "viewer"
            });
            console.log("✅ Seeded Viewer User: viewer@schrodingersincident.com / viewer123");
        } else {
            console.log("ℹ️ Viewer User already exists.");
        }

    } catch (err) {
        console.error("❌ Error seeding users:", err.message);
    } finally {
        mongoose.connection.close();
    }
}

seedUsers();
