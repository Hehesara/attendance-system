const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['Present', 'Absent'],
        message: '{VALUE} is not a valid attendance status',
      },
      default: 'Present',
      required: true,
    },
  },
  { _id: false }
);

const attendanceSessionSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher reference is required'],
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Session date is required (YYYY-MM-DD)'],
      trim: true,
      index: true,
    },
    records: [attendanceRecordSchema],
  },
  {
    timestamps: true,
  }
);

// Non-unique compound index for fast query performance across class, subject, and date
// Note: NOT unique because a class can have multiple sessions for the same subject on the same date
attendanceSessionSchema.index({ classId: 1, subjectId: 1, date: 1 });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
