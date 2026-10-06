import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import AttendanceTrendChart from '../common/AttendanceTrendChart';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function StudentStatisticsView() {
  const { currentUser, getStudentMetrics, settings } = useAttendance();

  const studentId = currentUser?.id || 'stu-101';
  const metrics = getStudentMetrics(studentId);

  const [simulatedSubjectId, setSimulatedSubjectId] = useState('');
  const [extraAttended, setExtraAttended] = useState(2);
  const [extraMissed, setExtraMissed] = useState(0);

  if (!metrics) {
    return <div className="p-6 text-slate-500">Loading attendance statistics...</div>;
  }

  const {
    threshold,
    overallPercentage,
    subjectMetrics,
    trendData,
  } = metrics;

  const activeSimSubject =
    subjectMetrics.find((s) => s.id === simulatedSubjectId) || subjectMetrics[0];

  const simulatedConducted = (activeSimSubject?.conducted || 0) + extraAttended + extraMissed;
  const simulatedAttended = (activeSimSubject?.attended || 0) + extraAttended;
  const simulatedPercentage =
    simulatedConducted > 0
      ? Number(((simulatedAttended / simulatedConducted) * 100).toFixed(1))
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Attendance Statistics & Trends</h2>
          <p className="text-xs text-slate-500 mt-0.5">Progress curve, margin calculations, and what-if simulation</p>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg self-start sm:self-auto">
          Target: {threshold}%
        </span>
      </div>

      {/* Visual Trend Chart Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="font-semibold text-slate-900 text-sm">Attendance Trend Over Time</h3>
        <AttendanceTrendChart trendData={trendData} threshold={threshold} />
      </div>

      {/* Course Margin Analysis Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 text-sm">Subject Margin Analysis</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4 text-center">Conducted</th>
                <th className="py-3 px-4 text-center">Attended</th>
                <th className="py-3 px-4 text-center">Missed</th>
                <th className="py-3 px-4 text-center">Current %</th>
                <th className="py-3 px-4">Margin Advice</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjectMetrics.map((sub) => {
                const isSafe = sub.percentage >= threshold;
                return (
                  <tr key={sub.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {sub.name} <span className="text-xs font-mono text-slate-500">({sub.code})</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-600">{sub.conducted}</td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-emerald-700 font-semibold">
                      {sub.attended}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-rose-700 font-semibold">
                      {sub.missed}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {sub.percentage}%
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {sub.marginText}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
                          isSafe
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isSafe ? 'Safe' : 'Low'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clean White What-If Simulator Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Attendance Calculator (What-If)</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Test how attending or missing future classes impacts your percentage
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Subject</label>
            <select
              value={activeSimSubject?.id}
              onChange={(e) => setSimulatedSubjectId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              {subjectMetrics.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.percentage}%)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Next Classes Attended
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={extraAttended}
              onChange={(e) => setExtraAttended(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Next Classes Missed
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={extraMissed}
              onChange={(e) => setExtraMissed(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-mono"
            />
          </div>
        </div>

        {/* Projected Outcome in Clean White Panel */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Projected Attendance</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-base text-slate-400 line-through">
                {activeSimSubject?.percentage}%
              </span>
              <span className="text-xl font-bold text-indigo-600">
                ➔ {simulatedPercentage}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {simulatedAttended} attended out of {simulatedConducted} total classes
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded text-xs font-semibold self-start sm:self-auto ${
              simulatedPercentage >= threshold
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {simulatedPercentage >= threshold ? 'Eligible (≥ 75%)' : 'Defaulter (< 75%)'}
          </span>
        </div>
      </div>
    </div>
  );
}
