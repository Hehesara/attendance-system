const express = require('express');
const router = express.Router();
const {
  markAttendance,
  updateSession,
  getAttendanceHistory,
  getSession,
  getStudentAttendanceMe,
  getReports,
  getAdminOverview,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

// Student personal attendance metrics - Student only, identifies via JWT
router.get('/student/me', authorize('student'), getStudentAttendanceMe);

// Attendance reports - Admin & Teacher
router.get('/reports', authorize('admin', 'teacher'), getReports);

// Admin dashboard overview counts
router.get('/admin-overview', authorize('admin'), getAdminOverview);

// Attendance history - Teacher & Admin
router.get('/history', authorize('admin', 'teacher'), getAttendanceHistory);

// Mark / create attendance - Teacher & Admin
router.post('/', authorize('admin', 'teacher'), markAttendance);

// Single session view
router.get('/session/:id', getSession);

// Update existing attendance session - Teacher & Admin
router.put('/session/:id', authorize('admin', 'teacher'), updateSession);

module.exports = router;
