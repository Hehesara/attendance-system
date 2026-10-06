const Setting = require('../models/Setting');

// @desc    Get current system settings
// @route   GET /api/settings
// @access  Private (All authenticated roles)
const getSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne().sort({ createdAt: -1 });

    if (!setting) {
      setting = await Setting.create({
        minimumThreshold: 75,
        academicYear: '2026-2027',
        semesterTerm: 'Odd Semester (Term 1)',
        updatedBy: req.user?._id || null,
      });
    }

    return res.json({
      success: true,
      settings: {
        id: setting._id,
        _id: setting._id,
        minimumThreshold: setting.minimumThreshold,
        academicYear: setting.academicYear,
        semesterTerm: setting.semesterTerm,
        updatedAt: setting.updatedAt,
      },
    });
  } catch (error) {
    console.error('getSettings error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching settings' });
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
  try {
    const { minimumThreshold, academicYear, semesterTerm } = req.body;

    let setting = await Setting.findOne().sort({ createdAt: -1 });

    if (!setting) {
      setting = new Setting();
    }

    if (minimumThreshold !== undefined) {
      const val = Number(minimumThreshold);
      if (isNaN(val) || val < 50 || val > 100) {
        return res.status(400).json({
          success: false,
          message: 'Minimum threshold must be a number between 50 and 100',
        });
      }
      setting.minimumThreshold = val;
    }

    if (academicYear) setting.academicYear = academicYear.trim();
    if (semesterTerm) setting.semesterTerm = semesterTerm.trim();
    setting.updatedBy = req.user._id;

    await setting.save();

    return res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        id: setting._id,
        _id: setting._id,
        minimumThreshold: setting.minimumThreshold,
        academicYear: setting.academicYear,
        semesterTerm: setting.semesterTerm,
        updatedAt: setting.updatedAt,
      },
    });
  } catch (error) {
    console.error('updateSettings error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
