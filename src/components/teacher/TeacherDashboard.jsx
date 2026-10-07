import React from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { UserCheck, ArrowRight } from 'lucide-react';

export default function TeacherDashboard({ setActiveTab }) {
  const { currentUser, getTeacherData, students, getStudentMetrics, settings } = useAttendance();

  const teacherId = currentUser?.id || currentUser?._id;
  const teacherData = getTeacherData(teacherId);

  if (!teacherData) {
    return <div className="p-4 text-slate-500">Loading teacher dashboard...</div>;
  }

  const { assignedClasses, assignedSubjects, teacherAssignments, teacherSessions } = teacherData;
  const threshold = settings.minimumThreshold || 75;

  const enrolledStudents = students.filter((s) => {
    const sClsId = String(s.classId?._id || s.classId?.id || s.classId || '');
    return assignedClasses.some((c) => String(c.id || c._id) === sClsId);
  });

  const defaulterCount = enrolledStudents.filter((st) => {
    const m = getStudentMetrics(st.id);
    return m && m.overallPercentage < threshold;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header with Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Teacher Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">Faculty course allocations and session overview</p>
        </div>

        <button
          onClick={() => setActiveTab('mark')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <UserCheck className="w-4 h-4" /> Mark Attendance
        </button>
      </div>

      {/* Simple Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">My Classes</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{assignedClasses.length}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">My Subjects</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{assignedSubjects.length}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Sessions Conducted</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{teacherSessions.length}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Defaulters in Classes</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{defaulterCount}</p>
        </div>
      </div>

      {/* Assigned Classes and Recent Sessions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocated Classes Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm">Assigned Classes & Courses</h3>
            <button
              onClick={() => setActiveTab('my-classes')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {teacherAssignments.map((asg) => {
              const aClsId = String(asg.classId?._id || asg.classId?.id || asg.classId || '');
              const aSubId = String(asg.subjectId?._id || asg.subjectId?.id || asg.subjectId || '');
              const cls = assignedClasses.find((c) => String(c.id || c._id) === aClsId);
              const sub = assignedSubjects.find((s) => String(s.id || s._id) === aSubId);
              const classCount = students.filter((s) => {
                const sClsId = String(s.classId?._id || s.classId?.id || s.classId || '');
                return sClsId === aClsId;
              }).length;

              return (
                <div key={asg.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{cls?.name}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-700">{sub?.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Code: <span className="font-mono">{sub?.code}</span> | {classCount} students
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('mark')}
                    className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Mark
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Conducted Sessions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm">Recent Sessions</h3>
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              History <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {teacherSessions.length === 0 ? (
              <p className="p-6 text-sm text-slate-400 text-center">No sessions recorded yet.</p>
            ) : (
              teacherSessions.slice(0, 5).map((sess) => {
                const cls = assignedClasses.find((c) => c.id === sess.classId);
                const sub = assignedSubjects.find((s) => s.id === sess.subjectId);
                const total = sess.records?.length || 0;
                const present = sess.records?.filter((r) => r.status === 'Present').length || 0;

                return (
                  <div key={sess.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {cls?.name} - {sub?.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Date: {sess.date}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-800">
                        {present}/{total} Present
                      </span>
                      <p className="text-[11px] text-emerald-600 font-medium">
                        {total > 0 ? Math.round((present / total) * 100) : 0}% Attendance
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
