import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Settings, UserPlus, Trash2, Users } from 'lucide-react';

export default function AdminDashboard({ setActiveTab }) {
  const {
    settings,
    updateSettings,
    students,
    teachers,
    classes,
    addStudent,
    addTeacher,
    deleteStudent,
    deleteTeacher,
    getClassMetrics,
  } = useAttendance();

  const [threshold, setThreshold] = useState(settings.minimumThreshold || 75);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Student');

  // Handle threshold change
  const handleThresholdChange = (val) => {
    setThreshold(val);
    updateSettings({ minimumThreshold: Number(val) || 75 });
  };

  // Handle Add User
  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    if (newRole === 'Student') {
      const defaultClassId = classes[0]?.id || '';
      addStudent({
        rollNo: String(100 + students.length + 1),
        name: newName.trim(),
        email: `${newName.toLowerCase().replace(/\s+/g, '.')}@college.edu`,
        classId: defaultClassId,
        department: 'Information Technology',
      });
    } else {
      addTeacher({
        name: newName.trim(),
        email: `${newName.toLowerCase().replace(/\s+/g, '.')}@college.edu`,
        department: 'Information Technology',
        designation: 'Assistant Professor',
      });
    }

    setNewName('');
  };

  // Combined system users list for the System Users card
  const systemUsers = [
    ...students.map((s) => ({
      id: s.id,
      name: s.name,
      role: 'Student',
      department: s.department ? `${s.department} Department` : 'IT Department',
      rawType: 'student',
    })),
    ...teachers.map((t) => ({
      id: t.id,
      name: t.name,
      role: 'Teacher',
      department: t.department ? `${t.department} Department` : 'IT Department',
      rawType: 'teacher',
    })),
  ];

  return (
    <div className="space-y-6">
      {/* 1. Attendance Minimum Threshold Card (Exact Reference Screenshot Style) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-indigo-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-base">Attendance Minimum Threshold</h3>
            <p className="text-xs text-slate-500">Alert triggers when attendance drops below this mark</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="50"
            max="100"
            value={threshold}
            onChange={(e) => handleThresholdChange(e.target.value)}
            className="w-16 border border-slate-200 rounded-lg px-3 py-1.5 text-center text-sm font-bold text-slate-800 bg-white"
          />
          <span className="text-sm font-semibold text-slate-600">%</span>
        </div>
      </div>

      {/* 2. Add New User Card (Exact Reference Screenshot Style) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-base">Add New User</h3>
        </div>

        <form onSubmit={handleAddUser} className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
          <input
            type="text"
            placeholder="Full Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
          </select>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            Add User
          </button>
        </form>
      </div>

      {/* 3. System Users Card (Exact Reference Screenshot Style) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 pt-5 pb-3">
          <h3 className="font-bold text-slate-900 text-base">System Users</h3>
        </div>

        <div className="divide-y divide-slate-100">
          {systemUsers.map((u) => (
            <div key={u.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/50">
              <div>
                <p className="font-semibold text-slate-900 text-sm">{u.name}</p>
                <p className="text-xs text-slate-500">{u.department}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                  {u.role}
                </span>
                <button
                  onClick={() => {
                    if (confirm(`Delete ${u.name}?`)) {
                      if (u.rawType === 'student') deleteStudent(u.id);
                      else deleteTeacher(u.id);
                    }
                  }}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                  title="Delete user"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Academic Class Overview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Academic Divisions Attendance Summary</h3>
          <button
            onClick={() => setActiveTab('classes')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Manage Classes →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
              <tr>
                <th className="py-3 px-6">Class</th>
                <th className="py-3 px-6">Students</th>
                <th className="py-3 px-6 text-center">Average Attendance</th>
                <th className="py-3 px-6 text-right">Defaulters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.map((cls) => {
                const classData = getClassMetrics(cls.id);
                const avgPct = classData ? classData.avgAttendance : 0;
                const defCount = classData ? classData.defaultersCount : 0;
                const count = classData ? classData.totalStudents : 0;

                return (
                  <tr key={cls.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-6 font-semibold text-slate-900">{cls.name}</td>
                    <td className="py-3 px-6 text-slate-600">{count}</td>
                    <td className="py-3 px-6 text-center font-bold text-slate-800">{avgPct}%</td>
                    <td className="py-3 px-6 text-right">
                      {defCount > 0 ? (
                        <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                          {defCount} Defaulter{defCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                          None
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
