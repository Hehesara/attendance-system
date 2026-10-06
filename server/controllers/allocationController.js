const Allocation = require('../models/Allocation');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const User = require('../models/User');

// @desc    Get all course allocations
// @route   GET /api/allocations
// @access  Private (Admin & Teachers)
const getAllocations = async (req, res) => {
  try {
    const allocations = await Allocation.find()
      .populate('classId', 'name department semester academicYear')
      .populate('subjectId', 'code name department semester')
      .populate('teacherId', 'name email department designation')
      .sort({ createdAt: -1 });

    const formatted = allocations.map((a) => ({
      id: a._id,
      _id: a._id,
      classId: a.classId?._id || a.classId,
      className: a.classId?.name,
      classDetails: a.classId,
      subjectId: a.subjectId?._id || a.subjectId,
      subjectCode: a.subjectId?.code,
      subjectName: a.subjectId?.name,
      subjectDetails: a.subjectId,
      teacherId: a.teacherId?._id || a.teacherId,
      teacherName: a.teacherId?.name,
      teacherEmail: a.teacherId?.email,
      teacherDetails: a.teacherId,
      createdAt: a.createdAt,
    }));

    return res.json({ success: true, count: formatted.length, allocations: formatted });
  } catch (error) {
    console.error('getAllocations error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching allocations' });
  }
};

// @desc    Get allocations assigned to the logged-in teacher
// @route   GET /api/allocations/my-classes
// @access  Private/Teacher
const getMyAllocations = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const allocations = await Allocation.find({ teacherId })
      .populate('classId', 'name department semester academicYear')
      .populate('subjectId', 'code name department semester')
      .sort({ createdAt: -1 });

    const formatted = allocations.map((a) => ({
      id: a._id,
      _id: a._id,
      classId: a.classId?._id || a.classId,
      className: a.classId?.name,
      classDetails: a.classId,
      subjectId: a.subjectId?._id || a.subjectId,
      subjectCode: a.subjectId?.code,
      subjectName: a.subjectId?.name,
      subjectDetails: a.subjectId,
      teacherId: a.teacherId,
    }));

    // Extract unique assigned classes
    const uniqueClassMap = new Map();
    allocations.forEach((a) => {
      if (a.classId && !uniqueClassMap.has(String(a.classId._id))) {
        uniqueClassMap.set(String(a.classId._id), {
          id: a.classId._id,
          _id: a.classId._id,
          name: a.classId.name,
          department: a.classId.department,
          semester: a.classId.semester,
          academicYear: a.classId.academicYear,
        });
      }
    });

    // Extract unique assigned subjects
    const uniqueSubjectMap = new Map();
    allocations.forEach((a) => {
      if (a.subjectId && !uniqueSubjectMap.has(String(a.subjectId._id))) {
        uniqueSubjectMap.set(String(a.subjectId._id), {
          id: a.subjectId._id,
          _id: a.subjectId._id,
          code: a.subjectId.code,
          name: a.subjectId.name,
          department: a.subjectId.department,
          semester: a.subjectId.semester,
        });
      }
    });

    return res.json({
      success: true,
      allocations: formatted,
      assignedClasses: Array.from(uniqueClassMap.values()),
      assignedSubjects: Array.from(uniqueSubjectMap.values()),
    });
  } catch (error) {
    console.error('getMyAllocations error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching teacher allocations' });
  }
};

// @desc    Assign subject and teacher to a class (create or update)
// @route   POST /api/allocations
// @access  Private/Admin
const createAllocation = async (req, res) => {
  try {
    const { classId, subjectId, teacherId } = req.body;

    if (!classId || !subjectId || !teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Class, Subject, and Teacher are all required for allocation',
      });
    }

    // Check if class, subject, teacher exist
    const [cls, sub, tea] = await Promise.all([
      Class.findById(classId),
      Subject.findById(subjectId),
      User.findOne({ _id: teacherId, role: 'teacher' }),
    ]);

    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    if (!sub) return res.status(404).json({ success: false, message: 'Subject not found' });
    if (!tea) return res.status(404).json({ success: false, message: 'Teacher not found' });

    // Check if allocation already exists for this class + subject
    let allocation = await Allocation.findOne({ classId, subjectId });

    if (allocation) {
      // Update existing allocation with new teacher
      allocation.teacherId = teacherId;
      await allocation.save();
    } else {
      // Create new allocation
      allocation = await Allocation.create({ classId, subjectId, teacherId });
    }

    const populated = await Allocation.findById(allocation._id)
      .populate('classId', 'name department semester academicYear')
      .populate('subjectId', 'code name department semester')
      .populate('teacherId', 'name email department designation');

    return res.status(201).json({
      success: true,
      message: 'Course successfully allocated to faculty',
      allocation: {
        id: populated._id,
        _id: populated._id,
        classId: populated.classId?._id || populated.classId,
        className: populated.classId?.name,
        subjectId: populated.subjectId?._id || populated.subjectId,
        subjectCode: populated.subjectId?.code,
        subjectName: populated.subjectId?.name,
        teacherId: populated.teacherId?._id || populated.teacherId,
        teacherName: populated.teacherId?.name,
      },
    });
  } catch (error) {
    console.error('createAllocation error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete allocation
// @route   DELETE /api/allocations/:id
// @access  Private/Admin
const deleteAllocation = async (req, res) => {
  try {
    const { id } = req.params;

    const allocation = await Allocation.findById(id);
    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    await Allocation.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Allocation deleted successfully',
    });
  } catch (error) {
    console.error('deleteAllocation error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting allocation' });
  }
};

module.exports = {
  getAllocations,
  getMyAllocations,
  createAllocation,
  deleteAllocation,
};
