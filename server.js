// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');

// ייבוא מודלים ונתיבים
const User = require('./api/models/User'); 
const authRoutes = require('./api/routes/authRoutes');
const userRoutes = require('./api/routes/userRoutes');
const classRoutes = require('./api/routes/classRoutes');
const announcementRoutes = require('./api/routes/announcementRoutes');
const assignmentRoutes = require('./api/routes/assignmentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.MONGODB_URI;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); 

// חיבור ל-MongoDB ואתחול משתמש מוגן
mongoose.connect(DB_URI)
    .then(() => {
        console.log("Connected to MongoDB");
        seedAdminUser(); 
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => console.error("Could not connect to MongoDB:", err));


// יצירת משתמש המנהל המוגן (יאיר פריש)
const seedAdminUser = async () => {
    const adminEmail = 'yairfrish2@gmail.com';
    const adminPass = 'yair12345';
    
    try {
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            const passwordHash = await bcrypt.hash(adminPass, 10);
            const yairFrish = new User({
                email: adminEmail,
                name: 'יאיר פריש',
                passwordHash: passwordHash,
                role: 'admin',
                isProtected: true
            });
            await yairFrish.save();
            console.log(`Protected Admin User created: ${adminEmail}`);
        } else {
            if (!existingAdmin.isProtected) {
                existingAdmin.isProtected = true;
                await existingAdmin.save();
            }
            console.log("Protected Admin User already exists.");
        }
    } catch (error) {
        console.error("Error creating Admin User:", error);
    }
};

// נתיבי API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/assignments', assignmentRoutes);

// טיפול בהפניה לדפי ה-Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// טיפול בשגיאות
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});