// api/middleware/roles.js
const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: You do not have the required role." });
        }
        next();
    };
};

const ROLES = {
    Student: 'student',
    Teacher: 'teacher',
    Admin: 'admin'
};

module.exports = { authorize, ROLES };