const express = require('express');
const router = express.Router();
const {
  getAllocations,
  getMyAllocations,
  createAllocation,
  deleteAllocation,
} = require('../controllers/allocationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getAllocations);
router.get('/my-classes', authorize('teacher'), getMyAllocations);

// Admin only
router.post('/', authorize('admin'), createAllocation);
router.delete('/:id', authorize('admin'), deleteAllocation);

module.exports = router;
