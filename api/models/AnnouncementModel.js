// models/AnnouncementModel.js

const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true,
        trim: true
    },
    content: { 
        type: String, 
        required: true,
        trim: true
    },
    classId: { 
        // הפניה למודל Class. זה יהיה null עבור הודעות כלליות.
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Class', 
        default: null 
    }, 
    postedBy: { 
        // הפניה למודל User.
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
    },
    date: { 
        type: Date, 
        default: Date.now 
    }
});

// ייצוא המודל תחת השם 'Announcement'
module.exports = mongoose.model('Announcement', announcementSchema);
