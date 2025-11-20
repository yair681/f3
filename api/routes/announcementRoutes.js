// api/routes/announcementRoutes.js
const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/roles');
const Announcement = require('../models/Announcement');
const Class = require('../models/Class');
const router = express.Router();

// 1. POST /api/announcements - פרסום הודעה (מורה/מנהל)
router.post('/', protect, authorize([ROLES.Admin, ROLES.Teacher]), async (req, res) => {
    const { title, content, type, classId } = req.body;
    
    try {
        if (type === 'class') {
            const classObj = await Class.findById(classId);
            if (!classObj || (!classObj.teachers.includes(req.user._id) && req.user.role !== ROLES.Admin)) {
                return res.status(403).json({ message: 'Forbidden: Must be a teacher/admin in this class to post.' });
            }
        }

        const newAnnouncement = new Announcement({
            title, content, type, 
            classId: type === 'class' ? classId : undefined,
            authorId: req.user._id
        });

        await newAnnouncement.save();
        res.status(201).json({ message: 'Announcement published successfully', announcement: newAnnouncement });
    } catch (error) {
        res.status(500).json({ message: 'Server error while publishing announcement' });
    }
});

// 2. GET /api/announcements/main - קבלת הודעות ראשיות (פומבי)
router.get('/main', async (req, res) => {
    try {
        const announcements = await Announcement.find({ type: 'main' })
                                                .populate('authorId', 'name')
                                                .sort({ date: -1 }); 
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 3. GET /api/announcements/class/:classId - קבלת הודעות כיתה (משתמש בכיתה)
router.get('/class/:classId', protect, async (req, res) => {
    try {
        const classObj = await Class.findById(req.params.classId);
        
        // ודא שהמשתמש משויך לכיתה
        const isMember = classObj && (classObj.students.includes(req.user._id) || classObj.teachers.includes(req.user._id) || req.user.role === ROLES.Admin);
        
        if (!isMember) {
            return res.status(403).json({ message: 'Forbidden: Not a member of this class.' });
        }

        const announcements = await Announcement.find({ type: 'class', classId: req.params.classId })
                                                .populate('authorId', 'name')
                                                .sort({ date: -1 });

        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;