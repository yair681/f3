// api/routes/classRoutes.js
const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/roles');
const Class = require('../models/Class');
const User = require('../models/User'); 
const router = express.Router();

// 1. POST /api/classes - יצירת כיתה חדשה (מורה/מנהל)
router.post('/', protect, authorize([ROLES.Teacher, ROLES.Admin]), async (req, res) => {
    const { name } = req.body;
    
    try {
        const creatorId = req.user._id;
        const newClass = new Class({
            name, creatorId: creatorId, teachers: [creatorId] 
        });

        await newClass.save();
        await User.findByIdAndUpdate(creatorId, { $push: { classes: newClass._id } });

        res.status(201).json({ message: 'Class created successfully', class: newClass });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 2. DELETE /api/classes/:id - מחיקת כיתה (מנהל או היוצר)
router.delete('/:id', protect, authorize([ROLES.Teacher, ROLES.Admin]), async (req, res) => {
    try {
        const classToDelete = await Class.findById(req.params.id);

        if (!classToDelete) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // הרשאה: מנהל או היוצר
        if (req.user.role !== ROLES.Admin && !classToDelete.creatorId.equals(req.user._id)) {
            return res.status(403).json({ message: 'Forbidden: Only the Admin or the creator can delete this class.' });
        }

        await Class.findByIdAndDelete(req.params.id);
        
        // הסרת הכיתה מכל המשתמשים
        await User.updateMany(
            { classes: req.params.id },
            { $pull: { classes: req.params.id } }
        );

        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 3. PUT /api/classes/:classId/add-student/:studentId - הוספת תלמיד לכיתה (מורה/מנהל בכיתה)
router.put('/:classId/add-student/:studentId', protect, authorize([ROLES.Teacher, ROLES.Admin]), async (req, res) => {
    const { classId, studentId } = req.params;
    
    try {
        const classObj = await Class.findById(classId);
        const student = await User.findById(studentId);

        if (!classObj || !student) {
            return res.status(404).json({ message: 'Class or Student not found' });
        }

        // ודא שהמשתמש המבצע את הפעולה הוא מורה/מנהל בכיתה
        if (!classObj.teachers.includes(req.user._id) && req.user.role !== ROLES.Admin) {
            return res.status(403).json({ message: 'Forbidden: You must be a teacher in this class or an Admin.' });
        }

        // מגבלת 20 כיתות
        if (!student.classes.includes(classId) && student.classes.length >= 20) {
            return res.status(400).json({ message: 'Student cannot be added to more than 20 classes.' });
        }

        // הוספה לכיתה
        if (!classObj.students.includes(studentId)) {
            classObj.students.push(studentId);
            await classObj.save();
        }

        // הוספה לרשימת הכיתות של התלמיד
        if (!student.classes.includes(classId)) {
             student.classes.push(classId);
             await student.save();
        }

        res.json({ message: 'Student added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ... נתיבים נוספים כמו הסרת תלמיד או הוספת מורה עובדים בלוגיקה דומה

module.exports = router;