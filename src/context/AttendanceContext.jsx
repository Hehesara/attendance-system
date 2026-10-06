import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  authApi,
  usersApi,
  classesApi,
  subjectsApi,
  allocationsApi,
  attendanceApi,
  settingsApi,
} from '../services/api';

const AttendanceContext = createContext(null);

export function AttendanceProvider({ children }) {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [settings, setSettings] = useState({
    minimumThreshold: 75,
    academicYear: '2026-2027',
    semesterTerm: 'Odd Semester (Term 1)',
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [studentPersonalData, setStudentPersonalData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all domain data based on logged in role
  const refreshData = useCallback(async (user) => {
    if (!user) return;

    try {
      // Common data for all roles
      const [classRes, subjectRes, settingRes] = await Promise.all([
        classesApi.getClasses().catch(() => ({ data: { classes: [] } })),
        subjectsApi.getSubjects().catch(() => ({ data: { subjects: [] } })),
        settingsApi.getSettings().catch(() => ({ data: { settings: { minimumThreshold: 75 } } })),
      ]);

      setClasses(classRes.data?.classes || []);
      setSubjects(subjectRes.data?.subjects || []);
      if (settingRes.data?.settings) {
        setSettings(settingRes.data.settings);
      }

      if (user.role === 'admin') {
        const [teaRes, stuRes, allocRes, sessRes] = await Promise.all([
          usersApi.getUsers({ role: 'teacher' }).catch(() => ({ data: { users: [] } })),
          usersApi.getUsers({ role: 'student' }).catch(() => ({ data: { users: [] } })),
          allocationsApi.getAllocations().catch(() => ({ data: { allocations: [] } })),
          attendanceApi.getHistory().catch(() => ({ data: { sessions: [] } })),
        ]);

        setTeachers(teaRes.data?.users || []);
        setStudents(stuRes.data?.users || []);
        setAssignments(allocRes.data?.allocations || []);
        setAttendanceSessions(sessRes.data?.sessions || []);
      } else if (user.role === 'teacher') {
        const [stuRes, myAllocRes, sessRes, teaRes] = await Promise.all([
          usersApi.getUsers({ role: 'student' }).catch(() => ({ data: { users: [] } })),
          allocationsApi.getMyClasses().catch(() => ({ data: { allocations: [] } })),
          attendanceApi.getHistory().catch(() => ({ data: { sessions: [] } })),
          usersApi.getUsers({ role: 'teacher' }).catch(() => ({ data: { users: [] } })),
        ]);

        setStudents(stuRes.data?.users || []);
        setAssignments(myAllocRes.data?.allocations || []);
        setAttendanceSessions(sessRes.data?.sessions || []);
        setTeachers(teaRes.data?.users || [user]);
      } else if (user.role === 'student') {
        const studentMeRes = await attendanceApi.getStudentMe().catch(() => null);
        if (studentMeRes?.data?.success) {
          setStudentPersonalData(studentMeRes.data);
          if (studentMeRes.data.threshold) {
            setSettings((prev) => ({ ...prev, minimumThreshold: studentMeRes.data.threshold }));
          }
        }
      }
    } catch (err) {
      console.error('Error refreshing attendance system data:', err);
    }
  }, []);

  // Restore session from token on initial app load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('attendtrack_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (res.data?.success && res.data.user) {
          setCurrentUser(res.data.user);
          await refreshData(res.data.user);
        } else {
          localStorage.removeItem('attendtrack_token');
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn('Session expired or invalid token:', err?.response?.data?.message || err.message);
        localStorage.removeItem('attendtrack_token');
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [refreshData]);

  // Authentication Helpers
  const login = async (roleOrCredentials, userOverride = null) => {
    // 1. Direct user override if supplied
    if (userOverride?.token && userOverride?.user) {
      localStorage.setItem('attendtrack_token', userOverride.token);
      setCurrentUser(userOverride.user);
      await refreshData(userOverride.user);
      return userOverride.user;
    }

    // 2. Object with email & password passed
    if (typeof roleOrCredentials === 'object' && roleOrCredentials.email) {
      const res = await authApi.login(roleOrCredentials);
      if (res.data?.success) {
        localStorage.setItem('attendtrack_token', res.data.token);
        setCurrentUser(res.data.user);
        await refreshData(res.data.user);
        return res.data.user;
      }
      throw new Error(res.data?.message || 'Login failed');
    }

    // 3. Role name string passed (e.g. from quick persona switcher)
    const roleKey = typeof roleOrCredentials === 'string' ? roleOrCredentials : 'admin';
    let creds = { email: 'admin@college.edu', password: 'admin123', role: 'admin' };

    if (roleKey === 'teacher' || roleKey === 'teacherSharma') {
      creds = { email: 'sharma@college.edu', password: 'teacher123', role: 'teacher' };
    } else if (roleKey === 'teacherMehta') {
      creds = { email: 'mehta@college.edu', password: 'teacher123', role: 'teacher' };
    } else if (roleKey === 'student' || roleKey === 'studentAlex') {
      creds = { email: '101', password: '101', role: 'student' };
    } else if (roleKey === 'studentRohan') {
      creds = { email: '102', password: '102', role: 'student' };
    }

    const res = await authApi.login(creds);
    if (res.data?.success) {
      localStorage.setItem('attendtrack_token', res.data.token);
      setCurrentUser(res.data.user);
      await refreshData(res.data.user);
      return res.data.user;
    }
  };

  const logout = () => {
    localStorage.removeItem('attendtrack_token');
    localStorage.removeItem('attendtrack_user');
    setCurrentUser(null);
    setStudentPersonalData(null);
  };

  // Class Management CRUD
  const addClass = async (classData) => {
    try {
      const res = await classesApi.createClass(classData);
      const created = res.data.class;
      setClasses((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error('Failed to create class:', err);
      throw err;
    }
  };

  const updateClass = async (id, updatedData) => {
    try {
      const res = await classesApi.updateClass(id, updatedData);
      const updated = res.data.class;
      setClasses((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    } catch (err) {
      console.error('Failed to update class:', err);
      throw err;
    }
  };

  const deleteClass = async (id) => {
    try {
      await classesApi.deleteClass(id);
      setClasses((prev) => prev.filter((c) => c.id !== id));
      setAssignments((prev) => prev.filter((a) => a.classId !== id));
      setStudents((prev) => prev.filter((s) => s.classId !== id));
      setAttendanceSessions((prev) => prev.filter((sess) => sess.classId !== id));
    } catch (err) {
      console.error('Failed to delete class:', err);
      throw err;
    }
  };

  // Subject Management CRUD
  const addSubject = async (subjectData) => {
    try {
      const res = await subjectsApi.createSubject(subjectData);
      const created = res.data.subject;
      setSubjects((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error('Failed to create subject:', err);
      throw err;
    }
  };

  const updateSubject = async (id, updatedData) => {
    try {
      const res = await subjectsApi.updateSubject(id, updatedData);
      const updated = res.data.subject;
      setSubjects((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return updated;
    } catch (err) {
      console.error('Failed to update subject:', err);
      throw err;
    }
  };

  const deleteSubject = async (id) => {
    try {
      await subjectsApi.deleteSubject(id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      setAssignments((prev) => prev.filter((a) => a.subjectId !== id));
      setAttendanceSessions((prev) => prev.filter((sess) => sess.subjectId !== id));
    } catch (err) {
      console.error('Failed to delete subject:', err);
      throw err;
    }
  };

  // Class-Subject-Teacher Assignment
  const assignSubjectToClass = async ({ classId, subjectId, teacherId }) => {
    try {
      const res = await allocationsApi.createAllocation({ classId, subjectId, teacherId });
      const newAsg = res.data.allocation;
      setAssignments((prev) => {
        const filtered = prev.filter(
          (a) => !(a.classId === classId && a.subjectId === subjectId)
        );
        return [...filtered, newAsg];
      });
      return newAsg;
    } catch (err) {
      console.error('Failed to assign course:', err);
      throw err;
    }
  };

  const removeAssignment = async (id) => {
    try {
      await allocationsApi.deleteAllocation(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to remove allocation:', err);
      throw err;
    }
  };

  // Teacher Management CRUD
  const addTeacher = async (teacherData) => {
    try {
      const res = await usersApi.createUser({ ...teacherData, role: 'teacher' });
      const created = res.data.user;
      setTeachers((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error('Failed to add teacher:', err);
      throw err;
    }
  };

  const updateTeacher = async (id, data) => {
    try {
      const res = await usersApi.updateUser(id, data);
      const updated = res.data.user;
      setTeachers((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    } catch (err) {
      console.error('Failed to update teacher:', err);
      throw err;
    }
  };

  const deleteTeacher = async (id) => {
    try {
      await usersApi.deleteUser(id);
      setTeachers((prev) => prev.filter((t) => t.id !== id));
      setAssignments((prev) => prev.filter((a) => a.teacherId !== id));
    } catch (err) {
      console.error('Failed to delete teacher:', err);
      throw err;
    }
  };

  // Student Management & CSV Import
  const addStudent = async (studentData) => {
    try {
      const res = await usersApi.createUser({ ...studentData, role: 'student' });
      const created = res.data.user;
      setStudents((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error('Failed to add student:', err);
      throw err;
    }
  };

  const updateStudent = async (id, studentData) => {
    try {
      const res = await usersApi.updateUser(id, studentData);
      const updated = res.data.user;
      setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return updated;
    } catch (err) {
      console.error('Failed to update student:', err);
      throw err;
    }
  };

  const deleteStudent = async (id) => {
    try {
      await usersApi.deleteUser(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete student:', err);
      throw err;
    }
  };

  const importStudentsCSV = async (classId, parsedList) => {
    try {
      const res = await usersApi.importCSV(classId, parsedList);
      // Refresh students list
      const stuRes = await usersApi.getUsers({ role: 'student' });
      setStudents(stuRes.data?.users || []);
      return res.data?.importedCount || parsedList.length;
    } catch (err) {
      console.error('Failed to import CSV:', err);
      throw err;
    }
  };

  // Attendance Sessions CRUD
  const saveAttendanceSession = async ({ classId, subjectId, teacherId, date, records }) => {
    try {
      const res = await attendanceApi.markAttendance({
        classId,
        subjectId,
        date,
        records,
      });
      const newSession = res.data.session;
      setAttendanceSessions((prev) => [newSession, ...prev]);

      // If student is logged in, refresh their metrics
      if (currentUser?.role === 'student') {
        const studentMeRes = await attendanceApi.getStudentMe().catch(() => null);
        if (studentMeRes?.data?.success) {
          setStudentPersonalData(studentMeRes.data);
        }
      }

      return { action: 'created', session: newSession };
    } catch (err) {
      console.error('Failed to save attendance session:', err);
      throw err;
    }
  };

  const updateAttendanceSession = async (sessionId, updatedRecords) => {
    try {
      const res = await attendanceApi.updateSession(sessionId, { records: updatedRecords });
      const updated = res.data.session;
      setAttendanceSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? updated : s))
      );
      return updated;
    } catch (err) {
      console.error('Failed to update attendance session:', err);
      throw err;
    }
  };

  // Settings
  const updateSettings = async (newSettings) => {
    try {
      const res = await settingsApi.updateSettings(newSettings);
      const saved = res.data.settings;
      setSettings(saved);
      return saved;
    } catch (err) {
      console.error('Failed to update settings:', err);
      throw err;
    }
  };

  // SELECTORS & COMPUTED METRICS

  // Calculate Student Attendance Metrics
  const getStudentMetrics = (studentId) => {
    // If student is logged in and personal data was returned by /api/attendance/student/me
    if (currentUser?.role === 'student' && studentPersonalData?.success) {
      return studentPersonalData;
    }

    // Client-side computed fallback for admin/teacher inspecting student
    const student = students.find((s) => s.id === studentId);
    if (!student) return null;

    const studentClass = classes.find((c) => c.id === student.classId);

    // Find all subjects assigned to this student's class
    const classAssignments = assignments.filter((a) => a.classId === student.classId);
    const assignedSubjectIds = classAssignments.map((a) => a.subjectId);
    const studentSubjects = subjects.filter((sub) => assignedSubjectIds.includes(sub.id));

    let totalConductedAll = 0;
    let totalAttendedAll = 0;

    const threshold = settings.minimumThreshold || 75;

    const subjectMetrics = studentSubjects.map((sub) => {
      const teacherAsg = classAssignments.find((a) => a.subjectId === sub.id);
      const teacher = teacherAsg ? teachers.find((t) => t.id === teacherAsg.teacherId) : null;

      const sessions = attendanceSessions.filter(
        (sess) => sess.classId === student.classId && sess.subjectId === sub.id
      );

      const conducted = sessions.length;
      let attended = 0;

      sessions.forEach((sess) => {
        const record = sess.records?.find((r) => r.studentId === student.id);
        if (record && record.status === 'Present') {
          attended += 1;
        }
      });

      const missed = conducted - attended;
      const percentage = conducted > 0 ? Number(((attended / conducted) * 100).toFixed(1)) : 0;

      totalConductedAll += conducted;
      totalAttendedAll += attended;

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
            ? 'At the threshold limit; cannot miss next class'
            : `${marginCount} class${marginCount > 1 ? 'es' : ''} can be skipped while maintaining ≥ ${threshold}%`;
      } else {
        marginCount = Math.ceil(((threshold / 100) * conducted - attended) / (1 - threshold / 100));
        marginType = 'danger';
        marginText = `Attend next ${marginCount} consecutive class${marginCount > 1 ? 'es' : ''} to reach ${threshold}%`;
      }

      return {
        id: sub.id,
        code: sub.code,
        name: sub.name,
        teacherName: teacher ? teacher.name : 'Unassigned',
        conducted,
        attended,
        missed,
        percentage,
        marginType,
        marginCount,
        marginText,
      };
    });

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

    const historyList = [];
    attendanceSessions
      .filter((sess) => sess.classId === student.classId)
      .forEach((sess) => {
        const record = sess.records?.find((r) => r.studentId === student.id);
        const sub = subjects.find((s) => s.id === sess.subjectId);
        const tea = teachers.find((t) => t.id === sess.teacherId);
        if (record) {
          historyList.push({
            sessionId: sess.id,
            date: sess.date,
            subjectCode: sub?.code || '',
            subjectName: sub?.name || 'Unknown',
            teacherName: tea?.name || 'Faculty',
            status: record.status,
          });
        }
      });

    historyList.sort((a, b) => new Date(b.date) - new Date(a.date));

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
        message: `Your overall attendance is ${overallPercentage}%, very close to ${threshold}%. Skipping any upcoming classes may put you into defaulter status.`,
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

    return {
      student,
      studentClass,
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
    };
  };

  // Calculate Class Metrics (for Teachers & Admin Reports)
  const getClassMetrics = (classId, subjectId = null) => {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return null;

    const classStudents = students.filter((s) => s.classId === classId);
    const threshold = settings.minimumThreshold || 75;

    const relevantSessions = attendanceSessions.filter(
      (s) => s.classId === classId && (!subjectId || s.subjectId === subjectId)
    );

    const studentReports = classStudents.map((st) => {
      let attended = 0;
      let total = 0;

      relevantSessions.forEach((sess) => {
        const rec = sess.records?.find((r) => r.studentId === st.id);
        if (rec) {
          total += 1;
          if (rec.status === 'Present') attended += 1;
        }
      });

      const percentage = total > 0 ? Number(((attended / total) * 100).toFixed(1)) : 0;
      const isDefaulter = percentage < threshold;

      return {
        id: st.id,
        rollNo: st.rollNo,
        name: st.name,
        email: st.email,
        classId: cls.id,
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
            (
              studentReports.reduce((acc, curr) => acc + curr.percentage, 0) / totalStudents
            ).toFixed(1)
          )
        : 0;

    return {
      cls,
      subjectId,
      studentReports,
      totalStudents,
      defaultersCount,
      regularCount,
      avgAttendance,
      threshold,
    };
  };

  // Calculate Teacher's assigned classes, subjects, and stats
  const getTeacherData = (teacherId) => {
    const teacher = teachers.find((t) => t.id === teacherId) || currentUser;
    if (!teacher) return null;

    const teacherAssignments = assignments.filter((a) => a.teacherId === teacherId);

    const assignedClassIds = [...new Set(teacherAssignments.map((a) => a.classId))];
    const assignedClasses = classes.filter((c) => assignedClassIds.includes(c.id));

    const assignedSubjectIds = [...new Set(teacherAssignments.map((a) => a.subjectId))];
    const assignedSubjects = subjects.filter((s) => assignedSubjectIds.includes(s.id));

    const teacherSessions = attendanceSessions.filter((s) => s.teacherId === teacherId);

    return {
      teacher,
      teacherAssignments,
      assignedClasses,
      assignedSubjects,
      teacherSessions,
    };
  };

  // Admin Overview Statistics
  const getAdminOverview = () => {
    const threshold = settings.minimumThreshold || 75;

    let defaultersCount = 0;
    let totalPctSum = 0;

    students.forEach((st) => {
      const studentSessions = attendanceSessions.filter((sess) => sess.classId === st.classId);
      let attended = 0;
      let total = 0;

      studentSessions.forEach((sess) => {
        const rec = sess.records?.find((r) => r.studentId === st.id);
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

    return {
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      totalSubjects: subjects.length,
      totalSessions: attendanceSessions.length,
      defaultersCount,
      averageAttendance,
      threshold,
    };
  };

  return (
    <AttendanceContext.Provider
      value={{
        classes,
        teachers,
        subjects,
        assignments,
        students,
        attendanceSessions,
        settings,
        currentUser,
        isLoading,
        login,
        logout,
        addClass,
        updateClass,
        deleteClass,
        addSubject,
        updateSubject,
        deleteSubject,
        assignSubjectToClass,
        removeAssignment,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addStudent,
        updateStudent,
        deleteStudent,
        importStudentsCSV,
        saveAttendanceSession,
        updateAttendanceSession,
        updateSettings,
        getStudentMetrics,
        getClassMetrics,
        getTeacherData,
        getAdminOverview,
        refreshData,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}
