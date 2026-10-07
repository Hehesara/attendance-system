const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  importStudentsCSV,
  updateUser,
  deleteUser,
  resetUserPassword,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Protect all user routes
router.use(protect);

// Allow both admin and teacher to view users (e.g. teachers querying students, class rosters)
router.get('/', authorize('admin', 'teacher'), getUsers);

// Admin-only user management endpoints
router.post('/', authorize('admin'), createUser);
router.post('/import-csv', authorize('admin'), importStudentsCSV);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);
router.post('/:id/reset-password', authorize('admin'), resetUserPassword);

module.exports = router;
