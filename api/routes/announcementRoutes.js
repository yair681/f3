// api/routes/announcementRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');

// ==================================================================
// תיקון נתיבים אבסולוטי (מונע את שגיאת Cannot find module)
// ==================================================================

// מגדיר את התיקייה הראשית של הפרויקט
const rootDir = process.cwd();

// טעינת המודלים וה-middleware באמצעות נתיב מלא ובטוח
const Announcement = require(path.join(rootDir, 'models', 'Announcement'));
const Class = require(path.join(rootDir, 'models', 'Class'));
const { protect } = require(path.join(rootDir, 'api', 'middleware', 'auth'));

// ==================================================================
// נתיבים (Routes)
// ==================================================================

// 1. GET /api/announcements/main - קבלת הודעות ראשיות (לכולם)
// לא דורש protect כדי שיוצג בדף הבית, או דורש אם רוצים
router.get('/main', async (req, res) => {
    try {
        // שליפת הודעות שאין להן classId (כלומר הודעות ראשיות)
        const announcements = await Announcement.find({ classId: null })
            .populate('postedBy', 'name') // מביא את שם המפרסם
            .sort({ date: -1 }) // מהחדש לישן
            .limit(10); // מגביל ל-10 אחרונות

        res.json(announcements);
    } catch (err) {
        console.error("Error loading main announcements:", err);
        res.status(500).json({ message: 'שגיאת שרת בטעינת הודעות.' });
    }
});

// 2. POST /api/announcements - פרסום הודעה חדשה (מורה/מנהל)
router.post('/', protect, async (req, res) => {
    // וידוא הרשאות: רק מורה או מנהל יכולים לפרסם
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'אין הרשאה לפרסם הודעות.' });
    }

    const { title, content, classId } = req.body;

    try {
        // בדיקה: אם נבחרה כיתה ספציפית, נודא שהיא קיימת
        if (classId && classId !== 'main') {
            const targetClass = await Class.findById(classId);
            if (!targetClass) {
                return res.status(404).json({ message: 'הכיתה לא נמצאה.' });
            }
        }

        // יצירת ההודעה
        const newAnnouncement = new Announcement({
            title,
            content,
            // אם זה 'main' או ריק, נשמור כ-null. אחרת, נשמור את ה-ID של הכיתה
            classId: (classId === 'main' || !classId) ? null : classId,
            postedBy: req.user._id
        });

        await newAnnouncement.save();
        res.status(201).json({ message: 'ההודעה פורסמה בהצלחה!', announcement: newAnnouncement });

    } catch (err) {
        console.error("Error posting announcement:", err);
        res.status(500).json({ message: 'שגיאה בפרסום ההודעה.' });
    }
});

// 3. GET /api/announcements/class/:classId - הודעות לכיתה ספציפית
router.get('/class/:classId', protect, async (req, res) => {
    try {
        const announcements = await Announcement.find({ classId: req.params.classId })
            .populate('postedBy', 'name')
            .sort({ date: -1 });

        res.json(announcements);
    } catch (err) {
        res.status(500).json({ message: 'שגיאה בטעינת הודעות כיתה.' });
    }
});

module.exports = router;
