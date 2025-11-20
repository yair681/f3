// server.js

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
// טוען משתני סביבה (כמו MONGODB_URI) מקובץ .env
require('dotenv').config(); 

// ----------------------------------------------------
// הגדרות בסיסיות ו-DB
// ----------------------------------------------------

const app = express();
const PORT = process.env.PORT || 3000;

// חיבור ל-MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('Could not connect to MongoDB. Check MONGODB_URI:', err.message);
        process.exit(1); // יציאה מהאפליקציה אם החיבור נכשל
    });

// ----------------------------------------------------
// Middleware
// ----------------------------------------------------

// ניתוח גוף בקשות JSON
app.use(express.json());

// **הגשת קבצים סטטיים** (public/style.css, public/dashboard.js, וכו')
app.use(express.static('public'));

// ----------------------------------------------------
// חיבור נתיבים (Routers)
// ----------------------------------------------------
// יש לוודא שקבצי ה-Routes נמצאים בתיקייה './api/routes/'
// ויש להגדיר את הנתיב הנכון לכל קובץ.
// (נתיב לדוגמה: './api/routes/userRoutes')

const userRoutes = require('./api/routes/userRoutes'); 
const classRoutes = require('./api/routes/classRoutes'); 
const announcementRoutes = require('./api/routes/announcementRoutes');

app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/announcements', announcementRoutes);

// ----------------------------------------------------
// טיפול בנתיבים ו-SPA Fallback
// ----------------------------------------------------

// נתיב ראשי המגיש את דף הכניסה (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// כל נתיב שלא נתפס ע"י ה-API או הקבצים הסטטיים, מוחזר לדף הראשי (Frontend)
app.get('*', (req, res) => {
    // זה קריטי עבור יישומי Single Page Application (כדי שרענון יעבוד)
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// ----------------------------------------------------
// הרצת השרת
// ----------------------------------------------------
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
