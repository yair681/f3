// api/models/Assignment.js
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    dueDate: { type: Date },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    submissions: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: { type: String },
        submittedAt: { type: Date, default: Date.now }
    }]
});

const Assignment = mongoose.model('Assignment', assignmentSchema);
module.exports = Assignment;