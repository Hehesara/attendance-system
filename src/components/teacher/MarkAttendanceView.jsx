import React, { useState, useEffect } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { UserCheck, Search, Check, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function MarkAttendanceView() {
  const {
    currentUser,
    getTeacherData,
    students,
    getStudentMetrics,
    saveAttendanceSession,
    attendanceSessions,
    settings,
  } = useAttendance();

  const teacherId = currentUser?.id || 'tea-sharma';
  const teacherData = getTeacherData(teacherId);

  const assignedClasses = teacherData?.assignedClasses || [];
  const assignedSubjects = teacherData?.assignedSubjects || [];
  const teacherAssignments = teacherData?.teacherAssignments || [];

  const [selectedClassId, setSelectedClassId] = useState(assignedClasses[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [attendanceSheet, setAttendanceSheet] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveFeedback, setSaveFeedback] = useState(null);

  // Available subjects for selected class taught by this teacher
  const availableSubjectsForClass = teacherAssignments
    .filter((a) => a.classId === selectedClassId)
    .map((a) => assignedSubjects.find((s) => s.id === a.subjectId))
    .filter(Boolean);

  useEffect(() => {
    if (availableSubjectsForClass.length > 0) {
      if (!availableSubjectsForClass.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(availableSubjectsForClass[0].id);
      }
    } else {
      setSelectedSubjectId('');
    }
  }, [selectedClassId, teacherAssignments]);

  useEffect(() => {
    if (!selectedClassId) return;

    const classStudents = students
      .filter((s) => s.classId === selectedClassId)
      .sort((a, b) => Number(a.rollNo) - Number(b.rollNo));

    const existingSession = attendanceSessions.find(
      (sess) =>
        sess.classId === selectedClassId &&
        sess.subjectId === selectedSubjectId &&
        sess.date === date
    );

    const sheet = classStudents.map((st) => {
      const metrics = getStudentMetrics(st.id);
      const overallPct = metrics ? metrics.overallPercentage : 0;

      let status = 'Present';
      if (existingSession) {
        const rec = existingSession.records?.find((r) => r.studentId === st.id);
        if (rec) status = rec.status;
      }

      return {
        studentId: st.id,
        rollNo: st.rollNo,
        name: st.name,
        overallPct,
        status,
      };
    });

    setAttendanceSheet(sheet);
  }, [selectedClassId, selectedSubjectId, date, students, attendanceSessions]);

  const toggleStatus = (studentId) => {
    setAttendanceSheet((prev) =>
      prev.map((row) =>
        row.studentId === studentId
          ? { ...row, status: row.status === 'Present' ? 'Absent' : 'Present' }
          : row
      )
    );
  };

  const markAllPresent = () => {
    setAttendanceSheet((prev) => prev.map((r) => ({ ...r, status: 'Present' })));
  };

  const markAllAbsent = () => {
    setAttendanceSheet((prev) => prev.map((r) => ({ ...r, status: 'Absent' })));
  };

  const handleSave = () => {
    if (!selectedClassId || !selectedSubjectId || attendanceSheet.length === 0) return;

    const records = attendanceSheet.map((r) => ({
      studentId: r.studentId,
      status: r.status,
    }));

    const result = saveAttendanceSession({
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      teacherId,
      date,
      records,
    });

    const targetClass = assignedClasses.find((c) => c.id === selectedClassId);
    const targetSubject = assignedSubjects.find((s) => s.id === selectedSubjectId);

    setSaveFeedback(
      `Attendance saved for ${targetClass?.name} - ${targetSubject?.name} on ${date}`
    );

    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const filteredRows = attendanceSheet.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.rollNo.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {saveFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{saveFeedback}</span>
        </div>
      )}

      {/* Subject & Date Selection Controls matching original TeacherView screenshot */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {assignedClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={availableSubjectsForClass.length === 0}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {availableSubjectsForClass.length === 0 ? (
                <option value="">No subjects assigned</option>
              ) : (
                availableSubjectsForClass.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <UserCheck className="w-4 h-4" /> Save Attendance
        </button>
      </div>

      {/* Student Attendance Marking List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or roll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <button
              onClick={markAllPresent}
              className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
            >
              Mark All Present
            </button>
            <button
              onClick={markAllAbsent}
              className="text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
            >
              Mark All Absent
            </button>
            <div className="border-l border-slate-200 pl-3">
              Total Students: <span className="font-semibold text-slate-800">{attendanceSheet.length}</span>
            </div>
          </div>
        </div>

        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th className="py-3 px-4">Roll No</th>
              <th className="py-3 px-4">Student Name</th>
              <th className="py-3 px-4">Overall %</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.map((s) => (
              <tr key={s.studentId} className="hover:bg-slate-50/50">
                <td className="py-3 px-4 text-slate-600 font-mono text-xs">{s.rollNo}</td>
                <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2">
                  {s.name}
                  {s.overallPct < (settings.minimumThreshold || 75) && (
                    <span
                      className="flex items-center text-amber-600 text-xs bg-amber-50 px-2 py-0.5 rounded-full"
                      title="Low Attendance Alert"
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" /> Low
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-600">{s.overallPct}%</td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => toggleStatus(s.studentId)}
                    className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 mx-auto cursor-pointer ${
                      s.status === 'Present'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                    }`}
                  >
                    {s.status === 'Present' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                    {s.status}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
