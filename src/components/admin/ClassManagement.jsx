import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import Modal from '../common/Modal';
import { Plus, Edit2, Trash2, Users, BookOpen } from 'lucide-react';

export default function ClassManagement() {
  const {
    classes,
    addClass,
    updateClass,
    deleteClass,
    students,
    subjects,
    teachers,
    assignments,
    assignSubjectToClass,
    removeAssignment,
  } = useAttendance();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [rosterClass, setRosterClass] = useState(null);
  const [assignClass, setAssignClass] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    department: 'Information Technology',
    semester: 5,
    academicYear: '2026-2027',
  });

  const [assignForm, setAssignForm] = useState({
    subjectId: '',
    teacherId: '',
  });

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      department: 'Information Technology',
      semester: 5,
      academicYear: '2026-2027',
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (cls) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      department: cls.department,
      semester: cls.semester,
      academicYear: cls.academicYear || '2026-2027',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingClass) {
      updateClass(editingClass.id, formData);
      setEditingClass(null);
    } else {
      addClass(formData);
      setIsCreateOpen(false);
    }
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!assignClass || !assignForm.subjectId || !assignForm.teacherId) return;

    assignSubjectToClass({
      classId: assignClass.id,
      subjectId: assignForm.subjectId,
      teacherId: assignForm.teacherId,
    });

    setAssignForm({ subjectId: '', teacherId: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Class Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage class divisions, view rosters, and allocate subjects</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Class
        </button>
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => {
          const classStudents = students.filter((s) => s.classId === cls.id);
          const classAssignments = assignments.filter((a) => a.classId === cls.id);

          return (
            <div
              key={cls.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-lg">{cls.name}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete class ${cls.name}?`)) deleteClass(cls.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="py-3 text-xs text-slate-600 space-y-1">
                  <p>Department: <span className="font-semibold text-slate-800">{cls.department}</span></p>
                  <p>Semester: <span className="font-semibold text-slate-800">Sem {cls.semester}</span></p>
                  <p>Students Enrolled: <span className="font-semibold text-slate-800">{classStudents.length}</span></p>
                </div>

                {/* Assigned Courses */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">
                    Assigned Subjects ({classAssignments.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {classAssignments.length === 0 ? (
                      <span className="text-[11px] text-slate-400">None assigned</span>
                    ) : (
                      classAssignments.map((asg) => {
                        const sub = subjects.find((s) => s.id === asg.subjectId);
                        return (
                          <span
                            key={asg.id}
                            className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                          >
                            {sub?.code || sub?.name}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => setRosterClass(cls)}
                  className="flex-1 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-slate-500" /> Roster ({classStudents.length})
                </button>
                <button
                  onClick={() => setAssignClass(cls)}
                  className="flex-1 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" /> Assign Subjects
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isCreateOpen || !!editingClass}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingClass(null);
        }}
        title={editingClass ? `Edit Class: ${editingClass.name}` : 'Create New Class'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Class Name (e.g. TE IT-A)</label>
            <input
              type="text"
              required
              placeholder="e.g. TE IT-A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingClass(null);
              }}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              {editingClass ? 'Save Changes' : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Roster Modal */}
      {rosterClass && (
        <Modal
          isOpen={!!rosterClass}
          onClose={() => setRosterClass(null)}
          title={`Enrolled Students: ${rosterClass.name}`}
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
                  .filter((s) => s.classId === rosterClass.id)
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

      {/* Assign Subjects Modal */}
      {assignClass && (
        <Modal
          isOpen={!!assignClass}
          onClose={() => setAssignClass(null)}
          title={`Assign Subjects to ${assignClass.name}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <form onSubmit={handleAssignSubmit} className="p-3 bg-slate-50 rounded-lg space-y-3 border border-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                  <select
                    required
                    value={assignForm.subjectId}
                    onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="">-- Choose Subject --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code}: {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Teacher</label>
                  <select
                    required
                    value={assignForm.teacherId}
                    onChange={(e) => setAssignForm({ ...assignForm, teacherId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="">-- Choose Teacher --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Assign Subject
              </button>
            </form>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              {assignments.filter((a) => a.classId === assignClass.id).map((asg) => {
                const sub = subjects.find((s) => s.id === asg.subjectId);
                const tea = teachers.find((t) => t.id === asg.teacherId);
                return (
                  <div key={asg.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{sub?.code}: {sub?.name}</p>
                      <p className="text-slate-500">Teacher: {tea?.name || 'Unassigned'}</p>
                    </div>
                    <button
                      onClick={() => removeAssignment(asg.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
