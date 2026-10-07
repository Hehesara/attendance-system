const AttendanceSession = require('../models/AttendanceSession');
const Allocation = require('../models/Allocation');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Setting = require('../models/Setting');

// Helper to get active threshold
const getActiveThreshold = async () => {
  const setting = await Setting.findOne().sort({ createdAt: -1 });
  return setting ? setting.minimumThreshold : 75;
};

// @desc    Mark / save attendance session
// @route   POST /api/attendance
// @access  Private (Teacher & Admin)
const markAttendance = async (req, res) => {
  try {
    const { classId, subjectId, date, records, sessionId } = req.body;

    if (!classId || !subjectId || !date || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'classId, subjectId, date, and records array are required',
      });
    }

    // Role check: Teachers can only mark attendance for assigned classes & subjects
    if (req.user.role === 'teacher') {
      const allocation = await Allocation.findOne({
        classId,
        subjectId,
        teacherId: req.user._id,
      });

      if (!allocation) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not assigned to teach this subject in this class',
        });
      }
    }

    let session;

    if (sessionId) {
      // Update specific session
      session = await AttendanceSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({ success: false, message: 'Attendance session not found' });
      }
      session.records = records;
      session.teacherId = req.user._id;
      session.date = date;
      await session.save();
    } else {
      // Create new session (Multiple sessions allowed on the same date for the same class+subject!)
      session = await AttendanceSession.create({
        classId,
        subjectId,
        teacherId: req.user._id,
        date,
        records,
      });
    }

    const populated = await AttendanceSession.findById(session._id)
      .populate('classId', 'name department semester')
      .populate('subjectId', 'code name')
      .populate('teacherId', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Attendance saved successfully',
      session: {
        id: populated._id,
        _id: populated._id,
        classId: populated.classId?._id || populated.classId,
        className: populated.classId?.name,
        subjectId: populated.subjectId?._id || populated.subjectId,
        subjectCode: populated.subjectId?.code,
        subjectName: populated.subjectId?.name,
        teacherId: populated.teacherId?._id || populated.teacherId,
        teacherName: populated.teacherId?.name,
        date: populated.date,
        records: populated.records,
        createdAt: populated.createdAt,
      },
    });
  } catch (error) {
    console.error('markAttendance error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an existing attendance session
// @route   PUT /api/attendance/session/:id
// @access  Private (Teacher & Admin)
const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { records, date } = req.body;

    const session = await AttendanceSession.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // If teacher, must own this session or be assigned
    if (req.user.role === 'teacher' && String(session.teacherId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only edit attendance sessions you conducted',
      });
    }

    if (records) session.records = records;
    if (date) session.date = date;

    await session.save();

    const populated = await AttendanceSession.findById(id)
      .populate('classId', 'name')
      .populate('subjectId', 'code name')
      .populate('teacherId', 'name');

    return res.json({
      success: true,
      message: 'Attendance session updated successfully',
      session: {
        id: populated._id,
        _id: populated._id,
        classId: populated.classId?._id,
        className: populated.classId?.name,
        subjectId: populated.subjectId?._id,
        subjectCode: populated.subjectId?.code,
        subjectName: populated.subjectId?.name,
        teacherId: populated.teacherId?._id,
        teacherName: populated.teacherId?.name,
        date: populated.date,
        records: populated.records,
      },
    });
  } catch (error) {
    console.error('updateSession error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance history
// @route   GET /api/attendance/history
// @access  Private (Teacher & Admin)
const getAttendanceHistory = async (req, res) => {
  try {
    const { classId, subjectId, date } = req.query;
    const filter = {};

    // If teacher, only return sessions for their assigned classes or conducted by them
    if (req.user.role === 'teacher') {
      filter.teacherId = req.user._id;
    }

    if (classId) filter.classId = classId;
    if (subjectId) filter.subjectId = subjectId;
    if (date) filter.date = date;

    const sessions = await AttendanceSession.find(filter)
      .populate('classId', 'name department semester')
      .populate('subjectId', 'code name')
      .populate('teacherId', 'name email')
      .sort({ date: -1, createdAt: -1 });

    const formatted = sessions.map((s) => {
      const totalStudents = s.records.length;
      const presentCount = s.records.filter((r) => r.status === 'Present').length;
      const absentCount = totalStudents - presentCount;
      const percentage = totalStudents > 0 ? Number(((presentCount / totalStudents) * 100).toFixed(1)) : 0;

      return {
        id: s._id,
        _id: s._id,
        classId: s.classId?._id || s.classId,
        className: s.classId?.name || 'Class',
        subjectId: s.subjectId?._id || s.subjectId,
        subjectCode: s.subjectId?.code || '',
        subjectName: s.subjectId?.name || 'Subject',
        teacherId: s.teacherId?._id || s.teacherId,
        teacherName: s.teacherId?.name || 'Teacher',
        date: s.date,
        records: s.records,
        totalStudents,
        presentCount,
        absentCount,
        percentage,
        createdAt: s.createdAt,
      };
    });

    return res.json({ success: true, count: formatted.length, sessions: formatted });
  } catch (error) {
    console.error('getAttendanceHistory error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching attendance history' });
  }
};

// @desc    Get single session details
// @route   GET /api/attendance/session/:id
// @access  Private
const getSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await AttendanceSession.findById(id)
      .populate('classId', 'name department semester')
      .populate('subjectId', 'code name')
      .populate('teacherId', 'name email');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    return res.json({
      success: true,
      session: {
        id: session._id,
        _id: session._id,
        classId: session.classId?._id,
        className: session.classId?.name,
        subjectId: session.subjectId?._id,
        subjectCode: session.subjectId?.code,
        subjectName: session.subjectId?.name,
        teacherId: session.teacherId?._id,
        teacherName: session.teacherId?.name,
        date: session.date,
        records: session.records,
      },
    });
  } catch (error) {
    console.error('getSession error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current student's personal attendance & analytics
// @route   GET /api/attendance/student/me
// @access  Private/Student
const getStudentAttendanceMe = async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
      .select('-password')
      .populate('classId', 'name department semester academicYear');

    if (!student || student.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied: not a student' });
    }

    const threshold = await getActiveThreshold();

    if (!student.classId) {
      return res.json({
        success: true,
        student,
        threshold,
        totalConductedAll: 0,
        totalAttendedAll: 0,
        totalMissedAll: 0,
        overallPercentage: 0,
        overallStatus: 'Safe',
        subjectMetrics: [],
        historyList: [],
        trendData: [],
        alerts: [],
      });
    }

    const classId = student.classId._id;

    // Get all allocations for this class
    const allocations = await Allocation.find({ classId })
      .populate('subjectId', 'code name department semester')
      .populate('teacherId', 'name email');

    // Get all attendance sessions conducted for this class
    const sessions = await AttendanceSession.find({ classId })
      .populate('subjectId', 'code name')
      .populate('teacherId', 'name')
      .sort({ date: -1 });

    let totalConductedAll = 0;
    let totalAttendedAll = 0;

    // Calculate per-subject metrics
    const subjectMetrics = allocations.map((alloc) => {
      const sub = alloc.subjectId;
      const teacher = alloc.teacherId;

      if (!sub) return null;

      const subSessions = sessions.filter(
        (sess) => String(sess.subjectId?._id || sess.subjectId) === String(sub._id)
      );

      const conducted = subSessions.length;
      let attended = 0;

      subSessions.forEach((sess) => {
        const rec = sess.records.find((r) => String(r.studentId) === String(student._id));
        if (rec && rec.status === 'Present') {
          attended += 1;
        }
      });

      const missed = conducted - attended;
      const percentage = conducted > 0 ? Number(((attended / conducted) * 100).toFixed(1)) : 0;

      totalConductedAll += conducted;
      totalAttendedAll += attended;

      // Margin calculations
      let marginType = 'safe';
      let marginCount = 0;
      let marginText = '';

      if (conducted === 0) {
        marginText = 'No sessions conducted yet';
      } else if (percentage >= threshold) {
        marginCount = Math.floor((attended - (threshold / 100) * conducted) / (threshold / 100));
        marginType = marginCount === 0 ? 'warning' : 'safe';
        marginText =
          marginCount === 0
            ? 'At threshold limit; cannot miss next class'
            : `${marginCount} class${marginCount > 1 ? 'es' : ''} can be skipped while maintaining ≥ ${threshold}%`;
      } else {
        marginCount = Math.ceil(((threshold / 100) * conducted - attended) / (1 - threshold / 100));
        marginType = 'danger';
        marginText = `Attend next ${marginCount} consecutive class${marginCount > 1 ? 'es' : ''} to reach ${threshold}%`;
      }

      return {
        id: sub._id,
        _id: sub._id,
        code: sub.code,
        name: sub.name,
        teacherName: teacher ? teacher.name : 'Faculty',
        conducted,
        attended,
        missed,
        percentage,
        marginType,
        marginCount,
        marginText,
      };
    }).filter(Boolean);

    const overallPercentage =
      totalConductedAll > 0
        ? Number(((totalAttendedAll / totalConductedAll) * 100).toFixed(1))
        : 0;

    let overallStatus = 'Safe';
    if (overallPercentage < threshold - 5) {
      overallStatus = 'Below Threshold';
    } else if (overallPercentage < threshold) {
      overallStatus = 'At Risk';
    } else if (overallPercentage < threshold + 3) {
      overallStatus = 'Borderline Safe';
    }

    // History list for this student
    const historyList = [];
    sessions.forEach((sess) => {
      const rec = sess.records.find((r) => String(r.studentId) === String(student._id));
      if (rec) {
        historyList.push({
          sessionId: sess._id,
          _id: sess._id,
          date: sess.date,
          subjectCode: sess.subjectId?.code || '',
          subjectName: sess.subjectId?.name || 'Subject',
          teacherName: sess.teacherId?.name || 'Faculty',
          status: rec.status,
        });
      }
    });

    historyList.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Trend Progression
    const chronological = [...historyList].sort((a, b) => new Date(a.date) - new Date(b.date));
    let cumAttended = 0;
    let cumConducted = 0;
    const trendData = chronological.map((item, index) => {
      cumConducted += 1;
      if (item.status === 'Present') cumAttended += 1;
      const pct = Number(((cumAttended / cumConducted) * 100).toFixed(1));
      return {
        date: item.date,
        label: `Class ${index + 1}`,
        percentage: pct,
        subject: item.subjectCode,
        status: item.status,
      };
    });

    // Dynamic Alerts
    const alerts = [];
    if (overallPercentage < threshold) {
      alerts.push({
        type: 'danger',
        title: 'Attendance Alert: Below Minimum Threshold',
        message: `Your aggregate attendance (${overallPercentage}%) has fallen below the required ${threshold}%. Please attend upcoming lectures to avoid being on the defaulters list.`,
      });
    } else if (overallPercentage < threshold + 3) {
      alerts.push({
        type: 'warning',
        title: 'Warning: Approaching Minimum Threshold',
        message: `Your overall attendance is ${overallPercentage}%, very close to ${threshold}%. Skipping upcoming classes may put you into defaulter status.`,
      });
    } else {
      alerts.push({
        type: 'success',
        title: 'Attendance is Safe',
        message: `Great job! Your overall attendance is ${overallPercentage}%, safely above the minimum requirement of ${threshold}%.`,
      });
    }

    subjectMetrics.forEach((sm) => {
      if (sm.percentage < threshold && sm.conducted > 0) {
        alerts.push({
          type: 'warning',
          title: `Low Attendance in ${sm.name}`,
          message: `Your attendance in ${sm.name} is ${sm.percentage}%. ${sm.marginText}.`,
        });
      }
    });

    return res.json({
      success: true,
      student: {
        id: student._id,
        _id: student._id,
        name: student.name,
        email: student.email,
        rollNo: student.rollNo,
        department: student.department,
        classId: student.classId?._id,
        className: student.classId?.name,
      },
      studentClass: student.classId,
      threshold,
      totalConductedAll,
      totalAttendedAll,
      totalMissedAll: totalConductedAll - totalAttendedAll,
      overallPercentage,
      overallStatus,
      subjectMetrics,
      historyList,
      trendData,
      alerts,
    });
  } catch (error) {
    console.error('getStudentAttendanceMe error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching student attendance' });
  }
};

// @desc    Get attendance reports for a class and optional subject
// @route   GET /api/attendance/reports
// @access  Private (Admin & Teacher)
const getReports = async (req, res) => {
  try {
    const { classId, subjectId } = req.query;

    if (!classId) {
      return res.status(400).json({ success: false, message: 'classId is required for reports' });
    }

    // Role check for teachers: verify they teach this class/subject
    if (req.user.role === 'teacher') {
      const allocFilter = { classId, teacherId: req.user._id };
      if (subjectId) allocFilter.subjectId = subjectId;

      const hasAlloc = await Allocation.findOne(allocFilter);
      if (!hasAlloc) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only view reports for classes and subjects assigned to you',
        });
      }
    }

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    const threshold = await getActiveThreshold();

    // Get all students enrolled in this class
    const students = await User.find({ role: 'student', classId })
      .select('-password')
      .sort({ rollNo: 1 });

    // Filter sessions
    const sessionFilter = { classId };
    if (subjectId) sessionFilter.subjectId = subjectId;

    const sessions = await AttendanceSession.find(sessionFilter);

    const studentReports = students.map((st) => {
      let attended = 0;
      let total = 0;

      sessions.forEach((sess) => {
        const rec = sess.records.find((r) => String(r.studentId) === String(st._id));
        if (rec) {
          total += 1;
          if (rec.status === 'Present') attended += 1;
        }
      });

      const percentage = total > 0 ? Number(((attended / total) * 100).toFixed(1)) : 0;
      const isDefaulter = percentage < threshold;

      return {
        id: st._id,
        _id: st._id,
        rollNo: st.rollNo,
        name: st.name,
        email: st.email,
        classId: cls._id,
        className: cls.name,
        totalSessions: total,
        attendedSessions: attended,
        percentage,
        status: isDefaulter ? 'Defaulter' : 'Regular',
      };
    });

    studentReports.sort((a, b) => Number(a.rollNo) - Number(b.rollNo));

    const totalStudents = studentReports.length;
    const defaultersCount = studentReports.filter((s) => s.status === 'Defaulter').length;
    const regularCount = totalStudents - defaultersCount;
    const avgAttendance =
      totalStudents > 0
        ? Number(
            (studentReports.reduce((acc, curr) => acc + curr.percentage, 0) / totalStudents).toFixed(1)
          )
        : 0;

    return res.json({
      success: true,
      cls: {
        id: cls._id,
        _id: cls._id,
        name: cls.name,
        department: cls.department,
        semester: cls.semester,
        academicYear: cls.academicYear,
      },
      subjectId,
      studentReports,
      totalStudents,
      defaultersCount,
      regularCount,
      avgAttendance,
      threshold,
    });
  } catch (error) {
    console.error('getReports error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating reports' });
  }
};

// @desc    Get Admin Overview statistics
// @route   GET /api/attendance/admin-overview
// @access  Private/Admin
const getAdminOverview = async (req, res) => {
  try {
    const threshold = await getActiveThreshold();

    const [totalStudents, totalTeachers, totalClasses, totalSubjects, totalSessions] =
      await Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'teacher' }),
        Class.countDocuments(),
        Subject.countDocuments(),
        AttendanceSession.countDocuments(),
      ]);

    // Calculate system-wide defaulter rate and average attendance
    const students = await User.find({ role: 'student' }).select('-password');
    const allSessions = await AttendanceSession.find();

    let defaultersCount = 0;
    let totalPctSum = 0;

    students.forEach((st) => {
      const studentSessions = allSessions.filter((s) => String(s.classId) === String(st.classId));
      let attended = 0;
      let total = 0;

      studentSessions.forEach((sess) => {
        const rec = sess.records.find((r) => String(r.studentId) === String(st._id));
        if (rec) {
          total += 1;
          if (rec.status === 'Present') attended += 1;
        }
      });

      const pct = total > 0 ? (attended / total) * 100 : 0;
      totalPctSum += pct;
      if (pct < threshold) {
        defaultersCount += 1;
      }
    });

    const averageAttendance =
      students.length > 0 ? Number((totalPctSum / students.length).toFixed(1)) : 0;

    return res.json({
      success: true,
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      totalSessions,
      defaultersCount,
      averageAttendance,
      threshold,
    });
  } catch (error) {
    console.error('getAdminOverview error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching admin overview' });
  }
};

module.exports = {
  markAttendance,
  updateSession,
  getAttendanceHistory,
  getSession,
  getStudentAttendanceMe,
  getReports,
  getAdminOverview,
};
