// api/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
    isProtected: { type: Boolean, default: false }, 
    classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }] 
});

const User = mongoose.model('User', userSchema);
module.exports = User;