// api/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || !await bcrypt.compare(password, user.passwordHash)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.json({ 
            token, 
            user: { id: user._id, name: user.name, email: user.email, role: user.role } 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;