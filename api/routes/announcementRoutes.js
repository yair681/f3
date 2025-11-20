// api/routes/announcementRoutes.js

const express = require('express');
const router = express.Router();
const Announcement = require('../../models/Announcement'); // הנח את הנתיב הנכון למודל
const auth = require('../../middleware/auth'); // Middleware לאימות JWT והרשאות

// ------------------------------------------------------------------
// GET /api/announcements/main - שליפת הודעות ראשיות (כלליות)
// ------------------------------------------------------------------
router.get('/main', auth, async (req, res) => {
    try {
        // שליפת כל ההודעות שבהן classId הוא null (הודעות כלליות)
        const announcements = await Announcement.find({ classId: null })
            .sort({ date: -1 })
            .limit(10); // מגביל ל-10 הודעות אחרונות

        res.json(announcements);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'שגיאה בטעינת הודעות ראשיות.' });
    }
});

// ------------------------------------------------------------------
// POST /api/announcements - יצירת הודעה חדשה (Teacher/Admin)
// ------------------------------------------------------------------
router.post('/', auth, async (req, res) => {
    // ודא שהמשתמש הוא מורה או מנהל
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'אין הרשאה לפרסם הודעות.' });
    }

    const { title, content, classId } = req.body; // classId יכול להיות null להודעה כללית

    try {
        const announcement = new Announcement({
            title,
            content,
            classId: classId || null, // אם classId לא נשלח, זה null (הודעה כללית)
            postedBy: req.user._id
        });

        await announcement.save();
        res.status(201).json({ message: 'ההודעה פורסמה בהצלחה.', announcement });
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'שגיאה בפרסום הודעה.', error: err.message });
    }
});

module.exports = router;
