// public/dashboard.js

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'index.html';
}

// משתני DOM
const welcomeMessage = document.getElementById('welcomeMessage');
const logoutBtn = document.getElementById('logoutBtn');
const studentPanel = document.getElementById('studentPanel');
const teacherPanel = document.getElementById('teacherPanel');
const adminPanel = document.getElementById('adminPanel');

// משתנים לפאנל מורה
const createClassForm = document.getElementById('createClassForm');
const createClassMessage = document.getElementById('createClassMessage');
const createAnnouncementForm = document.getElementById('createAnnouncementForm');
const announcementClassId = document.getElementById('announcementClassId');
const announcementMessage = document.getElementById('announcementMessage');
const teacherClassesList = document.getElementById('teacherClassesList');

// משתנים לניהול רישום
const classSelect = document.getElementById('classSelect');
const enrollmentManagement = document.getElementById('enrollmentManagement');
const studentsToAddSelect = document.getElementById('studentsToAddSelect');
const addStudentBtn = document.getElementById('addStudentBtn');
const enrolledStudentsList = document.getElementById('enrolledStudentsList');
const enrolledCount = document.getElementById('enrolledCount');
const addStudentMessage = document.getElementById('addStudentMessage');

// משתנים לפאנל מנהל
const createUserForm = document.getElementById('createUserForm');
const createUserMessage = document.getElementById('createUserMessage');
const usersListContainer = document.getElementById('usersListContainer');

// משתנים כלליים
let allUsers = []; // משתנה גלובלי לניהול רישום
let currentSelectedClassId = null;

// ==========================================================
// פונקציות בסיס
// ==========================================================

const fetchUserData = async () => {
    try {
        const response = await fetch('/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
            return null;
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Error fetching user data:', error);
        localStorage.removeItem('token');
        window.location.href = 'index.html';
        return null;
    }
};

const fetchAnnouncements = async () => {
    try {
        const response = await fetch('/api/announcements', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        return [];
    }
};

const renderAnnouncements = (announcements) => {
    const list = document.getElementById('announcementsList');
    if (announcements.length === 0) {
        list.innerHTML = '<p>אין הודעות חדשות.</p>';
        return;
    }

    list.innerHTML = announcements.map(ann => `
        <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
            <h4>${ann.title} ${ann.classId ? `(כיתה: ${ann.classId.name})` : '(כללי)'}</h4>
            <p>${ann.content}</p>
            <small>פורסם: ${new Date(ann.createdAt).toLocaleDateString('he-IL')}</small>
        </div>
    `).join('');
};

// ==========================================================
// פונקציות פאנל מנהל (Admin)
// ==========================================================

const fetchAllUsers = async () => {
    try {
        const response = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            usersListContainer.innerHTML = '<p style="color:red;">שגיאה בטעינת רשימת משתמשים. ייתכן שאין הרשאה.</p>';
            return [];
        }

        return await response.json();

    } catch (error) {
        usersListContainer.innerHTML = '<p style="color:red;">שגיאת רשת בטעינת משתמשים.</p>';
        return [];
    }
};

const renderUsersTable = (users) => {
    if (users.length === 0) {
        usersListContainer.innerHTML = '<p>לא נמצאו משתמשים.</p>';
        return;
    }
    
    // שמירת כל המשתמשים גלובלית לשימוש בניהול רישום
    allUsers = users; 

    const tableHTML = `
        <table border="1" width="100%" style="text-align: right;">
            <thead>
                <tr>
                    <th>שם</th>
                    <th>אימייל</th>
                    <th>תפקיד</th>
                    <th>מוגן?</th>
                    <th>פעולות</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td>${user.isProtected ? '✅' : '❌'}</td>
                        <td>
                            ${!user.isProtected 
                                ? `<button onclick="deleteUser('${user._id}')">מחק</button>`
                                : 'משתמש מוגן'
                            }
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    usersListContainer.innerHTML = tableHTML;
};

window.deleteUser = async (userId) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) return;
    
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        alert(data.message);
        
        await renderAdminPanel(); 

    } catch (error) {
        alert('שגיאת רשת במחיקה.');
    }
};


const renderAdminPanel = async () => {
    const users = await fetchAllUsers();
    renderUsersTable(users);
}

if (createUserForm) {
    createUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('newUserName').value;
        const email = document.getElementById('newUserEmail').value;
        const password = document.getElementById('newUserPassword').value;
        const role = document.getElementById('newUserRole').value;

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await response.json();
            createUserMessage.style.color = response.ok ? 'green' : 'red';
            createUserMessage.textContent = data.message || (response.ok ? 'המשתמש נוצר בהצלחה!' : 'שגיאה ביצירת משתמש');
            
            if (response.ok) { 
                createUserForm.reset(); 
                await renderAdminPanel(); 
                // רענון גם של פאנל המורה אם פתוח, כדי לעדכן רשימות רישום
                await fetchUsersForEnrollment();
                if(currentSelectedClassId) {
                    await loadEnrollmentData(currentSelectedClassId);
                }
            }

        } catch (error) {
            createUserMessage.textContent = 'שגיאת רשת.';
        }
    });
}


// ==========================================================
// פונקציות פאנל מורה (Teacher) - ניהול רישום
// ==========================================================

// חדש: שליפת פרטי כיתה מלאים
const fetchClassDetails = async (classId) => {
    try {
        const response = await fetch(`/api/classes/${classId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch class details');
        return await response.json();
    } catch (error) {
        console.error('Error fetching class details:', error);
        return null;
    }
}

// חדש: טעינת פרטי כיתה ורישום רשימות
const loadEnrollmentData = async (classId) => {
    currentSelectedClassId = classId;
    addStudentBtn.disabled = true;
    enrollmentManagement.style.display = 'none';
    addStudentMessage.textContent = ''; // איפוס הודעות

    if (classId === "") {
        return;
    }

    // 1. קבלת פרטי הכיתה
    const classDetails = await fetchClassDetails(classId);
    if (!classDetails) return;

    // 2. מיפוי סטודנטים רשומים
    const enrolledIds = classDetails.students.map(s => s._id);
    const enrolledStudents = allUsers.filter(user => enrolledIds.includes(user._id));
    
    // 3. מיפוי סטודנטים פוטנציאליים (תלמידים שאינם רשומים)
    const potentialStudents = allUsers.filter(user => 
        user.role === 'student' && !enrolledIds.includes(user._id)
    );

    // 4. רינדור רשימת התלמידים הרשומים
    enrolledCount.textContent = enrolledStudents.length;
    enrolledStudentsList.innerHTML = enrolledStudents.length > 0
        ? enrolledStudents.map(student => `
        <div style="display:flex; justify-content: space-between; align-items: center; padding: 5px; border-bottom: 1px dotted #eee;">
            <span>${student.name}</span>
            <button onclick="updateEnrollment('remove', '${classId}', '${student._id}')" style="font-size: 0.8em; padding: 3px 6px;">הסר</button>
        </div>
    `).join('')
    : '<p style="text-align: center; color: #999;">אין תלמידים רשומים כרגע.</p>';


    // 5. רינדור רשימת התלמידים הפוטנציאליים להוספה
    studentsToAddSelect.innerHTML = potentialStudents.length > 0
        ? potentialStudents.map(student => 
            `<option value="${student._id}">${student.name} (${student.email})</option>`
          ).join('')
        : '<option value="">אין תלמידים להוספה</option>';

    enrollmentManagement.style.display = 'block';
    addStudentBtn.disabled = potentialStudents.length === 0;
}

// חדש: פונקציה להוספה/הסרה (PATCH)
window.updateEnrollment = async (action, classId, userId) => {
    const isRemove = action === 'remove';
    if (isRemove && !confirm('האם אתה בטוח שברצונך להסיר תלמיד זה מהכיתה?')) return;
    
    addStudentMessage.textContent = isRemove ? 'מסיר...' : 'מוסיף...';
    
    try {
        const response = await fetch(`/api/classes/${classId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ 
                studentId: userId,
                action: action // "add" או "remove"
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            addStudentMessage.style.color = 'green';
            addStudentMessage.textContent = isRemove ? 'התלמיד הוסר בהצלחה.' : 'התלמיד נוסף בהצלחה.';
        } else {
            addStudentMessage.style.color = 'red';
            addStudentMessage.textContent = data.message || 'שגיאה בעדכון הרישום.';
        }
        
        // רענון הרשימות לאחר העדכון
        await loadEnrollmentData(classId); 

    } catch (error) {
        addStudentMessage.style.color = 'red';
        addStudentMessage.textContent = 'שגיאת רשת בעדכון הרישום.';
    }
};


// ------------------------------------------------------------------
// פונקציות פאנל מורה (Teacher) - יצירת כיתה/הודעה
// ------------------------------------------------------------------

if (createClassForm) {
    createClassForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('className').value;

        try {
            const response = await fetch('/api/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name })
            });

            const data = await response.json();
            createClassMessage.style.color = response.ok ? 'green' : 'red';
            createClassMessage.textContent = data.message || (response.ok ? 'הכיתה נוצרה בהצלחה!' : 'שגיאה ביצירת כיתה');
            
            if (response.ok) {
                createClassForm.reset();
                // רענון הפאנל לאחר יצירה
                await renderDashboard(); 
            }

        } catch (error) {
            createClassMessage.textContent = 'שגיאת רשת.';
        }
    });
}

if (createAnnouncementForm) {
    createAnnouncementForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('announcementTitle').value;
        const content = document.getElementById('announcementContent').value;
        const classId = document.getElementById('announcementClassId').value;
        
        const body = { title, content, classId: classId === 'main' ? null : classId };

        try {
            const response = await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            announcementMessage.style.color = response.ok ? 'green' : 'red';
            announcementMessage.textContent = data.message || (response.ok ? 'ההודעה פורסמה בהצלחה!' : 'שגיאה בפרסום הודעה');
            
            if (response.ok) {
                createAnnouncementForm.reset();
            }

        } catch (error) {
            announcementMessage.textContent = 'שגיאת רשת.';
        }
    });
}

// ------------------------------------------------------------------
// טיפול באירועים לניהול רישום
// ------------------------------------------------------------------

if (classSelect) {
    classSelect.addEventListener('change', (e) => {
        loadEnrollmentData(e.target.value);
    });
}

if (addStudentBtn) {
    addStudentBtn.addEventListener('click', () => {
        const userId = studentsToAddSelect.value;
        if (userId && currentSelectedClassId) {
            updateEnrollment('add', currentSelectedClassId, userId);
        }
    });
}


// ==========================================================
// רינדור ראשי
// ==========================================================

const renderTeacherPanel = async (teacherClasses) => {
    // רינדור רשימת כיתות המורה
    teacherClassesList.innerHTML = teacherClasses.length > 0 
        ? teacherClasses.map(c => `<p>• ${c.name} (ID: ${c._id})</p>`).join('')
        : '<p>עדיין לא נוצרו כיתות.</p>';

    // רינדור כיתות בטופס פרסום הודעה
    announcementClassId.innerHTML = '<option value="main">הודעה ראשית (לכל המשתמשים)</option>' +
        teacherClasses.map(c => `<option value="${c._id}">${c.name}</option>`).join('');

    // רינדור רשימת הכיתות לניהול רישום
    classSelect.innerHTML = '<option value="">בחר כיתה...</option>' + 
        teacherClasses.map(c => `<option value="${c._id}">${c.name}</option>`).join('');

    // טעינת כל המשתמשים (לניהול רישום)
    await fetchAllUsers(); 
};


const renderDashboard = async () => {
    const userData = await fetchUserData();
    if (!userData) return; 

    const userRole = userData.role;
    const classes = userData.classes || [];

    welcomeMessage.textContent = `ברוך הבא, ${userData.name} (${userRole})!`;

    // 1. רינדור פאנלים לפי תפקיד
    studentPanel.style.display = 'block';

    if (userRole === 'teacher' || userRole === 'admin') {
        teacherPanel.style.display = 'block';
        await renderTeacherPanel(classes); 
    } else {
        teacherPanel.style.display = 'none';
    }

    if (userRole === 'admin') {
        adminPanel.style.display = 'block';
        await renderAdminPanel();
    } else {
        adminPanel.style.display = 'none';
    }

    // 2. רינדור נתוני תלמיד (לכל משתמש, כולל מורה/מנהל שיש להם גישה)
    const announcements = await fetchAnnouncements();
    renderAnnouncements(announcements);

    // רינדור כיתות תלמיד
    document.getElementById('studentClassesList').innerHTML = classes.length > 0 
        ? classes.map(c => `<p>• ${c.name}</p>`).join('')
        : '<p>לא רשום לכיתות כרגע.</p>';

    // (הערה: פונקציית טעינת המשימות עדיין לא מומשה ב-Backend, אך ה-Frontend מוכן)
    document.getElementById('assignmentsList').innerHTML = '<p>פונקציית המשימות תתווסף בהמשך.</p>';

};

// איתחול - קריאה לפונקציית הרינדור לאחר טעינת הדף
renderDashboard();

// טיפול בהתנתקות
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});
