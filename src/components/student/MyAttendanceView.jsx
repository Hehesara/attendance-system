import React from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function MyAttendanceView() {
  const { currentUser, getStudentMetrics } = useAttendance();

  const studentId = currentUser?.id || currentUser?._id;
  const metrics = getStudentMetrics(studentId);

  if (!metrics) {
    return <div className="p-6 text-slate-500">Loading attendance data...</div>;
  }

  const { subjectMetrics, threshold } = metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">My Subject Attendance</h2>
        <p className="text-xs text-slate-500 mt-0.5">Detailed breakdown of attended and missed classes by subject</p>
      </div>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjectMetrics.map((sub) => {
          const isSafe = sub.percentage >= threshold;

          return (
            <div
              key={sub.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {sub.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1.5">{sub.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Teacher: {sub.teacherName}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-bold text-slate-900">{sub.percentage}%</span>
                    <p className="text-[11px] text-slate-400">Attendance</p>
                  </div>
                </div>

                <div className="py-3 flex justify-between text-xs text-slate-600">
                  <span>Attended: <strong className="text-slate-800">{sub.attended}</strong></span>
                  <span>Conducted: <strong className="text-slate-800">{sub.conducted}</strong></span>
                  <span>Missed: <strong className="text-slate-800">{sub.missed}</strong></span>
                </div>

                {/* Subtle Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                  <div
                    style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                    className={`h-full ${isSafe ? 'bg-indigo-600' : 'bg-rose-500'}`}
                  />
                </div>
              </div>

              {/* Margin Notice */}
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  isSafe
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                {isSafe ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>{sub.marginText}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
