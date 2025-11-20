// public/dashboard.js

const token = localStorage.getItem('token');
const logoutButton = document.getElementById('logoutButton');
const createClassForm = document.getElementById('createClassForm');
const classMessage = document.getElementById('classMessage');
const changePasswordForm = document.getElementById('changePasswordForm');
const passwordMessage = document.getElementById('passwordMessage');
const postMainAnnouncementForm = document.getElementById('postMainAnnouncementForm');
const announcementMessage = document.getElementById('announcementMessage');
const studentTasksList = document.getElementById('studentTasksList');


if (!token) {
    window.location.href = 'index.html'; 
}

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

        return await response.json();

    } catch (error) {
        return null;
    }
};

// פונקציה לטעינת משימות לתלמיד
const loadStudentTasks = async (user) => {
    if (user.role !== 'student') return;
    
    studentTasksList.innerHTML = 'טוען משימות...';

    try {
        const response = await fetch('/api/assignments/my-tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tasks = await response.json();

        if (response.ok && tasks.length > 0) {
            studentTasksList.innerHTML = tasks.map(task => `
                <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
                    <h4>${task.title} (${task.classId.name}) - <span style="color:${task.hasSubmitted ? 'green' : 'red'};">${task.hasSubmitted ? 'הוגש' : 'טרם הוגש'}</span></h4>
                    <p>${task.description}</p>
                    <p>תאריך יעד: ${new Date(task.dueDate).toLocaleDateString('he-IL')}</p>
                    <button onclick="alert('יש ליישם כאן את טופס ההגשה')">בצע משימה</button>
                </div>
            `).join('');
        } else {
            studentTasksList.innerHTML = '<p>אין משימות פתוחות כרגע.</p>';
        }
    } catch (error) {
        studentTasksList.innerHTML = '<p style="color:red;">שגיאה בטעינת משימות.</p>';
    }
}


const renderDashboard = async () => {
    const userData = await fetchUserData();
    if (!userData) return; 

    const userRole = userData.role;
    document.getElementById('welcomeMessage').textContent = `ברוך הבא, ${userData.name} (${userRole === 'admin' ? 'מנהל מערכת' : userRole})!`;
    
    const classesList = userData.classes.map(c => `<li>${c.name}</li>`).join('');
    document.getElementById('userClassesList').innerHTML = classesList;

    if (userRole === 'admin') {
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('teacherPanel').style.display = 'block'; 
    } else if (userRole === 'teacher') {
        document.getElementById('teacherPanel').style.display = 'block';
    } else if (userRole === 'student') {
        document.getElementById('studentPanel').style.display = 'block';
        loadStudentTasks(userData);
    }
};

// --- לוגיקת טפסים ---

// 1. יצירת כיתה
if (createClassForm) {
    createClassForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const className = document.getElementById('className').value;

        try {
            const response = await fetch('/api/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: className })
            });

            const data = await response.json();
            classMessage.style.color = response.ok ? 'green' : 'red';
            classMessage.textContent = data.message || (response.ok ? 'נוצר בהצלחה!' : 'שגיאה');
            if (response.ok) { createClassForm.reset(); renderDashboard(); }

        } catch (error) {
            classMessage.textContent = 'שגיאת רשת.';
        }
    });
}

// 2. פרסום הודעה ראשית
if (postMainAnnouncementForm) {
    postMainAnnouncementForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('announcementTitle').value;
        const content = document.getElementById('announcementContent').value;

        try {
            const response = await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title, content, type: 'main' })
            });

            const data = await response.json();
            announcementMessage.style.color = response.ok ? 'green' : 'red';
            announcementMessage.textContent = data.message || (response.ok ? 'ההודעה פורסמה בהצלחה!' : 'שגיאה בפרסום');
            if (response.ok) postMainAnnouncementForm.reset();

        } catch (error) {
            announcementMessage.textContent = 'שגיאת רשת.';
        }
    });
}

// 3. שינוי סיסמה
if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;

        try {
            const response = await fetch('/api/users/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            const data = await response.json();
            passwordMessage.style.color = response.ok ? 'green' : 'red';
            passwordMessage.textContent = data.message || (response.ok ? 'הסיסמה שונתה בהצלחה!' : 'שגיאה בשינוי סיסמה');
            if (response.ok) changePasswordForm.reset();

        } catch (error) {
            passwordMessage.textContent = 'שגיאת רשת.';
        }
    });
}


// 4. התנתקות
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});

// התחלה
renderDashboard();