const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: the same subject cannot be assigned twice to the same class
allocationSchema.index({ classId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('Allocation', allocationSchema);
