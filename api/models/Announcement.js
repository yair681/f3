// models/Announcement.js

const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    classId: { 
        // הפניה למודל Class. זה יהיה null עבור הודעות כלליות/ראשיות.
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Class', 
        default: null 
    }, 
    postedBy: { 
        // הפניה למודל User. זה המשתמש (מורה/מנהל) שפרסם את ההודעה.
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
    },
    date: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Announcement', announcementSchema);
