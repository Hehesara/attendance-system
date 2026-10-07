const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Allocation = require('../models/Allocation');

// @desc    Get all users (with optional filters by role, classId)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const { role, classId } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (classId) filter.classId = classId;

    const users = await User.find(filter)
      .select('-password')
      .populate('classId', 'name department semester academicYear')
      .sort({ createdAt: -1 });

    // Format safe response with both id and _id
    const formatted = users.map((u) => ({
      id: u._id,
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      rollNo: u.rollNo,
      classId: u.classId?._id ? String(u.classId._id) : (u.classId ? String(u.classId) : null),
      className: u.classId?.name,
      designation: u.designation,
      createdAt: u.createdAt,
    }));

    return res.json({ success: true, count: formatted.length, users: formatted });
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
};

// @desc    Create a new user (Student, Teacher, or Admin)
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, rollNo, classId, designation } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and role are required',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check existing email
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A user with email ${cleanEmail} already exists`,
      });
    }

    // Initial password is required
    if (!password || String(password).trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Initial password is required (minimum 6 characters)',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password).trim(), salt);

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role,
      department: department || 'Information Technology',
      rollNo: role === 'student' ? (rollNo ? String(rollNo).trim() : null) : null,
      classId: role === 'student' && classId ? classId : null,
      designation: role === 'teacher' ? (designation || 'Assistant Professor') : null,
    });

    const populated = await User.findById(newUser._id)
      .select('-password')
      .populate('classId', 'name department semester academicYear');

    return res.status(201).json({
      success: true,
      message: `${role} created successfully`,
      user: {
        id: populated._id,
        _id: populated._id,
        name: populated.name,
        email: populated.email,
        role: populated.role,
        department: populated.department,
        rollNo: populated.rollNo,
        classId: populated.classId?._id || populated.classId,
        className: populated.classId?.name,
        designation: populated.designation,
      },
    });
  } catch (error) {
    console.error('createUser error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating user',
    });
  }
};

// @desc    Import students from CSV
// @route   POST /api/users/import-csv
// @access  Private/Admin
const importStudentsCSV = async (req, res) => {
  try {
    const { classId, students, initialPassword } = req.body;

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Target classId is required for student import',
      });
    }

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No student data provided',
      });
    }

    if (!initialPassword || String(initialPassword).trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Initial password for imported students is required (at least 6 characters)',
      });
    }

    const results = [];
    const errors = [];

    for (const item of students) {
      const rollNo = String(item.rollNo || item['Roll No'] || item.roll || '').trim();
      const name = String(item.name || item.Name || item['Student Name'] || '').trim();
      const email = String(
        item.email || item.Email || (rollNo ? `${rollNo.toLowerCase()}@college.edu` : '')
      ).trim().toLowerCase();

      if (!rollNo || !name || !email) {
        errors.push({ rollNo, name, error: 'Missing roll number, name, or email' });
        continue;
      }

      try {
        // Hash temporary password separately for each student
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(String(initialPassword).trim(), salt);

        // Check if student with this email exists
        let user = await User.findOne({ email });

        if (user) {
          // Update existing student's class and rollNo
          user.name = name;
          user.rollNo = rollNo;
          user.classId = classId;
          user.role = 'student';
          user.password = hashedPassword;
          await user.save();
          results.push(user);
        } else {
          // Create new student
          user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'student',
            rollNo,
            classId,
            department: item.department || 'Information Technology',
          });
          results.push(user);
        }
      } catch (err) {
        errors.push({ rollNo, name, email, error: err.message });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Successfully imported ${results.length} students. Students should change their password after their first login.`,
      importedCount: results.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('importStudentsCSV error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to import students',
      error: error.message,
    });
  }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, department, rollNo, classId, designation } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (department) user.department = department.trim();
    if (role) user.role = role;
    if (designation !== undefined) user.designation = designation;
    if (rollNo !== undefined) user.rollNo = rollNo;
    if (classId !== undefined) user.classId = classId || null;

    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password.trim(), salt);
    }

    await user.save();

    const updated = await User.findById(id)
      .select('-password')
      .populate('classId', 'name department semester academicYear');

    return res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: updated._id,
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        department: updated.department,
        rollNo: updated.rollNo,
        classId: updated.classId?._id || updated.classId,
        className: updated.classId?.name,
        designation: updated.designation,
      },
    });
  } catch (error) {
    console.error('updateUser error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating user',
    });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Clean up allocations if teacher is deleted
    if (user.role === 'teacher') {
      await Allocation.deleteMany({ teacherId: id });
    }

    await User.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: `User '${user.name}' deleted successfully`,
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting user' });
  }
};

// @desc    Reset password for a user (teacher or student)
// @route   POST /api/users/:id/reset-password
// @access  Private/Admin
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const tempPass = req.body.temporaryPassword || req.body.newPassword;

    if (!tempPass || String(tempPass).trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Temporary password is required and must be at least 6 characters long',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(String(tempPass).trim(), salt);
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset successfully. Give the temporary password to the user securely.',
    });
  } catch (error) {
    console.error('resetUserPassword error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error resetting password',
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  importStudentsCSV,
  updateUser,
  deleteUser,
  resetUserPassword,
};
