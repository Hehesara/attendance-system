const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  importStudentsCSV,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All user management routes require admin role
router.use(protect, authorize('admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.post('/import-csv', importStudentsCSV);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
