const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'teacher', 'student'],
        message: '{VALUE} is not a valid role',
      },
      required: [true, 'Role is required'],
      default: 'student',
    },
    department: {
      type: String,
      default: 'Information Technology',
      trim: true,
    },
    rollNo: {
      type: String,
      trim: true,
      default: null,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    designation: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1 });
userSchema.index({ classId: 1 });

module.exports = mongoose.model('User', userSchema);
