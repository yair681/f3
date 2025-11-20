// api/models/Class.js
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

const Class = mongoose.model('Class', classSchema);
module.exports = Class;