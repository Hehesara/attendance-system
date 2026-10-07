import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import Modal from '../common/Modal';
import { Check, X, CheckCircle2 } from 'lucide-react';

export default function AttendanceHistoryView() {
  const {
    currentUser,
    getTeacherData,
    attendanceSessions,
    classes,
    subjects,
    students,
    updateAttendanceSession,
  } = useAttendance();

  const teacherId = currentUser?.id || currentUser?._id;
  const teacherData = getTeacherData(teacherId);

  const assignedClasses = teacherData?.assignedClasses || [];
  const assignedSubjects = teacherData?.assignedSubjects || [];

  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');

  const [activeSession, setActiveSession] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableRecords, setEditableRecords] = useState([]);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const teacherSessions = attendanceSessions
    .filter((s) => String(s.teacherId?._id || s.teacherId?.id || s.teacherId || '') === String(teacherId))
    .filter((s) => selectedClass === 'All' || String(s.classId?._id || s.classId?.id || s.classId || '') === String(selectedClass))
    .filter((s) => selectedSubject === 'All' || String(s.subjectId?._id || s.subjectId?.id || s.subjectId || '') === String(selectedSubject))
    .filter((s) => !selectedDate || s.date === selectedDate)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleOpenInspect = (sess, edit = false) => {
    setActiveSession(sess);
    setIsEditMode(edit);
    setEditableRecords(sess.records ? [...sess.records] : []);
    setSaveFeedback(false);
  };

  const toggleRecordStatus = (studentId) => {
    setEditableRecords((prev) =>
      prev.map((r) =>
        r.studentId === studentId
          ? { ...r, status: r.status === 'Present' ? 'Absent' : 'Present' }
          : r
      )
    );
  };

  const handleSaveEdits = () => {
    if (!activeSession) return;
    updateAttendanceSession(activeSession.id, editableRecords);
    setSaveFeedback(true);
    setTimeout(() => {
      setActiveSession(null);
      setIsEditMode(false);
      setSaveFeedback(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Attendance History</h2>
        <p className="text-xs text-slate-500 mt-0.5">View and revise previously conducted lecture sessions</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white"
            >
              <option value="All">All Classes</option>
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
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white"
            >
              <option value="All">All Subjects</option>
              {assignedSubjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white"
            />
          </div>
        </div>

        {selectedDate && (
          <button
            onClick={() => setSelectedDate('')}
            className="text-xs text-indigo-600 hover:underline"
          >
            Clear Date
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4 text-center">Attendance</th>
                <th className="py-3 px-4 text-center">Rate</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teacherSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                    No conducted sessions found.
                  </td>
                </tr>
              ) : (
                teacherSessions.map((sess) => {
                  const cls = classes.find((c) => c.id === sess.classId);
                  const sub = subjects.find((s) => s.id === sess.subjectId);
                  const total = sess.records?.length || 0;
                  const present = sess.records?.filter((r) => r.status === 'Present').length || 0;
                  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

                  return (
                    <tr key={sess.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">{sess.date}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{cls?.name}</td>
                      <td className="py-3 px-4 text-slate-600">{sub?.name}</td>
                      <td className="py-3 px-4 text-center text-xs text-slate-600">
                        {present}/{total} Present
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${pct >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenInspect(sess, false)}
                            className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleOpenInspect(sess, true)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {activeSession && (
        <Modal
          isOpen={!!activeSession}
          onClose={() => {
            setActiveSession(null);
            setIsEditMode(false);
          }}
          title={isEditMode ? `Edit Attendance: ${activeSession.date}` : `Session Roster: ${activeSession.date}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            {saveFeedback && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Session updated successfully!</span>
              </div>
            )}

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {editableRecords.map((rec) => {
                const st = students.find((s) => s.id === rec.studentId);
                return (
                  <div key={rec.studentId} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-mono text-xs text-slate-500 mr-2">#{st?.rollNo}</span>
                      <span className="font-medium text-slate-900">{st?.name}</span>
                    </div>

                    {isEditMode ? (
                      <button
                        type="button"
                        onClick={() => toggleRecordStatus(rec.studentId)}
                        className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                          rec.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rec.status}
                      </button>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          rec.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {rec.status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveSession(null);
                  setIsEditMode(false);
                }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleSaveEdits}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
