const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    minimumThreshold: {
      type: Number,
      required: [true, 'Minimum threshold is required'],
      default: 75,
      min: [50, 'Minimum threshold cannot be lower than 50%'],
      max: [100, 'Minimum threshold cannot exceed 100%'],
    },
    academicYear: {
      type: String,
      default: '2026-2027',
      trim: true,
    },
    semesterTerm: {
      type: String,
      default: 'Odd Semester (Term 1)',
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', settingSchema);
