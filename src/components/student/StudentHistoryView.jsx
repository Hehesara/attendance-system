import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Filter } from 'lucide-react';

export default function StudentHistoryView() {
  const { currentUser, getStudentMetrics } = useAttendance();

  const studentId = currentUser?.id || 'stu-101';
  const metrics = getStudentMetrics(studentId);

  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  if (!metrics) {
    return <div className="p-6 text-slate-500">Loading attendance history...</div>;
  }

  const { historyList, subjectMetrics, totalAttendedAll, totalConductedAll, overallPercentage } = metrics;

  const filteredHistory = historyList.filter((item) => {
    const matchesSubject = selectedSubject === 'All' || item.subjectCode === selectedSubject;
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    return matchesSubject && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Attendance History</h2>
          <p className="text-xs text-slate-500 mt-0.5">Chronological record of every session conducted</p>
        </div>

        <div className="text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs self-start sm:self-auto">
          Total: <strong className="text-slate-900">{totalAttendedAll}</strong> / {totalConductedAll} ({overallPercentage}%)
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Course:</span>
          </div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white"
          >
            <option value="All">All Courses</option>
            {subjectMetrics.map((sub) => (
              <option key={sub.code} value={sub.code}>
                {sub.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
            <span>Status:</span>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present Only</option>
            <option value="Absent">Absent Only</option>
          </select>
        </div>

        <span className="text-xs text-slate-400">
          Showing {filteredHistory.length} sessions
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Course Code</th>
              <th className="py-3 px-4">Teacher</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                  No attendance records found.
                </td>
              </tr>
            ) : (
              filteredHistory.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono text-xs text-slate-600">{item.date}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{item.subjectName}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">{item.subjectCode}</td>
                  <td className="py-3 px-4 text-xs text-slate-600">{item.teacherName}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
                        item.status === 'Present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
