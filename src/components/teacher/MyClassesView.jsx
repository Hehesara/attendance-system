import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import Modal from '../common/Modal';
import { Users } from 'lucide-react';

export default function MyClassesView({ setActiveTab }) {
  const { currentUser, getTeacherData, students } = useAttendance();

  const teacherId = currentUser?.id || currentUser?._id;
  const teacherData = getTeacherData(teacherId);

  const [inspectClass, setInspectClass] = useState(null);

  if (!teacherData) {
    return <div className="p-4 text-slate-500">Loading classes...</div>;
  }

  const { assignedClasses, assignedSubjects, teacherAssignments } = teacherData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">My Classes & Subjects</h2>
        <p className="text-xs text-slate-500 mt-0.5">Classes and subjects officially allocated to you</p>
      </div>

      {/* Class Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignedClasses.map((cls) => {
          const clsId = String(cls.id || cls._id || '');
          const classStudents = students.filter((s) => {
            const sClsId = String(s.classId?._id || s.classId?.id || s.classId || '');
            return sClsId === clsId;
          });
          const taughtSubjects = teacherAssignments
            .filter((a) => {
              const aClsId = String(a.classId?._id || a.classId?.id || a.classId || '');
              return aClsId === clsId;
            })
            .map((a) => {
              const aSubId = String(a.subjectId?._id || a.subjectId?.id || a.subjectId || '');
              return assignedSubjects.find((s) => String(s.id || s._id) === aSubId);
            })
            .filter(Boolean);

          return (
            <div
              key={cls.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">{cls.name}</h3>
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                  {classStudents.length} Students
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>Department: <span className="font-semibold text-slate-800">{cls.department}</span></p>
                <p>Semester: <span className="font-semibold text-slate-800">Sem {cls.semester}</span></p>
              </div>

              {/* Subjects */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-600 mb-2">Your Subjects in {cls.name}:</p>
                <div className="space-y-1.5">
                  {taughtSubjects.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{sub.name}</p>
                        <p className="text-[11px] font-mono text-slate-500">{sub.code}</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('mark')}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                      >
                        Mark
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roster Button */}
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setInspectClass(cls)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-slate-500" /> View Roster ({classStudents.length})
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Roster Modal */}
      {inspectClass && (
        <Modal
          isOpen={!!inspectClass}
          onClose={() => setInspectClass(null)}
          title={`Enrolled Students: ${inspectClass.name}`}
          maxWidth="max-w-xl"
        >
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Roll No</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students
                  .filter((s) => {
                    const sClsId = String(s.classId?._id || s.classId?.id || s.classId || '');
                    const iClsId = String(inspectClass?.id || inspectClass?._id || '');
                    return sClsId === iClsId;
                  })
                  .sort((a, b) => Number(a.rollNo) - Number(b.rollNo))
                  .map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono text-xs text-slate-600">#{st.rollNo}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{st.name}</td>
                      <td className="py-2 px-3 text-xs text-slate-500">{st.email}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}
