import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Download, Search, FileSpreadsheet, AlertTriangle } from 'lucide-react';

export default function TeacherReportsView() {
  const { currentUser, getTeacherData, students, attendanceSessions, settings } = useAttendance();

  const teacherId = currentUser?.id || 'tea-sharma';
  const teacherData = getTeacherData(teacherId);

  const assignedClasses = teacherData?.assignedClasses || [];
  const assignedSubjects = teacherData?.assignedSubjects || [];

  const [selectedClassId, setSelectedClassId] = useState(assignedClasses[0]?.id || 'All');
  const [selectedSubjectId, setSelectedSubjectId] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const threshold = settings.minimumThreshold || 75;

  const reportRows = [];

  students
    .filter((s) => selectedClassId === 'All' || s.classId === selectedClassId)
    .filter((s) => assignedClasses.some((c) => c.id === s.classId))
    .forEach((st) => {
      const cls = assignedClasses.find((c) => c.id === st.classId);

      const relevantSessions = attendanceSessions.filter(
        (sess) =>
          sess.classId === st.classId &&
          sess.teacherId === teacherId &&
          (selectedSubjectId === 'All' || sess.subjectId === selectedSubjectId)
      );

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

      reportRows.push({
        id: st.id,
        rollNo: st.rollNo,
        name: st.name,
        className: cls ? cls.name : 'Unknown',
        attended,
        total,
        percentage,
        status: isDefaulter ? 'Defaulter' : 'Regular',
      });
    });

  const filteredRows = reportRows.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.rollNo.includes(searchTerm);
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = 'Roll No,Student Name,Class,Attended,Total,Attendance %,Status\n';
    const rows = filteredRows.map(
      (r) =>
        `${r.rollNo},"${r.name}","${r.className}",${r.attended},${r.total},${r.percentage}%,${r.status}`
    );
    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Class_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header matching original ReportsView style */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">Class Attendance Reports</h2>
            <p className="text-xs text-slate-500">Filter, analyze, and download attendance records</p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Download className="w-4 h-4" /> Export CSV / Excel
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name or roll..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="All">All My Classes</option>
            {assignedClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="All">All My Subjects</option>
            {assignedSubjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.code}: {sub.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="All">All Students</option>
            <option value="Regular">Regular (≥ {threshold}%)</option>
            <option value="Defaulter">Defaulters (&lt; {threshold}%)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
            <tr>
              <th className="py-3 px-4">Roll No</th>
              <th className="py-3 px-4">Student Name</th>
              <th className="py-3 px-4">Class</th>
              <th className="py-3 px-4 text-center">Attended / Total</th>
              <th className="py-3 px-4 text-center">Attendance %</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                  No student records match the applied filter.
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono text-xs text-slate-600">{r.rollNo}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{r.name}</td>
                  <td className="py-3 px-4 text-slate-600 text-xs">{r.className}</td>
                  <td className="py-3 px-4 text-center font-mono text-xs text-slate-600">
                    {r.attended} / {r.total}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-800">
                    {r.percentage}%
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        r.status === 'Regular'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status === 'Defaulter' && <AlertTriangle className="w-3 h-3" />}
                      {r.status}
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
