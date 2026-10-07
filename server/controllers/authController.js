const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Generate JWT helper
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, identifier, password, role } = req.body;
    const cleanIdentifier = String(email || identifier || '').trim();

    if (!cleanIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/roll number and password',
      });
    }

    // Search by email (case-insensitive) or rollNo
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier.toLowerCase() },
        { rollNo: cleanIdentifier },
      ],
    })
      .select('+password')
      .populate('classId', 'name department semester academicYear');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    // Optional role check validation if role was sent
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Account is registered as '${user.role}', but you attempted to login as '${role}'. Please switch to the ${user.role} tab.`,
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        rollNo: user.rollNo,
        classId: user.classId?._id || user.classId || null,
        className: user.classId?.name || null,
        designation: user.designation,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('classId', 'name department semester academicYear');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        rollNo: user.rollNo,
        classId: user.classId?._id || user.classId || null,
        className: user.classId?.name || null,
        designation: user.designation,
      },
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user profile',
    });
  }
};

// @desc    Change password for logged-in user
// @route   PUT /api/auth/change-password
// @access  Private (All authenticated roles)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match',
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('changePassword error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while changing password',
      error: error.message,
    });
  }
};

module.exports = {
  login,
  getMe,
  changePassword,
};
