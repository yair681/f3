// api/models/Announcement.js
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: Date, default: Date.now },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['main', 'class'], required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: function() { return this.type === 'class'; } }
});

const Announcement = mongoose.model('Announcement', announcementSchema);
module.exports = Announcement;