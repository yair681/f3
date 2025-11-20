// api/routes/announcementRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');

// ==================================================================
// הגדרת נתיבים למודלים ול-Middleware
// אנו משתמשים ב-AnnouncementModel (השם החדש)
// ==================================================================

const rootDir = process.cwd();

// שים לב: כאן אנחנו קוראים לקובץ בשם החדש שלו!
const Announcement = require(path.join(rootDir, 'models', 'AnnouncementModel'));
const Class = require(path.join(rootDir, 'models', 'Class'));
const { protect } = require(path.join(rootDir, 'api', 'middleware', 'auth'));

// ==================================================================
// נתיבים (Routes)
// ==================================================================

// 1. GET /api/announcements/main
// קבלת הודעות ראשיות (לכל המשתמשים) - הודעות שאין להן classId
router.get('/main', async (req, res) => {
    try {
        const announcements = await Announcement.find({ classId: null })
            .populate('postedBy', 'name') // מביא את שם המפרסם מהמודל של User
            .sort({ date: -1 }) // מיון מהחדש לישן
            .limit(20); // מגביל ל-20 הודעות אחרונות

        res.json(announcements);
    } catch (err) {
        console.error("Error loading main announcements:", err);
        res.status(500).json({ message: 'שגיאת שרת בטעינת הודעות.' });
    }
});

// 2. POST /api/announcements
// פרסום הודעה חדשה (מורה או מנהל בלבד)
router.post('/', protect, async (req, res) => {
    // וידוא הרשאות
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'אין הרשאה לפרסם הודעות.' });
    }

    const { title, content, classId } = req.body;

    try {
        // אם נבחרה כיתה (וזה לא 'main'), נבדוק שהיא קיימת
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
            // אם ה-classId הוא 'main' או ריק, נשמור כ-null. אחרת נשמור את ה-ID האמיתי.
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

// 3. GET /api/announcements/class/:classId
// קבלת הודעות לכיתה ספציפית (עבור תלמידים/מורים בכיתה)
router.get('/class/:classId', protect, async (req, res) => {
    try {
        const announcements = await Announcement.find({ classId: req.params.classId })
            .populate('postedBy', 'name')
            .sort({ date: -1 });

        res.json(announcements);
    } catch (err) {
        console.error("Error loading class announcements:", err);
        res.status(500).json({ message: 'שגיאה בטעינת הודעות כיתה.' });
    }
});

module.exports = router;
