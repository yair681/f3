// server.js

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

// ----------------------------------------------------
// 1. הגדרות בסיסיות ו-DB
// ----------------------------------------------------

const app = express();
const PORT = process.env.PORT || 3000;

// **החלף במחרוזת החיבור שלך ל-MongoDB**
const MONGODB_URI = 'YOUR_MONGODB_CONNECTION_STRING_HERE';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// ----------------------------------------------------
// 2. סכמות ומודלים (Schemas & Models)
// ----------------------------------------------------

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' }
});

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

const User = mongoose.model('User', userSchema);

const classSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    enrollmentKey: { type: String, required: true, unique: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});
const Class = mongoose.model('Class', classSchema);

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }, // אם ההודעה ספציפית לכיתה
    date: { type: Date, default: Date.now }
});
const Announcement = mongoose.model('Announcement', announcementSchema);

const assignmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    dueDate: { type: Date, required: true }
});
const Assignment = mongoose.model('Assignment', assignmentSchema);


// ----------------------------------------------------
// 3. הגדרות Express ו-Middleware
// ----------------------------------------------------

// הגדרת EJS כמנוע תצוגה
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ניתוח גוף בקשות (Form data)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// **הגשת קבצים סטטיים מהתיקייה public** (ל-style.css)
app.use(express.static('public'));

// הגדרת סשן (חובה לאימות משתמשים)
app.use(session({
    // **יש לשנות למחרוזת סודית חזקה!**
    secret: 'YOUR_SESSION_SECRET_KEY_HERE', 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 שעות
}));


// ----------------------------------------------------
// 4. פונקציות Middleware לאימות
// ----------------------------------------------------

// בודק אם המשתמש מחובר
const checkAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

// בודק תפקיד ספציפי (למשל, 'admin')
const checkRole = (role) => (req, res, next) => {
    if (req.session.role === role) {
        next();
    } else {
        res.status(403).send('Forbidden: Access denied.');
    }
};

// ----------------------------------------------------
// 5. ניתוב (Routes)
// ----------------------------------------------------

// עמוד הבית (Dashboard)
app.get('/', checkAuth, async (req, res) => {
    const userRole = req.session.role;
    const userId = req.session.userId;
    const username = req.session.username;
    
    // שליפת נתונים רלוונטיים לפי תפקיד
    let data = { 
        username, 
        role: userRole, 
        announcements: await Announcement.find({}).sort({ date: -1 }).limit(5) 
    };

    try {
        if (userRole === 'student') {
            const student = await User.findById(userId);
            const enrolledClasses = await Class.find({ students: userId }).populate('teacher', 'username');
            
            let assignments = [];
            for (const c of enrolledClasses) {
                const classAssignments = await Assignment.find({ classId: c._id }).sort({ dueDate: 1 });
                assignments = assignments.concat(classAssignments);
            }

            data = { 
                ...data, 
                enrolledClasses, 
                assignments: assignments.sort((a, b) => a.dueDate - b.dueDate) 
            };

        } else if (userRole === 'teacher' || userRole === 'admin') {
            const classesTaught = await Class.find({ teacher: userId });
            data = { ...data, classesTaught };
        }
        
        res.render('dashboard', data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading dashboard');
    }
});

// -------------------
// ניתוב אימות (Auth)
// -------------------

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const user = new User({ username, password, role });
        await user.save();
        res.render('login', { message: 'הרשמה הצליחה! אנא התחבר/י.' });
    } catch (err) {
        let message = 'שגיאת הרשמה.';
        if (err.code === 11000) {
            message = 'שם המשתמש תפוס.';
        }
        res.render('register', { message });
    }
});

app.get('/login', (req, res) => {
    res.render('login', { message: '' });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user._id;
            req.session.username = user.username;
            req.session.role = user.role;
            res.redirect('/');
        } else {
            res.render('login', { message: 'שם משתמש או סיסמה שגויים.' });
        }
    } catch (error) {
        res.status(500).send('שגיאת התחברות.');
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// ------------------------------------------------------------------
// ניתוב פעולות מנהל/מורה (Admin/Teacher Actions)
// ------------------------------------------------------------------

// יצירת משתמש על ידי אדמין
app.post('/create-user', checkAuth, checkRole('admin'), async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const user = new User({ username, password, role });
        await user.save();
        res.redirect('/');
    } catch (err) {
        res.send(`שגיאה ביצירת משתמש: ${err.message}`);
    }
});

// יצירת כיתה
app.post('/create-class', checkAuth, checkRole('teacher'), async (req, res) => {
    const { name, enrollmentKey } = req.body;
    try {
        const newClass = new Class({ name, teacher: req.session.userId, enrollmentKey });
        await newClass.save();
        res.redirect('/');
    } catch (err) {
        res.send(`שגיאה ביצירת כיתה: ${err.message}`);
    }
});

// יצירת משימה
app.post('/create-assignment', checkAuth, checkRole('teacher'), async (req, res) => {
    const { title, description, classId, dueDate } = req.body;
    try {
        const assignment = new Assignment({ title, description, classId, dueDate });
        await assignment.save();
        res.redirect('/');
    } catch (err) {
        res.send(`שגיאה ביצירת משימה: ${err.message}`);
    }
});

// יצירת הודעה
app.post('/create-announcement', checkAuth, checkRole('teacher'), async (req, res) => {
    const { title, content } = req.body;
    try {
        const announcement = new Announcement({ title, content });
        await announcement.save();
        res.redirect('/');
    } catch (err) {
        res.send(`שגיאה ביצירת הודעה: ${err.message}`);
    }
});

// ----------------------------------------------------
// ניתוב פעולות תלמיד (Student Actions)
// ----------------------------------------------------

// הרשמה לכיתה
app.post('/enroll', checkAuth, checkRole('student'), async (req, res) => {
    const { enrollmentKey } = req.body;
    const userId = req.session.userId;

    try {
        const targetClass = await Class.findOne({ enrollmentKey });

        if (!targetClass) {
            return res.send('מפתח הרשמה שגוי.');
        }

        if (targetClass.students.includes(userId)) {
            return res.send('את/ה כבר רשום/ה לכיתה זו.');
        }

        targetClass.students.push(userId);
        await targetClass.save();

        res.redirect('/');
    } catch (err) {
        res.status(500).send('שגיאה במהלך ההרשמה לכיתה.');
    }
});


// ----------------------------------------------------
// 6. הרצת השרת
// ----------------------------------------------------
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
