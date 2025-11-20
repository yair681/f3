// api/routes/userRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/roles');
const User = require('../models/User');
const router = express.Router();

// 1. GET /api/users/me - קבלת פרטי המשתמש המחובר
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-passwordHash').populate('classes', 'name');
        if (!user) {
             return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 2. POST /api/users - יצירת משתמש חדש (Admin בלבד)
router.post('/', protect, authorize([ROLES.Admin]), async (req, res) => {
    const { name, email, password, role } = req.body;
    
    try {
        if (await User.findOne({ email })) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, passwordHash, role });
        await newUser.save();

        res.status(201).json({ message: 'User created successfully', userId: newUser._id });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 3. DELETE /api/users/:id - מחיקת משתמש (Admin בלבד - הגנה על יאיר פריש)
router.delete('/:id', protect, authorize([ROLES.Admin]), async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);

        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToDelete.isProtected) {
            return res.status(403).json({ message: 'Unauthorized: Cannot delete a protected system user.' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User removed successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 4. PUT /api/users/change-password - עדכון סיסמה (עצמי)
router.put('/change-password', protect, async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);
        const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect old password' });
        }

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;