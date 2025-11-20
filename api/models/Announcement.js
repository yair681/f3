// ייבוא Express ליצירת נתיבים (Routes)
const express = require('express');

// ייבוא קובץ ה-Controller שמכיל את הלוגיקה העסקית.
// בהנחה שקובץ ה-Controller נמצא בתיקיית 'controllers' שהיא אח של תיקיית 'routes'
const announcementController = require('../controllers/announcementController'); 

// יצירת מופע של ה-Router של Express
const router = express.Router();

/**
 * @swagger
 * tags:
 * name: Announcements
 * description: ניהול הודעות והכרזות
 */

// ----------------------------------------------------
// נתיבי CRUD עבור הכרזות (Announcements)
// ----------------------------------------------------

/**
 * @swagger
 * /api/announcements:
 * get:
 * summary: מקבל את כל ההכרזות
 * tags: [Announcements]
 * responses:
 * 200:
 * description: רשימה של כל ההכרזות
 * 500:
 * description: שגיאת שרת פנימית
 */
router.get('/', announcementController.getAllAnnouncements);

/**
 * @swagger
 * /api/announcements/{id}:
 * get:
 * summary: מקבל הכרזה ספציפית לפי מזהה
 * tags: [Announcements]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * description: מזהה ההכרזה
 * schema:
 * type: string
 * responses:
 * 200:
 * description: פרטי ההכרזה
 * 404:
 * description: הכרזה לא נמצאה
 */
router.get('/:id', announcementController.getAnnouncementById);

/**
 * @swagger
 * /api/announcements:
 * post:
 * summary: יוצר הכרזה חדשה
 * tags: [Announcements]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * title:
 * type: string
 * content:
 * type: string
 * responses:
 * 201:
 * description: ההכרזה נוצרה בהצלחה
 * 400:
 * description: בקשה לא תקינה
 */
router.post('/', announcementController.createAnnouncement);

/**
 * @swagger
 * /api/announcements/{id}:
 * put:
 * summary: מעדכן הכרזה קיימת
 * tags: [Announcements]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * description: מזהה ההכרזה
 * schema:
 * type: string
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * title:
 * type: string
 * content:
 * type: string
 * responses:
 * 200:
 * description: ההכרזה עודכנה בהצלחה
 * 404:
 * description: הכרזה לא נמצאה
 */
router.put('/:id', announcementController.updateAnnouncement);

/**
 * @swagger
 * /api/announcements/{id}:
 * delete:
 * summary: מוחק הכרזה
 * tags: [Announcements]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * description: מזהה ההכרזה למחיקה
 * schema:
 * type: string
 * responses:
 * 204:
 * description: ההכרזה נמחקה בהצלחה
 * 404:
 * description: הכרזה לא נמצאה
 */
router.delete('/:id', announcementController.deleteAnnouncement);

// ייצוא ה-Router כך שיוכל להיות מיושם ב-server.js
module.exports = router;
