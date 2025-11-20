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
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Class', 
        default: null 
    }, 
    postedBy: { 
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
