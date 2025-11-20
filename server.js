// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs'); // עבור בדיקת הקבצים

const app = express();
const PORT = process.env.PORT || 3000;

// ==================================================================
// 🔍 DEBUGGING: בדיקת קבצים בשרת (יופיע בלוגים של Render)
// ==================================================================
console.log("--- DEBUG: Checking File Structure ---");
console.log("Current Directory (cwd):", process.cwd());

const modelsPath = path.join(process.cwd(), 'models');
if (fs.existsSync(modelsPath)) {
    console.log("✅ 'models' folder found. Files inside:");
    fs.readdirSync(modelsPath).forEach(file => {
        console.log(`   - ${file}`);
    });
} else {
    console.error("❌ ERROR: 'models' folder NOT found in root directory!");
}

const routesPath = path.join(process.cwd(), 'api', 'routes');
if (fs.existsSync(routesPath)) {
    console.log("✅ 'routes' folder found. Files inside:");
    fs.readdirSync(routesPath).forEach(file => {
        console.log(`   - ${file}`);
    });
} else {
    console.error("❌ ERROR: 'api/routes' folder NOT found!");
}
console.log("--------------------------------------");
// ==================================================================


// 1. חיבור ל-MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// 2. Middleware
app.use(express.json()); // ניתוח JSON
app.use(express.urlencoded({ extended: true })); // ניתוח טפסים
app.use(express.static(path.join(__dirname, 'public'))); // הגשת קבצים סטטיים (פותר את בעיית ה-CSS)

// 3. ייבוא נתיבים (Routes)
// שימוש ב-path.join כדי למנוע טעויות נתיב בלינוקס/ווינדוס
try {
    const authRoutes = require(path.join(__dirname, 'api', 'routes', 'authRoutes'));
    const userRoutes = require(path.join(__dirname, 'api', 'routes', 'userRoutes'));
    const classRoutes = require(path.join(__dirname, 'api', 'routes', 'classRoutes'));
    const announcementRoutes = require(path.join(__dirname, 'api', 'routes', 'announcementRoutes'));
    // const assignmentRoutes = require(path.join(__dirname, 'api', 'routes', 'assignmentRoutes')); // בטל הערה כשיש קובץ

    // 4. הגדרת נתיבי API
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/classes', classRoutes);
    app.use('/api/announcements', announcementRoutes);
    // app.use('/api/assignments', assignmentRoutes);

} catch (error) {
    console.error("❌ CRITICAL ERROR: Failed to load routes.", error.message);
    console.error("Please check the logs above to see which file is missing.");
}

// 5. נתיב ברירת מחדל (עבור Frontend)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 6. הפעלת השרת
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
