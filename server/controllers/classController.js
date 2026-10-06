const Class = require('../models/Class');
const User = require('../models/User');
const Allocation = require('../models/Allocation');
const AttendanceSession = require('../models/AttendanceSession');

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private (All authenticated roles)
const getClasses = async (req, res) => {
  try {
    const classes = await Class.find().sort({ name: 1 });
    const formatted = classes.map((c) => ({
      id: c._id,
      _id: c._id,
      name: c.name,
      department: c.department,
      semester: c.semester,
      academicYear: c.academicYear,
      createdAt: c.createdAt,
    }));
    return res.json({ success: true, count: formatted.length, classes: formatted });
  } catch (error) {
    console.error('getClasses error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching classes' });
  }
};

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private/Admin
const createClass = async (req, res) => {
  try {
    const { name, department, semester, academicYear } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Class name is required' });
    }

    const cleanName = name.trim();
    const existing = await Class.findOne({ name: cleanName });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Class '${cleanName}' already exists`,
      });
    }

    const newClass = await Class.create({
      name: cleanName,
      department: department || 'Information Technology',
      semester: Number(semester) || 5,
      academicYear: academicYear || '2026-2027',
    });

    return res.status(201).json({
      success: true,
      message: 'Class created successfully',
      class: {
        id: newClass._id,
        _id: newClass._id,
        name: newClass.name,
        department: newClass.department,
        semester: newClass.semester,
        academicYear: newClass.academicYear,
      },
    });
  } catch (error) {
    console.error('createClass error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a class
// @route   PUT /api/classes/:id
// @access  Private/Admin
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, semester, academicYear } = req.body;

    const cls = await Class.findById(id);
    if (!cls) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (name) cls.name = name.trim();
    if (department) cls.department = department.trim();
    if (semester !== undefined) cls.semester = Number(semester);
    if (academicYear) cls.academicYear = academicYear.trim();

    await cls.save();

    return res.json({
      success: true,
      message: 'Class updated successfully',
      class: {
        id: cls._id,
        _id: cls._id,
        name: cls.name,
        department: cls.department,
        semester: cls.semester,
        academicYear: cls.academicYear,
      },
    });
  } catch (error) {
    console.error('updateClass error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private/Admin
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const cls = await Class.findById(id);
    if (!cls) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Cascade delete allocations, sessions, and unlink students
    await Allocation.deleteMany({ classId: id });
    await AttendanceSession.deleteMany({ classId: id });
    await User.updateMany({ classId: id }, { $set: { classId: null } });
    await Class.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: `Class '${cls.name}' and associated allocations deleted successfully`,
    });
  } catch (error) {
    console.error('deleteClass error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting class' });
  }
};

// @desc    Get all students of a specific class
// @route   GET /api/classes/:id/students
// @access  Private (Admin & Teachers)
const getClassStudents = async (req, res) => {
  try {
    const { id } = req.params;

    const students = await User.find({ role: 'student', classId: id })
      .select('-password')
      .sort({ rollNo: 1 });

    const formatted = students.map((s) => ({
      id: s._id,
      _id: s._id,
      name: s.name,
      email: s.email,
      rollNo: s.rollNo,
      department: s.department,
      classId: s.classId,
    }));

    return res.json({
      success: true,
      count: formatted.length,
      students: formatted,
    });
  } catch (error) {
    console.error('getClassStudents error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching class students' });
  }
};

module.exports = {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getClassStudents,
};
