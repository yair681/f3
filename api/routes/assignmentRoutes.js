// api/routes/assignmentRoutes.js
const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/roles');
const Assignment = require('../models/Assignment');
const Class = require('../models/Class');
const router = express.Router();

const isTeacherOrAdminInClass = async (userId, classId, userRole) => {
    const classObj = await Class.findById(classId);
    return classObj && (classObj.teachers.includes(userId) || userRole === ROLES.Admin);
};

// 1. POST /api/assignments - שיוך משימה (מורה/מנהל)
router.post('/', protect, authorize([ROLES.Admin, ROLES.Teacher]), async (req, res) => {
    const { title, description, classId, dueDate } = req.body;

    if (!await isTeacherOrAdminInClass(req.user._id, classId, req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Must be a teacher/admin in this class to assign tasks.' });
    }

    try {
        const newAssignment = new Assignment({
            title, description, classId, dueDate, assignedBy: req.user._id
        });
        await newAssignment.save();
        res.status(201).json({ message: 'Assignment created successfully', assignment: newAssignment });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 2. GET /api/assignments/my-tasks - משימות לתלמיד (תלמיד)
router.get('/my-tasks', protect, authorize([ROLES.Student]), async (req, res) => {
    try {
        const assignments = await Assignment.find({ classId: { $in: req.user.classes } })
                                            .populate('classId', 'name')
                                            .sort({ dueDate: 1 });
        
        const assignmentsWithStatus = assignments.map(assignment => {
            const hasSubmitted = assignment.submissions.some(sub => sub.studentId.equals(req.user._id));
            return { ...assignment.toObject(), hasSubmitted };
        });

        res.json(assignmentsWithStatus);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 3. POST /api/assignments/:assignmentId/submit - הגשת משימה (תלמיד)
router.post('/:assignmentId/submit', protect, authorize([ROLES.Student]), async (req, res) => {
    const { content } = req.body;
    const assignmentId = req.params.assignmentId;

    try {
        const assignment = await Assignment.findById(assignmentId);
        
        const classObj = await Class.findById(assignment.classId);
        if (!classObj.students.includes(req.user._id)) {
             return res.status(403).json({ message: 'Forbidden: You are not a student in this class.' });
        }

        const alreadySubmitted = assignment.submissions.some(sub => sub.studentId.equals(req.user._id));
        if (alreadySubmitted) {
            return res.status(400).json({ message: 'Assignment already submitted.' });
        }

        assignment.submissions.push({ studentId: req.user._id, content: content });

        await assignment.save();
        res.json({ message: 'Submission successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 4. GET /api/assignments/:classId/submissions - צפייה בהגשות (מורה/מנהל)
router.get('/:classId/submissions', protect, authorize([ROLES.Admin, ROLES.Teacher]), async (req, res) => {
    const { classId } = req.params;

    if (!await isTeacherOrAdminInClass(req.user._id, classId, req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Not authorized to view submissions for this class.' });
    }

    try {
        const assignments = await Assignment.find({ classId })
            .populate('submissions.studentId', 'name email'); 

        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;