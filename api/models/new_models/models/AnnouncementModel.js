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
        ref: 'Class', // חובה לוודא ששם המודל Class הוא 'Class'
        default: null 
    }, 
    postedBy: { 
        // הפניה למודל User. זה המשתמש (מורה/מנהל) שפרסם את ההודעה.
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', // חובה לוודא ששם המודל User הוא 'User'
        required: true
    },
    date: { 
        type: Date, 
        default: Date.now 
    }
});

// שימו לב: יצאנו את המודל תחת השם 'Announcement' (ולא 'AnnouncementModel')
// כי זה השם שבו אנחנו משתמשים בפונקציית .populate() בקבצי Routes.
module.exports = mongoose.model('Announcement', announcementSchema);
