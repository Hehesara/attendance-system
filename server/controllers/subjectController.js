const Subject = require('../models/Subject');
const Allocation = require('../models/Allocation');
const AttendanceSession = require('../models/AttendanceSession');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private (All authenticated roles)
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ code: 1 });
    const formatted = subjects.map((s) => ({
      id: s._id,
      _id: s._id,
      code: s.code,
      name: s.name,
      department: s.department,
      semester: s.semester,
      createdAt: s.createdAt,
    }));
    return res.json({ success: true, count: formatted.length, subjects: formatted });
  } catch (error) {
    console.error('getSubjects error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching subjects' });
  }
};

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private/Admin
const createSubject = async (req, res) => {
  try {
    const { code, name, department, semester } = req.body;

    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Subject code and name are required' });
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = await Subject.findOne({ code: cleanCode });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Subject with code '${cleanCode}' already exists`,
      });
    }

    const newSubject = await Subject.create({
      code: cleanCode,
      name: name.trim(),
      department: department || 'Information Technology',
      semester: Number(semester) || 5,
    });

    return res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      subject: {
        id: newSubject._id,
        _id: newSubject._id,
        code: newSubject.code,
        name: newSubject.name,
        department: newSubject.department,
        semester: newSubject.semester,
      },
    });
  } catch (error) {
    console.error('createSubject error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, department, semester } = req.body;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    if (code) subject.code = code.toUpperCase().trim();
    if (name) subject.name = name.trim();
    if (department) subject.department = department.trim();
    if (semester !== undefined) subject.semester = Number(semester);

    await subject.save();

    return res.json({
      success: true,
      message: 'Subject updated successfully',
      subject: {
        id: subject._id,
        _id: subject._id,
        code: subject.code,
        name: subject.name,
        department: subject.department,
        semester: subject.semester,
      },
    });
  } catch (error) {
    console.error('updateSubject error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    await Allocation.deleteMany({ subjectId: id });
    await AttendanceSession.deleteMany({ subjectId: id });
    await Subject.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: `Subject '${subject.name}' (${subject.code}) and related allocations deleted successfully`,
    });
  } catch (error) {
    console.error('deleteSubject error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting subject' });
  }
};

module.exports = {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
};
