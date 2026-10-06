import React from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function StudentDashboard({ setActiveTab }) {
  const { currentUser, getStudentMetrics } = useAttendance();

  const studentId = currentUser?.id || 'stu-101';
  const metrics = getStudentMetrics(studentId);

  if (!metrics) {
    return <div className="p-6 text-slate-500">Loading student attendance...</div>;
  }

  const {
    threshold,
    overallPercentage,
    overallStatus,
    subjectMetrics,
    alerts,
  } = metrics;

  return (
    <div className="space-y-6">
      {/* Alert Banner if attendance is low */}
      {overallPercentage < threshold && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            <strong>Warning:</strong> Your aggregate attendance ({overallPercentage}%) is below the required {threshold}% threshold. Please attend upcoming classes to avoid being placed on the defaulters list.
          </span>
        </div>
      )}

      {/* Overview Metric Card matching original StudentDashboard screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Overall Attendance</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{overallPercentage}%</span>
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                overallPercentage >= threshold
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              Target: {threshold}%
            </span>
          </div>
        </div>
      </div>

      {/* Subject-Wise Attendance Breakdown matching original screenshot */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Subject-wise Attendance</h3>
          <button
            onClick={() => setActiveTab('statistics')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View Trend & Statistics →
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {subjectMetrics.map((sub) => {
            const isSafe = sub.percentage >= threshold;
            return (
              <div
                key={sub.code}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {sub.code}
                  </span>
                  <h4 className="font-medium text-slate-900">{sub.name}</h4>
                  <p className="text-xs text-slate-500">
                    Attended {sub.attended} out of {sub.conducted} conducted sessions
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900">{sub.percentage}%</span>
                    <p
                      className={`text-xs flex items-center justify-end gap-1 mt-0.5 ${
                        isSafe ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {isSafe ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      {sub.marginText}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
