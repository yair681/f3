// public/scripts.js

const loadMainAnnouncements = async () => {
    const announcementsDiv = document.getElementById('mainAnnouncements');
    announcementsDiv.innerHTML = '<p>טוען הודעות...</p>';
    try {
        const response = await fetch('/api/announcements/main');
        const data = await response.json();

        if (response.ok && data.length > 0) {
            announcementsDiv.innerHTML = data.map(announcement => `
                <div class="announcement-item">
                    <h4>${announcement.title}</h4>
                    <p>${announcement.content}</p>
                    <small>פורסם על ידי: ${announcement.authorId.name} בתאריך: ${new Date(announcement.date).toLocaleDateString('he-IL')}</small>
                </div>
                <hr>
            `).join('');
        } else {
            announcementsDiv.innerHTML = '<p>אין הודעות ראשיות כרגע.</p>';
        }
    } catch (error) {
        announcementsDiv.innerHTML = '<p style="color:red;">שגיאה בטעינת הודעות.</p>';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const loginButton = document.getElementById('loginButton');
    const loginFormSection = document.getElementById('loginFormSection');
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    
    if (token) {
        window.location.href = 'dashboard.html'; 
        return;
    }

    loginButton.addEventListener('click', () => {
        loginFormSection.style.display = 'block';
        loginButton.style.display = 'none';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                window.location.href = 'dashboard.html'; 
            } else {
                loginMessage.textContent = data.message || "שגיאה בהתחברות";
            }
        } catch (error) {
            loginMessage.textContent = "שגיאת רשת. נסה שוב.";
        }
    });
    
    loadMainAnnouncements();
});